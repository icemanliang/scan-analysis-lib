const createScanner = require('./index');
const path = require('path');

const scanner = createScanner({
  resultDir: 'scan-results',
  sources: [
    {
      appName: 'siam-admin-front',
      baseDir: path.join(__dirname, 'resources/siam-admin-front'),
      codeDir: 'src',
      buildDir: '',
      aliasMap: {
        '@': 'src'
      }
    },
    {
      appName: 'sop-portal-front',
      baseDir: path.join(__dirname, 'resources/sop-portal-front'),
      codeDir: 'src',
      buildDir: 'dist',
      aliasMap: {}
    },
    {
      appName: 'sop-platform-front',
      baseDir: path.join(__dirname, 'resources/sop-platform-front'),
      codeDir: 'src',
      buildDir: '',
      aliasMap: {}
    },
  ],
  plugins: [
    {
      name: 'eslint-check-plugin',
      config: {}
    },
    // {
    //   name: 'stylelint-check-plugin',
    //   config: null
    // },
    // {
    //   name: 'count-check-plugin',
    //   config: {}
    // },
    // {
    //   name: 'package-check-plugin',
    //   config: null
    // },
    // {
    //   name: 'file-check-plugin',
    //   config: null
    // },
    // {
    //   name: 'dependency-check-plugin',
    //   config: null
    // },
    // {
    //   name: 'build-check-plugin',
    //   config: null
    // },
    // {
    //   name: 'config-check-plugin',
    //   config: null
    // },
    // {
    //   name: 'redundancy-check-plugin',
    //   config: null
    // }
  ]
});

scanner.scan().then(() => {
  console.log('=========Analysis completed=========');
}).catch(error => {
  console.error('Analysis failed:', error);
});