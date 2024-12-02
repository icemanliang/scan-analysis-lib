const moment = require('moment');
const defaultConfig = require('./config');
const { extractQualityInfo } = require('./util');
const { calculateQualityScore } = require('./score');
class QualityAnalysisPlugin { 
  constructor(config = {}) {
    this.name = 'QualityAnalysisPlugin';
    this.devMode = false;
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  devLog(title, message) {
    if(this.devMode) {
      console.debug(moment().format('YYYY-MM-DD HH:mm:ss'), 'debug', `[${this.name}]`, title, message);
    }
  }

  apply(scanner) {
    scanner.hooks.quality.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      try {
        context.logger.log('info', 'start quality analyze...');
        const startTime = Date.now();
        // 提取质量信息
        const results = await extractQualityInfo(context.scanResults);
        // 计算质量评分
        const qualityScore = calculateQualityScore(results);
        this.devLog('quality score', qualityScore);
        // 保存质量信息
        context.scanResults.qualityInfo = {
          ...results,
          qualityScore
        };   
        context.logger.log('info', `quality analyze completed, time: ${Date.now() - startTime} ms`);
      } catch (error) {
        context.scanResults.qualityInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }
}

module.exports = QualityAnalysisPlugin; 