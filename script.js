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
      aliasConfig: {}
    },
    {
      appName: 'sop-portal-front',
      baseDir: path.join(__dirname, 'resources/sop-portal-front'),
      codeDir: 'src',
      buildDir: 'dist',
      aliasConfig: {}
    },
    {
      appName: 'sop-platform-front',
      baseDir: path.join(__dirname, 'resources/sop-platform-front'),
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
    // {
    //   name: 'count-check-plugin',
    //   config: {}
    // },
    // {
    //   name: 'git-check-plugin',
    //   config: {}
    // },
    // {
    //   name: 'config-check-plugin',
    //   config: {}
    // },
    // {
    //   name: 'package-check-plugin',
    //   config: {}
    // },
    // {
    //   name: 'dependency-check-plugin',
    //   config: {}
    // },
    // {
    //   name: 'build-check-plugin',
    //   config: {}
    // },
    // {
    //   name: 'redundancy-check-plugin',
    //   config: {}
    // }
  ]
});

scanner.scan().then(() => {
  console.log('=========Analysis completed=========');
}).catch(error => {
  console.error('Analysis failed:', error);
});