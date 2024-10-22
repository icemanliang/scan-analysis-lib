const { config } = require('process');
const createScanner = require('./index');
const path = require('path');

const scanner = createScanner({
  FINAL_RESULT_DIR: './scan-results',
  source: [
    {
      appName: 'siam-admin-front',
      sourceDir: path.join(__dirname, 'resources/siam-admin-front'),
      codeDir: path.join(__dirname, 'resources/siam-admin-front', 'src')
    },
    {
      appName: 'sop-portal-front',
      sourceDir: path.join(__dirname, 'resources/sop-portal-front'),
      codeDir: path.join(__dirname, 'resources/sop-portal-front', 'src')
    },
  ],
  plugins: [
    // 'eslint-check-plugin': {
    //   enabled: true,
    //   // 其他 ESLint 特定配置
    // },
    {
      pluginName: 'redundancy-check-plugin',
      enabled: true,
      config: {

      }
    },
    // ... 其他插件配置
  ]
});

scanner.runAnalysis().then(() => {
  console.log('=========Analysis completed=========');
}).catch(error => {
  console.error('Analysis failed:', error);
});