module.exports = {
  // 重复代码检测配置
  detection: {
    minLines: 10,      // 最小重复行数
    minTokens: 50,     // 最小重复token数
    mode: 'mild'       // 检测模式：strict/mild/weak
  },
  // 最大检测文件数, 防止内存溢出
  maxFilesLimit: 10000,

  // 文件匹配配置
  files: {
    patterns: '**/*.{js,ts,jsx,tsx}',  // 文件匹配模式
    ignore: [                          // 忽略的文件/目录
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/public/**'
    ]
  }
}; 