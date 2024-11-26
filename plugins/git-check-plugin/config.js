module.exports = {
  // 命名规范配置
  naming: {
    // 文件和目录命名规则（正则表达式）
    patterns: {
      // 纯小写
      lowercase: /^[a-z]+$/,
      // kebab-case
      kebabCase: /^[a-z]+(-[a-z]+)*$/
    },
    whitelist: [
      '.d.ts',
      '404.vue',
      '404.tsx',
      '404.css',
      '404.gif',
      '404.png',
      '404.jpg',
      '404.jpeg',
      '404.svg'
    ]
  },

  // Git 相关配置
  git: {
    // commit message 规范
    commitMessagePattern: /^(Merge\s+branch\s+.*|(\[[a-zA-Z]+(?:-[a-zA-Z]+)*-\d+\]\s+(feat|fix|docs|style|refactor|test|chore)(\([a-z-]+\))?: .+))$/,
    // 获取最近的 commit 数量
    recentCommitsCount: 10,
    // 必需的 husky hooks
    requiredHooks: ['commit-msg', 'pre-commit', 'pre-push'],
    // 必需的 gitignore 项
    requiredIgnores: [
      'logs',
      '*.log',
      'node_modules',
      'dist/',
      '.DS_Store'
    ]
  },

  directory: {
    maxAllowedDepth: 5  // 建议最大目录深度
  }
}; 