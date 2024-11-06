module.exports = {
  // 文件配置
  files: [
    { pattern: 'src/**/*.less', syntax: 'postcss-less' },
    { pattern: 'src/**/*.scss', syntax: 'postcss-scss' },
    { pattern: 'src/**/*.css', syntax: null }
  ],

  // glob 配置
  glob: {
    followSymbolicLinks: false,
    deep: 5
  },

  // stylelint 配置
  stylelint: {
    rules: {
      'max-nesting-depth': 5,
      'selector-max-id': 0,
      'selector-class-pattern': "^[a-z][a-zA-Z0-9]+$",
      'declaration-block-single-line-max-declarations': 1,
      'color-hex-case': "lower",
      'color-no-invalid-hex': true,
      'declaration-block-no-duplicate-properties': true,
      'block-no-empty': true,
    }
  }
}; 