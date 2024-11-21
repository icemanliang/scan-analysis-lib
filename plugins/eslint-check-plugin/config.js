module.exports = {
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
  baseExtends: ['eslint:recommended'],

  // 基础规则
  baseRules: {
    // 函数必须包含注释说明
    // 'require-any-comment': ['error'],
    // 函数必须包含jsdoc注释说明
    // 'jsdoc/require-jsdoc': 'error',
    // 函数，方法，类设置jsdoc注释说明
    'jsdoc/require-jsdoc': ['error', {
        'require': {
          'FunctionDeclaration': true,
          'MethodDefinition': true,
          'ClassDeclaration': true,
          'ArrowFunctionExpression': true,
          'FunctionExpression': false
        }
    }],
    'jsdoc/require-description': ['warn', {
      'descriptionStyle': 'tag'
    }],
    'jsdoc/require-param-description': ['warn'],
    'jsdoc/require-param': ['warn'],
    'jsdoc/require-param-type': ['warn'],
    'jsdoc/require-param-name': ['warn'],
    'jsdoc/check-types': ['warn'],
    'jsdoc/valid-types': ['warn'],
    'jsdoc/require-returns': ['warn'],
    'jsdoc/require-returns-check': ['warn'],
    'jsdoc/require-returns-type': ['warn'],

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
    dotFiles: true,
    file: '.eslintignore'
  }
};
