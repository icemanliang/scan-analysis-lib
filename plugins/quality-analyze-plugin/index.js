const path = require('path');
const fs = require('fs');
const moment = require('moment');
const defaultConfig = require('./config');

class QualityAnalyzePlugin { 
  constructor(config = {}) {
    this.name = 'QualityAnalyzePlugin';
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
      try {
        context.logger.log('info', 'start quality analyze...');
        const startTime = Date.now();

        const resultPath = path.join(process.cwd(), 'scan-results', context.appName, 'result.json');
        const results = await this.analyzeResults(resultPath);

        const tempPath = path.join(process.cwd(), 'temp', `${context.appName}-quality-result.json`);
        if(!fs.existsSync(tempPath)) {
          fs.mkdirSync(path.dirname(tempPath), { recursive: true });
        }
        fs.writeFileSync(tempPath, JSON.stringify(results, null, 2));

        this.devLog('quality analyze results', results);
        context.scanResults.qualityInfo = results;   
        context.logger.log('info', `quality analyze completed, time: ${Date.now() - startTime} ms`);
      } catch (error) {
        context.scanResults.qualityInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }

  async analyzeResults(resultPath) {
    const rawResults = JSON.parse(await fs.promises.readFile(resultPath, 'utf8'));
    
    return {
      metrics: this.calculateMetrics(rawResults)
    };
  }

  calculateMetrics(results) {
    return {
      codeQuality: this.calculateCodeQualityMetrics(results),
      buildQuality: this.calculateBuildQualityMetrics(results),
      configQuality: this.calculateConfigQualityMetrics(results)
    };
  }

  calculateCodeQualityMetrics(results) {
    const metrics = {
      eslint: {
        errorCount: 0,
        warningCount: 0,
        filesWithError: 0
      },
      redundancy: {
        duplicateCount: 0,
        affectedFiles: 0
      },
      typescript: {
        missingTypesCount: 0,
        totalFunctions: 0
      },
      complexity: {
        generatorFunctions: 0,
        classComponents: 0,
        hookFunctions: 0
      }
    };

    if (results.eslintInfo?.fileList) {
      metrics.eslint = {
        errorCount: results.eslintInfo.errorCount || 0,
        warningCount: results.eslintInfo.warningCount || 0,
        filesWithError: results.eslintInfo.fileList.length
      };
    }

    if (results.redundancyInfo?.clones) {
      metrics.redundancy = {
        duplicateCount: results.redundancyInfo.clones.length,
        affectedFiles: new Set(results.redundancyInfo.clones.map(c => c.file)).size
      };
    }

    if (results.countInfo?.functionStats) {
      metrics.typescript = {
        missingTypesCount: results.countInfo.functionStats.missingTypes,
        totalFunctions: results.countInfo.functionStats.total
      };
      metrics.complexity = {
        generatorFunctions: results.countInfo.generatorFunctions.length,
        classComponents: results.countInfo.classComponents.length,
        hookFunctions: results.countInfo.functionStats.hooks
      };
    }

    return metrics;
  }

  calculateBuildQualityMetrics(results) {
    const metrics = {
      size: {
        total: 0,
        js: 0,
        css: 0,
        media: 0
      },
      fileCount: {
        total: 0,
        byType: {}
      }
    };

    if (results.buildInfo?.total) {
      metrics.size = {
        total: results.buildInfo.total.size || 0,
        js: results.buildInfo.js?.size || 0,
        css: results.buildInfo.css?.size || 0,
        media: results.buildInfo.media?.size || 0
      };
      
      metrics.fileCount = {
        total: results.buildInfo.total.count || 0,
        byType: {
          js: results.buildInfo.js?.count || 0,
          css: results.buildInfo.css?.count || 0,
          html: results.buildInfo.html?.count || 0,
          media: results.buildInfo.media?.count || 0
        }
      };
    }

    return metrics;
  }

  calculateConfigQualityMetrics(results) {
    const metrics = {
      configFiles: {
        total: 0,
        valid: 0,
        missing: 0
      },
      dependencies: {
        total: 0,
        outOfDate: 0,
        private: 0,
        risk: 0
      }
    };

    if (results.configInfo) {
      const configs = ['eslint', 'prettier', 'tsconfig', 'editorconfig'];
      metrics.configFiles.total = configs.length;
      metrics.configFiles.valid = configs.filter(c => results.configInfo[c]?.isValid).length;
      metrics.configFiles.missing = configs.filter(c => !results.configInfo[c]?.exists).length;
    }

    if (results.packageInfo) {
      const deps = results.packageInfo.dependencies || {};
      metrics.dependencies = {
        total: Object.keys(deps).length,
        outOfDate: results.packageInfo.versionUpgrades?.length || 0,
        private: results.packageInfo.privatePackages?.length || 0,
        risk: results.packageInfo.riskPackages?.length || 0
      };
    }

    return metrics;
  }
}

module.exports = QualityAnalyzePlugin; 