module.exports = {
  // 解析器配置
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      babelrc: false,
      configFile: false,
      presets: ["@babel/preset-env", "@babel/preset-react"],
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
    es2021: true,
    es6: true
  },

  // 基础插件
  basePlugins: ['react', 'jsdoc', 'unicorn'],

  // 基础扩展
  baseExtends: [],

  // 基础规则
  baseRules: {
    // 函数必须包含注释说明(自定义插件)
    'require-any-comment': ['error'],

    'jsdoc/require-param': ['warn'],
    'jsdoc/require-param-type': ['warn'],
    'jsdoc/require-param-name': ['warn'],
    'jsdoc/check-types': ['warn'],
    'jsdoc/valid-types': ['warn'],
    'jsdoc/require-returns': ['warn'],
    'jsdoc/require-returns-check': ['warn'],
    'jsdoc/require-returns-type': ['warn'],

    // React 规则
    'react/jsx-no-comment-textnodes': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-children-prop': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-is-mounted': 'error',
    'react/no-render-return-value': 'error',
    'react/no-string-refs': 'error',
    'react/no-unescaped-entities': 'error',
    'react/require-render-return': 'error',
    // extra add
    'react/no-multi-comp': 'error',

    // 通用规则
    'constructor-super': 'error',
    'for-direction': 'error',
    'getter-return': ['error', { allowImplicit: true }],
    'no-async-promise-executor': 'error',
    'no-case-declarations': 'error',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': 'error',
    'no-const-assign': 'error',
    'no-constant-binary-expression': 'error',
    'no-constant-condition': 'error',
    'no-control-regex': 'error',
    'no-delete-var': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-ex-assign': 'error',
    'no-fallthrough': 'error',
    'no-func-assign': 'error',
    'no-global-assign': 'error',
    'no-import-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-loss-of-precision': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-nonoctal-decimal-escape': 'error',
    'no-obj-calls': 'error',
    'no-prototype-builtins': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-self-assign': 'error',
    'no-setter-return': 'error',
    'no-shadow-restricted-names': 'error',
    'no-sparse-arrays': 'error',
    'no-this-before-super': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': ['error', { enforceForOrderingRelations: true }],
    'no-unsafe-optional-chaining': 'error',
    'no-unused-labels': 'error',
    'no-useless-catch': 'error',
    'no-useless-escape': 'error',
    'use-isnan': ['error', { enforceForIndexOf: true }],
    'valid-typeof': 'error',
    // extra add
    'no-var': 'error',
    'eqeqeq': 'error',
    'max-depth': ['error', 5],
    'max-lines-per-function': ['error', { 'max': 500, 'skipBlankLines': true, 'skipComments': true }],
    'max-lines': ['error', { 'max': 700, 'skipBlankLines': true, 'skipComments': true }],
    'no-with': 'error',
    'no-eval': 'error',

    // 文件名规则
    'unicorn/new-for-builtins': 'error',
    'unicorn/no-instanceof-array': 'error',
    'unicorn/no-invalid-remove-event-listener': 'error',
    'unicorn/no-thenable': 'error',
    'unicorn/no-unreadable-array-destructuring': 'error',
    'unicorn/require-array-join-separator': 'error',
    'unicorn/require-number-to-fixed-digits-argument': 'error',
  },

  // TypeScript 特定规则
  tsRules: {
    '@typescript-eslint/no-duplicate-enum-values': 'error',
    '@typescript-eslint/no-extra-non-null-assertion': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
    '@typescript-eslint/no-unsafe-declaration-merging': 'error',
    '@typescript-eslint/no-unsafe-function-type': 'error',
    '@typescript-eslint/no-wrapper-object-types': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    // extra add
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
      }
    ]
  },

  // Vue 特定规则
  vueRules: {
    // extra
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
