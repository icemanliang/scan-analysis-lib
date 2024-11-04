module.exports = {
  // 开发模式
  devMode: false,

  // 命名规范配置
  naming: {
    // 文件和目录命名规则（正则表达式）
    patterns: {
      // 纯小写
      lowercase: /^[a-z]+$/,
      // kebab-case
      kebabCase: /^[a-z]+(-[a-z]+)*$/
    }
  },

  // Git 相关配置
  git: {
    // commit message 规范
    commitMessagePattern: /^(Merge branch|(\[[A-Z]+-\d+\]\s)?(feat|fix|docs|style|refactor|test|chore)(\([\w-]+\))?: .+)/,
    // 获取最近的 commit 数量
    recentCommitsCount: 10,
    // 必需的 husky hooks
    requiredHooks: ['commit-msg', 'pre-commit', 'pre-push'],
    // 必需的 gitignore 项
    requiredIgnores: [
      'logs',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'lerna-debug.log*',
      '.pnpm-debug.log*',
      '.yarn/cache',
      '.yarn/unplugged',
      '.yarn/build-state.yml',
      '.yarn/install-state.gz',
      '.pnp.*',
      '.temp*',
      '.cache*',
      'node_modules',
      'dist/',
      '.DS_Store'
    ]
  }
}; 