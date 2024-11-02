const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');
const defaultConfig = require('./config');
const { minifyResults, analyzeResults } = require('./util');

class EslintCheckPlugin {
  constructor(config = {}) {
    this.name = 'EslintCheckPlugin';
    
    // 合并用户配置
    this.config = {
      ...defaultConfig,
      ...config
    };

    // 基础目录
    this.baseDir = '';
  }

  hasTsConfig(rootDir) {
    return fs.existsSync(path.join(rootDir, 'tsconfig.json'));
  }

  hasVueFiles(rootDir, codeDir) {
    const vueFiles = glob.sync('**/*.vue', { cwd: path.join(rootDir, codeDir) });
    return vueFiles.length > 0;
  }

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
        rules: {
          ...this.config.baseRules,
          ...(useTypeScript ? this.config.tsRules : { 'camelcase': ['error', { properties: 'never' }] }),
          ...(hasVue ? this.config.vueRules : {})
        }
      }
    };
  }

  async apply(scanner) {
    scanner.hooks.code.tapPromise('EslintCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting ESLint check...');

        this.baseDir = context.baseDir;

        const useTypeScript = this.hasTsConfig(context.baseDir);
        const hasVue = this.hasVueFiles(context.baseDir, context.codeDir);

        const eslintConfig = this.getEslintConfig(useTypeScript, hasVue, context);
        const eslint = new ESLint({
          ...eslintConfig,
          cwd: context.baseDir,
          errorOnUnmatchedPattern: false
        });
        
        const filesToLint = path.join(context.baseDir, context.codeDir, '**/*.{js,jsx,ts,tsx,vue}');
        const results = await eslint.lintFiles([filesToLint]);
        
        if (this.config.devMode) {
          const formatter = await eslint.loadFormatter('stylish');
          const resultText = formatter.format(results);
          console.log(resultText);
        }

        const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
        const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);

        const fileList = minifyResults(results, this.baseDir);
        const ruleList = analyzeResults(fileList);

        context.scanResults.eslintInfo = {
          errorCount,
          warningCount,
          fileList,
          ruleList
        };

        context.logger.log('info', `ESLint check completed. Found ${errorCount} errors and ${warningCount} warnings.`);
      } catch(error) {
        context.scanResults.eslintInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
        console.error('Full error:', error);
      }
    });
  }
}

module.exports = EslintCheckPlugin;
