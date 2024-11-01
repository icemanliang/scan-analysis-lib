const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');

class EslintCheckPlugin {
  constructor(config = {}) {
    this.name = 'EslintCheckPlugin';

    // 开发模式
    this.devMode = config.devMode || false;

    // 默认配置
    this.defaultConfig = {
      // 解析器配置
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: 'module',
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ["@babel/preset-env"],
        },
        ecmaFeatures: { jsx: true },
        allowImportExportEverywhere: false,
      },

      // 设置
      settings: {
        react: {
          version: "detect"  // 自动检测React版本
        }
      },

      // 环境配置
      env: {
        browser: true,
        node: true,
        es2022: true,
        es6: true
      },

      // 基础插件
      basePlugins: ['react', 'jsdoc', 'unicorn'],

      // 基础扩展
      baseExtends: ['eslint:recommended', 'plugin:jsdoc/recommended'],

      // 基础规则
      baseRules: {
        // JSDoc 规则
        'jsdoc/require-jsdoc': ['error', {
          'require': {
            'FunctionDeclaration': true,
            'MethodDefinition': true,
            'ClassDeclaration': true,
            'ArrowFunctionExpression': true,
            'FunctionExpression': true
          },
          'checkConstructors': false,
          'minLineCount': 2
        }],
        'jsdoc/require-description': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-param-description': 'off',

        // React 规则
        'react/no-multi-comp': 'error',

        // 通用规则
        'no-var': 'error',
        'eqeqeq': 'error',
        'max-depth': ['error', 5],
        'max-lines-per-function': ['error', { 'max': 150, 'skipBlankLines': true, 'skipComments': true }],
        'max-lines': ['error', { 'max': 500, 'skipBlankLines': true, 'skipComments': true }],
        'no-with': 'error',
        'no-eval': 'error',

        // 文件名规则
        "unicorn/filename-case": ["error", { "case": "kebabCase" }]
      },

      // TypeScript 特定规则
      tsRules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'allow'
          },
          {
            selector: 'function',
            format: ['camelCase', 'PascalCase']
          },
          {
            selector: 'class',
            format: ['PascalCase']
          },
          {
            selector: 'interface',
            format: ['PascalCase'],
            prefix: ['I']
          },
          {
            selector: 'typeAlias',
            format: ['PascalCase']
          },
          {
            selector: 'enum',
            format: ['PascalCase']
          }
        ],
        '@typescript-eslint/no-unused-vars': ['error', {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "all",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_"
        }]
      },

      // Vue 特定规则
      vueRules: {
        'vue/script-setup-uses-vars': 'error',
        'vue/no-unused-components': 'error',
        'vue/component-name-in-template-casing': ['error', 'PascalCase'],
        'vue/component-definition-name-casing': ['error', 'PascalCase'],
        'vue/match-component-file-name': ['error', {
          extensions: ['vue'],
          shouldMatchCase: true
        }],
        'vue/block-order': ['error', {
          order: ['template', 'script', 'style']
        }],
        'vue/no-v-html': 'error'
      },

      // 添加忽略配置
      ignore: {
        // 忽略的文件和目录模式
        patterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/coverage/**',
          '**/.git/**',
          '**/*.min.js',
          '**/*.bundle.js',
          '**/vendor/**',
          '**/__tests__/**',
          '**/*.test.{js,jsx,ts,tsx}',
          '**/*.spec.{js,jsx,ts,tsx}',
          '**/test/**',
          '**/tests/**',
          '**/*.d.ts'
        ],
        // 是否忽略带点的文件/目录（如 .git）
        dotFiles: true,
        // 自定义的忽略文件路径（相对于项目根目录）
        file: '.eslintignore'
      },
    };

    // 合并用户配置
    this.config = {
      ...this.defaultConfig,
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

  // 获取忽略配置
  getIgnoreConfig(context) {
    const ignorePatterns = [...this.config.ignore.patterns];
    const ignorePath = path.join(context.baseDir, this.config.ignore.file);

    // 如果存在自定义忽略文件，添加到忽略列表
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
      // 移除顶层的 ignorePatterns
      baseConfig: {
        ignorePatterns, // 将 ignorePatterns 移到 baseConfig 中
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

  // 简化 ESLint 结果
  minifyResults(results) {
    return results.map(result => {
      // 简化文件路径，只保留 baseDir 之后的部分
      const filePath = path.relative(this.baseDir, result.filePath);

      // 简化消息对象，只保留需要的字段
      const messages = result.messages.map(msg => ({
        ruleId: msg.ruleId,
        severity: msg.severity,
        message: msg.message,
        line: msg.line
      }));

      // 返回简化后的结果对象
      return {
        filePath,
        messages,
        errorCount: result.errorCount,
        warningCount: result.warningCount
      };
    });
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
        
        // 使用 glob 模式过滤文件
        const filesToLint = path.join(context.baseDir, context.codeDir, '**/*.{js,jsx,ts,tsx,vue}');
        const results = await eslint.lintFiles([filesToLint]);
        
        // 开发模式下，输出更多调试信息
        if (this.devMode) {
          const formatter = await eslint.loadFormatter('stylish');
          const resultText = formatter.format(results);
          console.log(resultText);
        }

        const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
        const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);

        // 简化结果
        const minResults = this.minifyResults(results);

        context.scanResults.eslintInfo = {
          errorCount,
          warningCount,
          results: minResults
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
