const path = require('path');
const scan = require('./index');

// 扫描配置
const config = {
  resultDir: 'scan-results',
  sources: [
    {
      appName: 'admin-front',
      baseDir: path.join(__dirname, 'resources/admin-front'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {}
    },
    {
      appName: 'portal-front',
      baseDir: path.join(__dirname, 'resources/portal-front'),
      codeDir: 'src',
      buildDir: 'dist',
      aliasConfig: {}
    },
    {
      appName: 'platform-front',
      baseDir: path.join(__dirname, 'resources/platform-front'),
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
      config: {}
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