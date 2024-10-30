const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const winston = require('winston');
const config = require('../config');

// 扫描Core类
class Scanner {
  constructor(userConfig = {}) {
    this.config = config.getConfig(userConfig);
    this.tempDir = this.config.FINAL_RESULT_DIR;
    this.resultFiles = [];
    this.queue = [];

    // 配置日志记录
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level} ${message}`)
      ),
      transports: [
        new winston.transports.File({ dirname: this.tempDir, filename: 'scanner.log' }),
        new winston.transports.Console()
      ]
    });

    // 确保目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // 并行控制器
  async processQueue(concurrency) {
    const tasks = this.queue.map(({ appName, sourceDir }) => 
      () => this.scanTask(appName, sourceDir)
    );

    const pool = new Set();
    const results = [];

    for (const task of tasks) {
      if (pool.size >= concurrency) {
        await Promise.race(pool);
      }
      
      const promise = task().then(result => {
        results.push(result);
        pool.delete(promise);
      }).catch(error => {
        this.logger.error('Task error:', error);
        pool.delete(promise);
      });

      pool.add(promise);
    }

    await Promise.all(pool);
    return results;
  }

  async scanTask(appName, sourceDir) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const appResultDir = path.join(this.config.FINAL_RESULT_DIR, appName);
      const tempResultFile = path.join(appResultDir, `${appName}.json`);
      const pluginsConfig = JSON.stringify(this.config.plugins) 
      
      // 确保应用结果目录存在
      if (!fs.existsSync(appResultDir)) {
        fs.mkdirSync(appResultDir, { recursive: true });
      }
      
      this.resultFiles.push({ appName, resultFile: tempResultFile });

      const child = fork(path.resolve(__dirname, 'worker.js'), [
        sourceDir, 
        tempResultFile
      ]);

      child.on('message', (message) => { 
        if (message.type === 'log') {
          this.logger.log(message.level, message.text); // 这里的 message.text 已经包含了指纹
        }
      });
      
      child.on('exit', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        this.logger.info(`Child process ${appName} completed in ${duration} ms`);
        
        if (code === 0 && fs.existsSync(tempResultFile)) {
          resolve({
            appName,
            duration,
            resultFile: tempResultFile
          });
        } else {
          reject(new Error(`Child process exited with code ${code}`));
        }
      });
        
      child.on('error', error => {
        this.logger.error(`Child process ${appName} error: ${error.message}`);
        reject(error);
      });
    });
  }

  async runAnalysis() {
    this.logger.info('Starting analysis.');
    
    try {
      if (!this.config.FINAL_RESULT_DIR) {
        throw new Error('FINAL_RESULT_DIR is not defined in the configuration');
      }

      this.queue = this.config.source;

      const results = await this.processQueue(2); // 或者您想要的并发数

      if (!fs.existsSync(this.config.FINAL_RESULT_DIR)) {
        fs.mkdirSync(this.config.FINAL_RESULT_DIR, { recursive: true });
      }

      // 保存总结果
      const summaryFile = path.join(this.config.FINAL_RESULT_DIR, 'summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));

      this.logger.info('Analysis completed.');
      return results;
    } catch (error) {
      this.logger.error(`Error during run: ${error.message}`);
      throw error;
    }
  };
}

module.exports = Scanner;
