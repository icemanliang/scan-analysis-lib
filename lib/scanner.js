const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const winston = require('winston');
const config = require('./config');
const { MASTER_LOG_NAME, WORKER_RESULT_NAME, WORKER_LOG_NAME } = require('./const');

class Scanner {
  constructor(userConfig = {}) {
    this.initializeConfig(userConfig);
    this.initializeLogger();
    this.ensureResultDir();
  }

  // 初始化配置
  initializeConfig(userConfig) {
    this.resultDir = config.getConfig(userConfig).resultDir;
    this.sources = config.getConfig(userConfig).sources;
    this.plugins = config.getConfig(userConfig).plugins;
    this.maxWorkerNum = config.getConfig(userConfig).maxWorkerNum;
    this.queue = [];
  }

  // 初始化日志系统
  initializeLogger() {
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level} ${message}`)
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level} ${message}`)
    );

    this.logger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.File({ 
          dirname: this.resultDir,
          filename: MASTER_LOG_NAME,
          format: fileFormat,
          options: { flags: 'w' }
        }),
        new winston.transports.Console({
          format: consoleFormat
        })
      ]
    });
  }

  // 确保结果目录存在
  ensureResultDir() {
    if (!fs.existsSync(this.resultDir)) {
      fs.mkdirSync(this.resultDir, { recursive: true });
    }
  }

  // 创建并管理子进程
  async createWorker(source) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const resultDir = this.prepareAppResultDir(source.appName);

      const child = this.spawnWorkerProcess(source, resultDir);      
      this.setupWorkerEventHandlers(child, source.appName, startTime, resultDir, resolve, reject);
    });
  }

  // 准备应用结果目录
  prepareAppResultDir(appName) {
    const resultDir = path.join(this.resultDir, appName);
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }
    return resultDir;
  }

  // 替换正则表达式
  replacer(key, value) {
    if (value instanceof RegExp) {
      return { __regexp: true, pattern: value.source, flags: value.flags };
    }
    return value;
  }

  // 创建子进程
  spawnWorkerProcess(source, resultDir) {
    return fork(path.resolve(__dirname, 'worker.js'), [JSON.stringify(source), resultDir, JSON.stringify(this.plugins, this.replacer)]);
  }

  // 设置子进程事件处理
  setupWorkerEventHandlers(child, appName, startTime, resultDir, resolve, reject) {
    child.on('message', (message) => {
      if (message.type === 'log') {
        this.logger.log(message.level, message.text);
      }
    });

    child.on('exit', (code) => {
      const duration = Date.now() - startTime;
      this.logger.info(`[${appName}] worker total time: ${duration} ms`);

      const resultFile = path.join(resultDir, WORKER_RESULT_NAME);
      const logFile = path.join(resultDir, WORKER_LOG_NAME);
      
      if (code === 0 && fs.existsSync(resultFile) && fs.existsSync(logFile)) {
        resolve({ appName, duration, resultFile, logFile });
      } else {
        reject(new Error(`[${appName}] exited with code ${code}`));
      }
    });

    child.on('error', error => {
      this.logger.error(`[${appName}] error: ${error.message}`);
      reject(error);
    });
  }

  // 并行任务处理
  async processQueue(concurrency) {
    const tasks = this.queue.map(source => 
      () => this.createWorker(source)
    );

    const pool = new Set();
    const results = [];

    for (const task of tasks) {
      if (pool.size >= concurrency) {
        await Promise.race(pool);
      }
      
      const promise = task()
        .then(result => {
          results.push(result);
          pool.delete(promise);
        })
        .catch(error => {
          this.logger.error('task queue error:', error);
          pool.delete(promise);
        });

      pool.add(promise);
    }

    await Promise.all(pool);
    return results;
  }

  // 保存扫描结果
  saveScanResults(results) {
    const summaryFile = path.join(this.resultDir, 'manifest.json');
    fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
  }

  // 扫描主入口
  async scan() {
    this.logger.info(`[main] master scan started, total applications: ${this.sources.length}`);
    
    try {
      if (!this.resultDir) {
        throw new Error('resultDir is not defined in the configuration');
      }

      const startTime = Date.now();
      this.queue = this.sources;
      const results = await this.processQueue(this.maxWorkerNum);
      
      this.ensureResultDir();

      const endTime = Date.now();
      this.logger.info(`[main] master scan completed, total time: ${endTime - startTime} ms`);

      const formattedResults = {
        scanResults: results,
        scanTotalTime: endTime - startTime,
        scanLogFile: path.join(this.resultDir, MASTER_LOG_NAME)
      };
      this.saveScanResults(formattedResults);
      return formattedResults;
    } catch (error) {
      this.logger.error(`[main] master scan error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Scanner;
