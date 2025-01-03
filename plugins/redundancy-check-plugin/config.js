module.exports = {
  // 重复代码检测配置
  jsCheck: {
    minLines: 20,      // 最小重复行数
    minTokens: 50,     // 最小重复token数
    maxFilesLimit: 10000,
    files: {
      patterns: '**/*.{js,ts}',  // 文件匹配模式
      ignore: [                          // 忽略的文件/目录
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/public/**'
      ]
    }
  },
  jsxCheck: {
    minLines: 50,      // 最小重复行数
    minTokens: 50,     // 最小重复token数
    maxFilesLimit: 10000,
    files: {
      patterns: '**/*.{jsx,tsx}',  // 文件匹配模式
      ignore: [                          // 忽略的文件/目录
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/public/**'
      ]
    }
  }
}; 