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
    this.config = config.getConfig(userConfig);
    this.queue = [];
  }

  // 初始化日志系统
  initializeLogger() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level} ${message}`)
      ),
      transports: [
        new winston.transports.File({ 
          dirname: this.config.resultDir,
          filename: MASTER_LOG_NAME,
          options: { flags: 'w' }
        }),
        new winston.transports.Console()
      ]
    });
  }

  // 确保结果目录存在
  ensureResultDir() {
    if (!fs.existsSync(this.config.resultDir)) {
      fs.mkdirSync(this.config.resultDir, { recursive: true });
    }
  }

  // 创建并管理子进程
  async createWorker(appName, baseDir) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const resultDir = this.prepareAppResultDir(appName);

      const child = this.spawnWorkerProcess(appName, baseDir, resultDir);      
      this.setupWorkerEventHandlers(child, appName, startTime, resultDir, resolve, reject);
    });
  }

  // 准备应用结果目录
  prepareAppResultDir(appName) {
    const resultDir = path.join(this.config.resultDir, appName);
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }
    return resultDir;
  }

  // 创建子进程
  spawnWorkerProcess(appName, baseDir, resultDir) {
    return fork(path.resolve(__dirname, 'worker.js'), [appName, baseDir, resultDir]);
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
    const tasks = this.queue.map(({ appName, baseDir }) => 
      () => this.createWorker(appName, baseDir)
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
          this.logger.error('Task Queue Error:', error);
          pool.delete(promise);
        });

      pool.add(promise);
    }

    await Promise.all(pool);
    return results;
  }

  // 保存扫描结果
  saveScanResults(results) {
    const summaryFile = path.join(this.config.resultDir, 'manifest.json');
    fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
  }

  // 扫描主入口
  async scan() {
    this.logger.info(`scan started, total tasks: ${this.config.sources.length}`);
    
    try {
      if (!this.config.resultDir) {
        throw new Error('resultDir is not defined in the configuration');
      }

      const startTime = Date.now();
      this.queue = this.config.sources;
      const results = await this.processQueue(2);
      
      this.ensureResultDir();
      this.saveScanResults(results);

      this.logger.info(`scan completed, total time: ${Date.now() - startTime} ms`);
      return results;
    } catch (error) {
      this.logger.error(`scan error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Scanner;
