const path = require('path');
const scan = require('./index');

// 扫描配置
const config = {
  resultDir: 'scan-results',
  sources: [
    {
      appName: 'project-a',
      baseDir: path.join(__dirname, 'resources/project-a'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {}
    },
    {
      appName: 'project-p',
      baseDir: path.join(__dirname, 'resources/project-p'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {}
    },
    {
      appName: 'project-s',
      baseDir: path.join(__dirname, 'resources/project-s'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {
        "@/*": ["./src/*"]
      }
    },
    {
      appName: 'project-w',
      baseDir: path.join(__dirname, 'resources/project-w'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {
        "@/*": ["./src/*"]
      }
    },
    {
      appName: 'project-g',
      baseDir: path.join(__dirname, 'resources/project-g'),
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
    },
    {
      name: 'quality-analysis-plugin',
      config: {}
    }
  ]
};

// 执行扫描
scan(config).then((result) => {
  // console.log('scan result:', result);
}).catch((error) => {
  console.error('scan failed:', error);
});