const createScanner = require('./index');
const path = require('path');

const scanner = createScanner({
  resultDir: 'scan-results',
  sources: [
    {
      appName: 'siam-admin-front',
      baseDir: path.join(__dirname, 'resources/siam-admin-front'),
      codeDir: 'src',
      buildDir:'dist'
    },
    {
      appName: 'sop-portal-front',
      baseDir: path.join(__dirname, 'resources/sop-portal-front'),
      codeDir: 'src',
      buildDir: ''
    },
    {
      appName: 'sop-platform-front',
      baseDir: path.join(__dirname, 'resources/sop-platform-front'),
      codeDir: 'src',
      buildDir: 'dist'
    },
  ],
  plugins: [
    {
      name: 'eslint-check-plugin',
      enable: true,
      config: {
        
      }
    },
    // ... 其他插件配置
  ]
});

scanner.scan().then(() => {
  console.log('=========Analysis completed=========');
}).catch(error => {
  console.error('Analysis failed:', error);
});