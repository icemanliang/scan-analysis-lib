module.exports = {
  // 忽略的文件和目录
  ignore: {
    patterns: [
      '**/__tests__/**',
      '**/*.test.ts(x)',
      '**/*.test.js(x)',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ]
  },

  // API 检测配置
  api: {
    // DOM API 检测对象
    dom: ['document', 'window'],
    // BOM API 检测对象
    bom: ['window', 'navigator', 'screen', 'history']
  },

  // 函数检测配置
  function: {
    // Hook 函数前缀
    hookPrefix: 'use',
    // 是否跳过 Hook 函数的类型检查
    skipHookTypeCheck: true
  },

  // React 组件检测配置
  react: {
    // 基类名称
    componentBaseClasses: ['React.Component', 'Component'],
    // 必需的方法
    requiredMethods: ['render']
  }
}; 