const path = require('path');
const scan = require('./index');

// 扫描配置
const config = {
  resultDir: 'scan-results',
  sources: [
    {
      appName: 'admin',
      baseDir: path.join(__dirname, 'resources/admin'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {}
    },
    {
      appName: 'portal',
      baseDir: path.join(__dirname, 'resources/portal'),
      codeDir: 'src',
      buildDir: 'dist',
      aliasConfig: {}
    },
    {
      appName: 'platform',
      baseDir: path.join(__dirname, 'resources/platform'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {
        "@/*": ["./src/*"]
      }
    },
  ],
  plugins: [
    {
      name: 'eslint-check-plugin',
      config: {}
    },
    {
      name: 'stylelint-check-plugin',
      config: {}
    },
    {
      name: 'count-check-plugin',
      config: {}
    },
    {
      name: 'redundancy-check-plugin',
      config: {}
    },
    {
      name: 'git-check-plugin',
      config: {}
    },
    {
      name: 'config-check-plugin',
      config: {}
    },
    {
      name: 'package-check-plugin',
      config: {
        privatePackagePrefix: ['@shein'],
        riskThreshold: {
          isCheck: false
        }
      }
    },
    {
      name: 'dependency-check-plugin',
      config: {}
    },
    {
      name: 'build-check-plugin',
      config: {}
    }
  ]
};

// 执行扫描
scan(config).then((result) => {
  console.log('scan result:', result);
}).catch((error) => {
  console.error('scan failed:', error);
});