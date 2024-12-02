const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');
const defaultConfig = require('./config');
const { minifyResults, analyzeResults } = require('./util');
const moment = require('moment');

class EslintCheckPlugin {
  constructor(config = {}) {
    this.name = 'EslintCheckPlugin';           // 插件名称
    this.devMode = false;                      // 是否开启调试模式
    this.config = {                            // 插件配置
      ...defaultConfig,
      ...config
    };
  }

  // 开发模式调试日志
  devLog(title, message) {
    if(this.devMode) {
      console.debug(moment().format('YYYY-MM-DD HH:mm:ss'), 'debug', `[${this.name}]`, title, message);
    }
  }

  // 检查 tsconfig.json 配置
  hasTsConfig(rootDir) {
    return fs.existsSync(path.join(rootDir, 'tsconfig.json'));
  }

  // 检查 vue 文件
  hasVueFiles(rootDir, codeDir) {
    const vueFiles = glob.sync('**/*.vue', { cwd: path.join(rootDir, codeDir) });
    return vueFiles.length > 0;
  }

  // 获取忽略配置
  getIgnoreConfig(context) {
    const ignorePatterns = [...this.config.ignore.patterns];
    const ignorePath = path.join(context.baseDir, this.config.ignore.file);

    if (fs.existsSync(ignorePath)) {
      const customIgnores = fs
        .readFileSync(ignorePath, 'utf8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));
      ignorePatterns.push(...customIgnores);
    }

    return ignorePatterns;
  }

  // 获取 eslint 配置
  getEslintConfig(useTypeScript, hasVue, context) {
    const ignorePatterns = this.getIgnoreConfig(context);

    return {
      useEslintrc: false,
      overrideConfigFile: null,
      baseConfig: {
        ignorePatterns,
        parser: hasVue ? 'vue-eslint-parser' : (useTypeScript ? '@typescript-eslint/parser' : '@babel/eslint-parser'),
        parserOptions: {
          ...this.config.parserOptions,
          parser: useTypeScript ? '@typescript-eslint/parser' : '@babel/eslint-parser',
          ...(useTypeScript ? { project: path.join(context.baseDir, 'tsconfig.json') } : {}),
          extraFileExtensions: hasVue ? ['.vue'] : []
        },
        settings: !hasVue ? this.config.settings : {},
        env: this.config.env,
        plugins: [
          ...this.config.basePlugins,
          ...(useTypeScript ? ['@typescript-eslint'] : []),
          ...(hasVue ? ['vue'] : [])
        ],
        extends: [
          ...this.config.baseExtends,
          ...(useTypeScript ? ['plugin:@typescript-eslint/recommended'] : [])
        ],
        noInlineConfig: true, // 禁用内联配置
        rules: {
          ...this.config.baseRules,
          ...(useTypeScript ? this.config.tsRules : { 'camelcase': ['error', { properties: 'never' }] }),
          ...(hasVue ? this.config.vueRules : {}),
        }
      }
    };
  }

  // 注册插件
  async apply(scanner) {
    scanner.hooks.code.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      try {
        context.logger.log('info', 'start eslint check...');
        const startTime = Date.now();

        const useTypeScript = this.hasTsConfig(context.baseDir);
        const hasVue = this.hasVueFiles(context.baseDir, context.codeDir);

        const eslintConfig = this.getEslintConfig(useTypeScript, hasVue, context);
        this.devLog('eslintConfig', eslintConfig);

        const eslint = new ESLint({
          ...eslintConfig,
          cwd: context.baseDir,
          errorOnUnmatchedPattern: false,
          rulePaths: [path.resolve(__dirname, 'rules')]  // 添加自定义插件规则
        });
        
        const filesToLint = path.join(context.baseDir, context.codeDir, '**/*.{js,jsx,ts,tsx,vue}');
        const results = await eslint.lintFiles([filesToLint]);
        
        if (this.devMode) {
          const formatter = await eslint.loadFormatter('stylish');
          const resultText = formatter.format(results);
          this.devLog('resultText', resultText);
        }

        const fileList = minifyResults(results, context.baseDir);
        const ruleList = analyzeResults(fileList);

        const errorCount = fileList.reduce((sum, result) => sum + result.errorCount, 0);
        const warningCount = fileList.reduce((sum, result) => sum + result.warningCount, 0);
        const totalFilesCount = results.length;

        context.scanResults.eslintInfo = {
          totalFilesCount,
          errorCount,
          warningCount,
          fileList,
          errorRuleCount: ruleList.errorRuleList.length,
          warningRuleCount: ruleList.warningRuleList.length,
          ruleList
        };
        context.logger.log('info', `total found ${errorCount} errors and ${warningCount} warnings.`);
        context.logger.log('info', `eslint check completed, time: ${Date.now() - startTime} ms`);
      } catch(error) {
        context.scanResults.eslintInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }
}

module.exports = EslintCheckPlugin;

