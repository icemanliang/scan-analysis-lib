const Scanner = require('./lib/scanner');
const config = require('./config');

// 启动分析流程
const scanner = new Scanner();
scanner.runAnalysis(config).finally(()=>{
  // console.log('done');
});