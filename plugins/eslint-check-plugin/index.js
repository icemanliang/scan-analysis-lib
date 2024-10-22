const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');

class EslintCheckPlugin {
  constructor() {
    this.name = 'EslintCheckPlugin';
  }

  hasTsConfig(rootDir) {
    return fs.existsSync(path.join(rootDir, 'tsconfig.json'));
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('EslintCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting ESLint check...');
        
        const useTypeScript = this.hasTsConfig(context.root);

        const eslint = new ESLint({
          useEslintrc: false,
          overrideConfigFile: null,
          baseConfig: {
            parser: useTypeScript ? '@typescript-eslint/parser' : 'babel-eslint',
            parserOptions: {
              ecmaVersion: 2021,
              sourceType: 'module',
              ecmaFeatures: { jsx: true },
              ...(useTypeScript ? { project: path.join(context.root, 'tsconfig.json') } : {})
            },
            env: {
              es2021: true,
              node: true,
              browser: true
            },
            plugins: [
              ...(useTypeScript ? ['@typescript-eslint'] : []),
              'react',
              'jsdoc',
              'unicorn'
            ],
            extends: [
              'eslint:recommended',
              'plugin:jsdoc/recommended',
              ...(useTypeScript ? ['plugin:@typescript-eslint/recommended'] : [])
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
                'minLineCount': 2  // 只有超过2行的函数才需要注释
              }],
              'jsdoc/require-description': 'off',  // 不要求详细描述
              'jsdoc/require-returns': 'off',  // 不要求返回值描述
              'jsdoc/require-param-description': 'off',  // 不要求参数描述

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
              
              // 避免 js，ts，jsx，tsx 文件超过 500 行
              'max-lines': ['error', { 'max': 500, 'skipBlankLines': true, 'skipComments': true }],
              
              // 避免使用 with 语句
              'no-with': 'error',
              
              // 避免使用 eval 函数
              'no-eval': 'error',

              // 添加文件名规则
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
        
        const results = await eslint.lintFiles([path.join(context.root, 'src/**/*.{js,jsx,ts,tsx}')]);
        
        const formatter = await eslint.loadFormatter('stylish');
        const resultText = formatter.format(results);
        console.log(resultText);

        const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
        const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);
        
        context.scanResults.eslint = {
          errorCount,
          warningCount,
          results: results
        };

        context.logger.log('info', `ESLint check completed. Found ${errorCount} errors and ${warningCount} warnings.`);
      } catch(error) {
        context.scanResults.eslint = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
        console.error('Full error:', error);
      }
    });
  }
}

module.exports = EslintCheckPlugin;
