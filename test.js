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
      aliasConfig: {
        "@/*": ["./src/*"]
      }
    },
    {
      appName: 'project-b',
      baseDir: path.join(__dirname, 'resources/project-b'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {
        "@/*": ["./src/*"]
      }
    },
    {
      appName: 'project-c',
      baseDir: path.join(__dirname, 'resources/project-c'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {
        "@src/*": ["./src/*"]
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
      config: {
        npmrc: {
          registryDomain: 'https://npmjs.iceman.cn'
        }
      }
    },
    {
      name: 'package-check-plugin',
      config: {
        privatePackagePrefix: ['@iceman'],
        riskThreshold: {
          isCheck: false
        }
      }
    },
    {
      name: 'dependency-check-plugin',
      config: {
        ignoreMatch: ['__tests__/']
      }
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