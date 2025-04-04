module.exports = {
  // 检查项开关配置
  checks: {
    commitlint: true,
    prettier: true,
    readme: true,
    npmrc: true,
    eslint: true,
    tsconfig: true,
    nodeVersion: true,
    editorconfig: true,
    packageJson: true,
    license: false,
    ignoreFiles: false,
    browserslist: false,
  },

  // commitlint 相关配置
  commitlint: {
    possibleFiles: [
      'commitlint.config.js',
      '.commitlintrc',
      '.commitlintrc.js',
      '.commitlintrc.json'
    ],
    requiredExtends: ['@commitlint/config-conventional']
  },

  // prettier 相关配置
  prettier: {
    possibleFiles: [
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.js',
      'prettier.config.js'
    ],
    expectedConfig: {
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
      printWidth: 100
    },
    customConfig: '@iceman/prettier-config'
  },

  // eslint 相关配置
  eslint: {
    possibleFiles: [
      '.eslintrc.js',
      '.eslintrc.json', 
      '.eslintrc.yaml',
      '.eslintrc.yml',
      '.eslintrc'
    ], 
    validConfigs: [
      ['@iceman/eslint-config'],                            // 自定义配置
      ['eslint:recommended', 'plugin:react/recommended'],   // react 项目
      ['eslint:recommended', 'plugin:vue/recommended'],     // vue 项目
      ['airbnb', 'airbnb/hooks']                            // react 项目
    ]
  },

  // editorconfig 相关配置
  editorconfig: {
    expectedConfigs: {
      'root = true': false,
      '[*]': false,
      'indent_style = space': false,
      'indent_size = 4': false,
      'end_of_line = lf': false,
      'charset = utf-8': false,
      'trim_trailing_whitespace = true': false,
      'insert_final_newline = true': false
    }
  },

  // ignore 文件相关配置
  ignoreFiles: {
    files: [
      '.npmignore',
      '.eslintignore',
      '.stylelintignore',
      '.prettierignore'
    ],
    rules: {
      '.eslintignore': ['src/**/*.d.ts', 'src/**/*.css'],
      '.prettierignore': [
        '**/*.md',
        '**/*.svg',
        '**/*.ejs',
        '**/*.html',
        'package.json',
        'node_modules',
        'dist',
        'build',
        '.DS_Store',
        '*.log'
      ],
      '.stylelintignore': [
        '*.ts',
        '*.tsx',
        '*.ejs',
        '*.html',
        'node_modules',
        'dist',
        'build'
      ],
      '.npmignore': [
        'node_modules',
        'site',
        '.DS_Store'
      ]
    }
  },

  // package.json 相关配置
  packageJson: {
    namePattern: /^[a-z]+(-[a-z]+)*$/,
    requiredFields: {
      name: '全小写字母，可使用中线连接多段全小写字母',
      description: '不能为空',
      packageManager: '不能为空'
    },
    requiredScripts: ['lint', 'build', 'prepare'],
    packageManagerPattern: /^(npm|yarn|pnpm)@(\d+\.\d+\.\d+)$/,
    prepareShouldInclude: 'husky install',
    lintStagedRequired: true,
    lintStagedConfig: {
      '*.{js,jsx,ts,tsx}': ['eslint --fix'],
      '*.{js,jsx}': ['eslint --fix'],
      '*.{ts,tsx}': ['eslint --fix'],
      '*.{js,jsx,vue}': ['eslint --fix'],
      '*.{ts,tsx,vue}': ['eslint --fix'],
      '*.{js,jsx,ts,tsx,vue}': ['eslint --fix'],
      "src/**/*.{js,jsx}": ['eslint --fix'],
      "src/**/*.{ts,tsx}": ['eslint --fix'],
      "src/**/*.{js,jsx,vue}": ['eslint --fix'],
      "src/**/*.{ts,tsx,vue}": ['eslint --fix'],
      "src/**/*.{js,jsx,ts,tsx,vue}": ['eslint --fix'],
      "packages/**/*.{js,jsx}": ['eslint --fix'],
      "packages/**/*.{ts,tsx}": ['eslint --fix'],
      "packages/**/*.{js,jsx,vue}": ['eslint --fix'],
      "packages/**/*.{ts,tsx,vue}": ['eslint --fix'],
      "packages/**/*.{js,jsx,ts,tsx,vue}": ['eslint --fix']
    },
    npmPackageFields: {
      version: '必须是有效的 semver 版本',
      main: '不能为空',
      module: '不能为空',
      license: '不能为空',
      keywords: '必须是一个数组'
    }
  },

  // browserslist 相关配置
  browserslist: {
    requiredConfigs: [
      '> 1%',
      'last 2 versions',
      'not dead'
    ]
  },

  // npmrc 相关配置
  npmrc: {
    registryDomain: 'https://registry.npmjs.org'  // 默认配置npm官方源，可配置私有源
  },

  // node 版本相关配置
  nodeVersion: {
    versionPattern: /^\d+\.\d+\.\d+$/,
    whitelist: ['20.11.1', '20.10.0', '18.19.1', '18.17.0']
  },

  // tsconfig 相关配置
  tsconfig: {
    compilerOptions: {
      target: 'esnext',
      module: 'esnext',
      allowJs: true,
      strict: true,
      outDir: './dist',
      jsx: 'react',
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      resolveJsonModule: true,
      moduleResolution: 'node',
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      noImplicitAny: true,
      skipLibCheck: true,
      lib: ['esnext', 'dom', 'WebWorker']
    }
  },

  // license 相关配置
  license: {
    validLicenses: [
      'MIT',
      'Apache-2.0', 
      'BSD-3-Clause',
      'BSD-2-Clause',
      'ISC'
    ]
  },

  // readme 相关配置
  readme: {
    requiredSections: [
      "业务介绍",
      "依赖环境",
      "本地调试",
      "目录结构",
      "配置文件",
      "部署方案",
      "访问地址",
      "监控接入",
      "框架工具",
      "API文档",
      "自测流程",
      "合流规范"
    ]
  }
}; 