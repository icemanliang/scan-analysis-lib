const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');

class EslintCheckPlugin {
  constructor() {
    this.name = 'EslintCheckPlugin';
  }

  hasTsConfig(rootDir) {
    return fs.existsSync(path.join(rootDir, 'tsconfig.json'));
  }

  hasVueFiles(rootDir) {
    const vueFiles = glob.sync('src/**/*.vue', { cwd: rootDir });
    return vueFiles.length > 0;
  }

  apply(scanner) {
    scanner.hooks.code.tapPromise('EslintCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting ESLint check...');
        
        const useTypeScript = this.hasTsConfig(context.root);
        const hasVue = this.hasVueFiles(context.root);

        const eslint = new ESLint({
          useEslintrc: false,
          overrideConfigFile: null,
          baseConfig: {
            parser: hasVue ? 'vue-eslint-parser' : (useTypeScript ? '@typescript-eslint/parser' : '@babel/eslint-parser'),
            parserOptions: {
              parser: useTypeScript ? '@typescript-eslint/parser' : '@babel/eslint-parser',
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
              ...(useTypeScript ? { project: path.join(context.root, 'tsconfig.json') } : {}),
              extraFileExtensions: hasVue ? ['.vue'] : []
            },
            env: {
              browser: true,
              node: true,
              es2022: true,
              es6: true
            },
            plugins: [
              ...(useTypeScript ? ['@typescript-eslint'] : []),
              ...(hasVue ? ['vue'] : []),
              'react',
              'jsdoc',
              'unicorn'
            ],
            extends: [
              'eslint:recommended',
              'plugin:jsdoc/recommended',
              ...(useTypeScript ? ['plugin:@typescript-eslint/recommended'] : []),
              // ...(hasVue ? ['plugin:vue/recommended'] : [])
            ],
            rules: {
              // 命名规范
              ...(useTypeScript ? {
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
                ]
              } : {
                'camelcase': ['error', { properties: 'never' }]
              }),

              // Vue 特定规则
              ...(hasVue ? {
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
                'vue/no-v-html': 'error',
              } : {}),

              // 未使用变量
              ...(useTypeScript ? {
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
              } : {
                'no-unused-vars': ['error', { 
                  vars: "all",
                  varsIgnorePattern: "^_",
                  args: "all",
                  ignoreRestSiblings: false,
                  argsIgnorePattern: "^_",
                  destructuredArrayIgnorePattern: "^_",
                  caughtErrors: "all",
                  caughtErrorsIgnorePattern: "^_" 
                }]
              }),
              
              // 函数必须有注释，但允许单行注释
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

              // 每个文件只包含一个 React 组件
              'react/no-multi-comp': 'error',

              // 避免使用 var
              'no-var': 'error',
              
              // 避免双等号，强制使用 === 和 !==
              'eqeqeq': 'error',
              
              // 避免深度嵌套，最多允许 5 层嵌套
              'max-depth': ['error', 5],
              
              // 避免函数体超过 150 行
              'max-lines-per-function': ['error', { 'max': 150, 'skipBlankLines': true, 'skipComments': true }],
              
              // 避免文件超过 500 行
              'max-lines': ['error', { 'max': 500, 'skipBlankLines': true, 'skipComments': true }],
              
              // 避免使用 with 语句
              'no-with': 'error',
              
              // 避免使用 eval 函数
              'no-eval': 'error',

              // 文件名规则
              "unicorn/filename-case": [
                "error",
                {
                  "case": "kebabCase"
                }
              ]
            }
          },
          cwd: context.root,
          errorOnUnmatchedPattern: false
        });
        
        const results = await eslint.lintFiles([
          path.join(context.root, 'src/**/*.{js,jsx,ts,tsx,vue}')
        ]);
        
        const formatter = await eslint.loadFormatter('stylish');
        const resultText = formatter.format(results);
        console.log(resultText);

        const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
        const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);
        
        context.scanResults.eslintInfo = {
          errorCount,
          warningCount,
          results: results
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
