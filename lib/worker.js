const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { AsyncSeriesHook } = require('tapable');
const { WORKER_RESULT_NAME, WORKER_LOG_NAME } = require('./const');

class Worker {
  constructor(source, resultDir, plugins) {
    this.initializeBasicInfo(source, resultDir, plugins);
    this.initializeLogger();
    this.initializeHooks();
  }

  // 初始化基本信息
  initializeBasicInfo(source, resultDir, plugins) {
    this.source = JSON.parse(source);
    this.resultFile = path.join(resultDir, WORKER_RESULT_NAME);
    this.logFile = path.join(resultDir, WORKER_LOG_NAME);
    this.scanResults = {};
    this.plugins = JSON.parse(plugins);
  }

  // 初始化子进程执行日志控制器
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

  // 初始化插件生命周期
  initializeHooks() {
    this.hooks = {
      code: new AsyncSeriesHook(['context']),         // 代码分析
      project: new AsyncSeriesHook(['context']),      // 项目分析
      dependency: new AsyncSeriesHook(['context']),   // 依赖分析
      build: new AsyncSeriesHook(['context'])         // 构建分析
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
        text: `[${this.source.appName}] ${text}` 
      });
    }
  }

  // 运行插件
  async runPlugin() {
    const context = this.createContext();

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

  // 创建上下文
  createContext() {
    const context = { ...this.source };
    context.scanResults = this.scanResults;
    context.logger = this;
    return context;
  }

  // 使用插件
  usePlugin(plugin) {
    if (typeof plugin.apply !== 'function') {
      throw new Error(`invalid plugin: ${plugin.constructor.name}`);
    }
    plugin.apply(this);
  }

  // 初始化所有插件
  initializePlugins() {
    this.plugins.forEach(plugin => {
      const PluginClass = require(`../plugins/${plugin.name}`);
      const pluginInstance = new PluginClass(plugin.config);
      this.usePlugin(pluginInstance);
    });
  }

  // 保存结果
  async saveResults(results) {
    try {
      await fs.promises.writeFile(
        this.resultFile, 
        JSON.stringify(results, null, 2)
      );
    } catch (error) {
      this.log('error', `failed to save results: ${error.message}`);
      throw error;
    }
  }
}

// 工作进程主函数
async function runWorker() {
  const [source, resultDir, plugins] = process.argv.slice(2);
  const worker = new Worker(source, resultDir, plugins);

  try {
    worker.log('info', 'worker process started');
    
    // 初始化插件
    worker.initializePlugins();
    worker.log('info', 'plugins initialized');

    // 运行扫描
    const results = await worker.runPlugin();
    
    // 保存结果
    await worker.saveResults(results);
    
    worker.log('info', 'worker process completed');
  } catch (error) {
    worker.log('error', `worker process error: ${error.message}`);
  } finally {
    // 确保所有日志都写入后再退出
    setTimeout(() => process.exit(0), 200);
  }
}

// 启动工作进程
runWorker().catch(error => {
  console.error('fatal error:', error);
  process.exit(1);
});

module.exports = Worker;

