const ConfigCheckPlugin = require('../plugins/config-check-plugin');
// const RedundancyCheckPlugin = require('../plugins/redundancy-check-plugin'); 
const EslintCheckPlugin = require('../plugins/eslint-check-plugin'); 
const CountCheckPlugin = require('../plugins/count-check-plugin');
const PackageCheckPlugin = require('../plugins/package-check-plugin');
const FileCheckPlugin = require('../plugins/file-check-plugin');
const DependencyCheckPlugin = require('../plugins/dependency-check-plugin');
const BuildCheckPlugin = require('../plugins/build-check-plugin');
const StylelintCheckPlugin = require('../plugins/stylelint-check-plugin');

const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { AsyncSeriesHook } = require('tapable');
const { WORKER_RESULT_NAME, WORKER_LOG_NAME } = require('./const');

class Worker {
  constructor(appName, baseDir, resultDir) {
    this.initializeBasicInfo(appName, baseDir, resultDir);
    this.initializeLogger();
    this.initializeHooks();
  }

  // 初始化基本信息
  initializeBasicInfo(appName, baseDir, resultDir) {
    this.appName = appName;
    this.baseDir = baseDir;
    this.resultFile = path.join(resultDir, WORKER_RESULT_NAME);
    this.logFile = path.join(resultDir, WORKER_LOG_NAME);
    this.scanResults = {};
  }

  // 初始化日志系统
  initializeLogger() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => 
          `${timestamp} ${level}: ${message}`
        )
      ),
      transports: [
        new winston.transports.File({ 
          filename: this.logFile,
          options: { flags: 'w' }
        })
      ]
    });
  }

  // 初始化钩子系统
  initializeHooks() {
    this.hooks = {
      code: new AsyncSeriesHook(['context']),
      project: new AsyncSeriesHook(['context']),
      dependency: new AsyncSeriesHook(['context']),
      build: new AsyncSeriesHook(['context'])
    };
  }

  // 日志记录
  log(level, message) {
    this.logger.log(level, message);
    this.sendMessageToParent('log', level, message);
  }

  // 向父进程发送消息
  sendMessageToParent(type, level, text) {
    if (process.send) {
      process.send({ 
        type, 
        level, 
        text: `[${this.appName}] ${text}` 
      });
    }
  }

  // 运行插件
  async runPlugin(context) {
    this.prepareContext(context);

    try {
      this.log('info', 'plugins started');
      await this.hooks.code.promise(context);
      await this.hooks.project.promise(context);
      await this.hooks.dependency.promise(context);
      await this.hooks.build.promise(context);
      this.log('info', 'plugins completed');
    } catch (error) {
      this.log('error', `plugins error: ${error.message}`);
      throw error;
    }

    return this.scanResults;
  }

  // 准备上下文
  prepareContext(context) {
    context.scanResults = this.scanResults;
    context.logger = this;
  }

  // 使用插件
  usePlugin(plugin) {
    if (typeof plugin.apply !== 'function') {
      throw new Error(`Invalid plugin: ${plugin.constructor.name}`);
    }
    plugin.apply(this);
  }

  // 初始化所有插件
  initializePlugins() {
    const plugins = [
      new ConfigCheckPlugin(),
      // new RedundancyCheckPlugin(),
      new EslintCheckPlugin(),
      new CountCheckPlugin(),
      new PackageCheckPlugin(),
      new FileCheckPlugin(),
      new DependencyCheckPlugin(),
      new BuildCheckPlugin(),
      new StylelintCheckPlugin()
    ];

    plugins.forEach(plugin => this.usePlugin(plugin));
  }

  // 保存结果
  async saveResults(results) {
    try {
      await fs.promises.writeFile(
        this.resultFile, 
        JSON.stringify(results, null, 2)
      );
    } catch (error) {
      this.log('error', `Failed to save results: ${error.message}`);
      throw error;
    }
  }
}

// 工作进程主函数
async function runWorker() {
  const [appName, baseDir, resultDir] = process.argv.slice(2);
  const worker = new Worker(appName, baseDir, resultDir);

  try {
    worker.log('info', 'worker started');
    
    // 初始化插件
    worker.initializePlugins();
    worker.log('info', 'plugins initialized');

    // 运行扫描
    const results = await worker.runPlugin({ root: worker.baseDir });
    
    // 保存结果
    await worker.saveResults(results);
    
    worker.log('info', 'worker completed');
  } catch (error) {
    worker.log('error', `worker error: ${error.message}`);
  } finally {
    // 确保所有日志都写入后再退出
    setTimeout(() => process.exit(0), 200);
  }
}

// 启动工作进程
runWorker().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

module.exports = Worker;

