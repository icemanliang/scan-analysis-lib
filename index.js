const Scanner = require('./lib/scanner');
const path = require('path');

function validateSourceItem(source, index) {
  if (typeof source !== 'object' || source === null) {
    throw new Error(`sources[${index}] must be an object`);
  }

  ['appName', 'baseDir', 'codeDir'].forEach(prop => {
    if (!(prop in source)) {
      throw new Error(`sources[${index}] missing required property: ${prop}`);
    }
    if (typeof source[prop] !== 'string') {
      throw new Error(`sources[${index}].${prop} must be a string`);
    }
  });

  if ('buildDir' in source && typeof source.buildDir !== 'string') {
    throw new Error(`sources[${index}].buildDir must be a string`);
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

  // 验证 enable 属性
  if (!('enable' in plugin)) {
    throw new Error(`plugins[${index}] missing required property: enable`);
  }
  if (typeof plugin.enable !== 'boolean') {
    throw new Error(`plugins[${index}].enable must be a boolean`);
  }

  // 验证 config 属性
  if (!('config' in plugin)) {
    throw new Error(`plugins[${index}] missing required property: config`);
  }
  if (plugin.config !== null && (typeof plugin.config !== 'object' || Array.isArray(plugin.config))) {
    throw new Error(`plugins[${index}].config must be an object or null`);
  }
}

function validateConfig(config) {
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
