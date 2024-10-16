const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const winston = require('winston');
const config = require('../config');

// 配置日志记录
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level} ${message}`)
  ),
  transports: [
    new winston.transports.File({ dirname: config.FINAL_RESULT_DIR, filename: 'scanner.log' }),
    new winston.transports.Console()
  ]
});

// 扫描Core类
class Scanner {
  constructor() {
    this.tempDir = config.FINAL_RESULT_DIR;
    this.resultFiles = [];
    this.queue = [];

    // 确保目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // 并行控制器
  async processQueue(num) {
    const that = this;
    return new Promise((resolve)=>{
      let count = 0;
      let index = 0;              // 指针

      async function post() {
        const name = that.queue[index].appName;
        const dir = that.queue[index].sourceDir;
        index++;

        try{
          await that.scanTask(name, dir);
        }catch(e){
          console.log(e);
        }

        count++;
        if(count === that.queue.length){
            resolve();
        }
        if(index < that.queue.length){
            post();
        }
      }

      // 开启并发
      for(let i=0; i< Math.min(num, that.queue.length); i++){
        post();
      }
    })
  }

  async scanTask(repoName, targetDir) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const tempResultFile = path.join(this.tempDir, `${repoName}.json`);
      
      // 确保目录存在
      const dir = path.dirname(tempResultFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      this.resultFiles.push({ repoName, resultFile: tempResultFile });

      const child = fork(path.resolve(__dirname, 'worker.js'), [targetDir, tempResultFile]);

      child.on('message', (message) => { 
        if (message.type === 'log') {
          logger.log(message.level, message.text);
        }
      });
      
      child.on('exit', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        logger.info(`Child process ${repoName} completed in ${duration} ms`);
        if (code === 0 && fs.existsSync(tempResultFile)) {
          resolve();
        } else {
          reject(new Error(`Child process exited with code ${code}`));
        }
      });
        
      child.on('error', error => {
        logger.error(`Child process ${repoName} error: ${error.message}`);
        reject(error);
      });
    });
  }

  async generateManifest() {
    const manifest = this.resultFiles.map(file => ({
      repoName: file.repoName,
      resultFile: path.relative(config.FINAL_RESULT_DIR, file.resultFile),
    }));

    fs.writeFileSync(path.join(config.FINAL_RESULT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
    logger.info('Generated manifest file with analysis results.');
  }

  async runAnalysis (config) {
    return new Promise(async (resolve, reject)=>{
      logger.info('Starting analysis.');
      
      try {
        this.queue = config.source

        await this.processQueue(2);

        if (!fs.existsSync(config.FINAL_RESULT_DIR)) {
          fs.mkdirSync(config.FINAL_RESULT_DIR);
        }

        await this.generateManifest();
        logger.info('Analysis completed.');
        // logger.info('Upload completed.');
        resolve();
      } catch (error) {
        logger.error(`Error during run: ${error.message}`);
        reject();
      }
    })
  };
}

module.exports = Scanner;
