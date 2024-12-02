module.exports = {
  // 私有包前缀
  privatePackagePrefix: ['@iceman', '@frontend'],
  // 风险阈值
  riskThreshold: {
    // 是否进行检查
    isCheck: true,
    // 包信息API
    packageInfoApi: 'https://registry.npmjs.org/',
    // 下载信息API
    downloadInfoApi: 'https://api.npmjs.org/downloads/point/last-month/',
    // 超时时间
    apiTimeout: 3000,
    // 长时未更新包时间范围判断阈值
    lastUpdateMonths: 36,
    // 小众包每月下载量判断阈值
    monthlyDownloads: 1000
  },
  // 许可证
  licenses: {
    safe: [
      'MIT', 
      'ISC', 
      'BSD-2-Clause',
      'BSD-3-Clause', 
      'Apache-2.0',
      'CC0-1.0',
      '0BSD'
    ],
    risky: [
      'GPL-2.0',
      'GPL-3.0',
      'AGPL-3.0',
      'LGPL-2.1',
      'LGPL-3.0',
      'MPL-2.0',
      'CPAL-1.0',
      'EPL-1.0',
      'EPL-2.0'
    ]
  },
  // 相似包
  similarPackages: [
    // 日期处理
    ['moment', 'dayjs', 'date-fns'],
    // HTTP 请求
    ['axios', 'request', 'node-fetch'],  
    // 状态管理
    ['redux', 'mobx', 'vuex'],
    // 测试框架
    ['jest', 'mocha', 'vitest'],
    // E2E 测试
    ['cypress', 'playwright', 'puppeteer'],
    // 打包工具
    ['webpack', 'rollup', 'parcel', 'esbuild', 'vite'],
    // 进程管理
    ['pm2', 'forever', 'nodemon', 'supervisor'],
    // 日志工具
    ['winston', 'bunyan', 'pino', 'log4js'],
  ],
  // 版本升级
  versionUpgrades: {
    // 构建工具
    webpack: {
      minVersion: '5.0.0',
      message: '建议升级到 webpack 5 以获得更好的构建性能和模块联邦特性'
    },
    vite: {
      minVersion: '4.0.0',
      message: '建议升级到 vite 4+ 以获得更好的性能和稳定性'
    },
    // 框架相关
    react: {
      minVersion: '16.8.2',
      message: '建议升级到支持 Hooks 的 React 版本'
    },
    'react-dom': {
      minVersion: '16.8.2',
      message: '建议与 React 版本保持一致，升级到支持 Hooks 的版本'
    },
    vue: {
      minVersion: '3.0.0',
      message: '建议升级到 Vue 3 以使用组合式 API 和更好的 TypeScript 支持'
    },
    husky: {
      minVersion: '8.0.0',
      message: '建议升级到 husky v8+ 以使用新的配置方式和更好的 Git Hooks 支持'
    },
    typescript: {
      minVersion: '4.5.0',
      message: '建议升级到 TypeScript 4.5+ 以获得更好的类型推导和语言特性'
    },
    eslint: {
      minVersion: '8.0.0',
      message: '建议升级到 ESLint 8 以获得更好的性能和规则支持'
    },
    prettier: {
      minVersion: '2.0.0',
      message: '建议升级到 Prettier 2+ 以获得更好的格式化支持'
    }
  }
};
