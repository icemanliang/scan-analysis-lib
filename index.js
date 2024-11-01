const Scanner = require('./lib/scanner');
const fs = require('fs');
const path = require('path');
const { PLUGINS } = require('./lib/const');

function validateSourceItem(source, index) {
  // 基本类型检查
  if (typeof source !== 'object' || source === null) {
    throw new Error(`sources[${index}] must be an object`);
  }

  // 必需属性检查（非空字符串）
  ['appName', 'baseDir', 'codeDir'].forEach(prop => {
    if (!(prop in source)) {
      throw new Error(`sources[${index}] missing required property: ${prop}`);
    }
    if (typeof source[prop] !== 'string') {
      throw new Error(`sources[${index}].${prop} must be a string`);
    }
    if (source[prop].trim() === '') {
      throw new Error(`sources[${index}].${prop} cannot be empty`);
    }
  });

  // buildDir 属性检查（必须存在且为字符串，允许为空）
  if (!('buildDir' in source)) {
    throw new Error(`sources[${index}] missing required property: buildDir`);
  }
  if (typeof source.buildDir !== 'string') {
    throw new Error(`sources[${index}].buildDir must be a string`);
  }

  // aliasMap 属性检查（必须存在且为对象，允许空对象）
  if (!('aliasMap' in source)) {
    throw new Error(`sources[${index}] missing required property: aliasMap`);
  }
  if (typeof source.aliasMap !== 'object' || source.aliasMap === null || Array.isArray(source.aliasMap)) {
    throw new Error(`sources[${index}].aliasMap must be an object`);
  }

  // 目录存在性检查
  const baseDir = source.baseDir;
  if (!fs.existsSync(baseDir)) {
    throw new Error(`sources[${index}].baseDir does not exist: ${baseDir}`);
  }

  // 代码目录存在性检查
  const codeDir = path.join(baseDir, source.codeDir);
  if (!fs.existsSync(codeDir)) {
    throw new Error(`sources[${index}].codeDir does not exist: ${codeDir}`);
  }

  // 构建目录存在性检查（仅当 buildDir 不为空时）
  if (source.buildDir.trim() !== '') {
    const buildDir = path.join(baseDir, source.buildDir);
    if (!fs.existsSync(buildDir)) {
      throw new Error(`sources[${index}].buildDir does not exist: ${buildDir}`);
    }
  }
}

function validatePluginItem(plugin, index) {
  if (typeof plugin !== 'object' || plugin === null) {
    throw new Error(`plugins[${index}] must be an object`);
  }

  // 验证 name 属性
  if (!('name' in plugin)) {
    throw new Error(`plugins[${index}] missing required property: name`);
  }
  if (typeof plugin.name !== 'string') {
    throw new Error(`plugins[${index}].name must be a string`);
  }

  // 验证插件名称是否在支持的列表中
  const supportedPlugins = Object.values(PLUGINS);
  if (!supportedPlugins.includes(plugin.name)) {
    throw new Error(
      `plugins[${index}].name "${plugin.name}" is not supported. ` +
      `Supported plugins are: ${supportedPlugins.join(', ')}`
    );
  }

  // 验证 config 属性（必须存在且为对象，允许空对象）
  if (!('config' in plugin)) {
    throw new Error(`plugins[${index}] missing required property: config`);
  }
  if (typeof plugin.config !== 'object' || plugin.config === null || Array.isArray(plugin.config)) {
    throw new Error(`plugins[${index}].config must be an object`);
  }
}

function validateConfig(config) {
  // resultDir 检查（如果存在，必须是非空字符串）
  if ('resultDir' in config) {
    if (typeof config.resultDir !== 'string') {
      throw new Error('resultDir must be a string');
    }
    if (config.resultDir.trim() === '') {
      throw new Error('resultDir cannot be empty');
    }
  }

  // 验证数组存在性
  ['sources', 'plugins'].forEach(key => {
    if (!Array.isArray(config[key]) || config[key].length === 0) {
      throw new Error(`${key} must be a non-empty array in the configuration`);
    }
  });

  // 验证每个配置项
  config.sources.forEach(validateSourceItem);
  config.plugins.forEach(validatePluginItem);
}

module.exports = function createScanner(config = {}) {
  validateConfig(config);
  return new Scanner(config);
};