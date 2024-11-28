#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const scan = require('../index');

function startScan() {
  // 检查配置文件是否存在
  const configPath = path.join(process.cwd(), 'scan.config.js');
  if (!fs.existsSync(configPath)) {
    console.error('error: scan.config.js not found in the current directory.');
    process.exit(1);
  }
  // 读取配置文件内容
  let config;
  try {
    config = require(configPath);
  } catch (error) {
    console.error('error: failed to load scan.config.js,', error);
    process.exit(1);
  }

  // 执行扫描
  scan(config).then(() => {
    console.log('\n========== scan completed. ==========\n');
  }).catch(() => {
    process.exit(1);
  });
}

startScan();