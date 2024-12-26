module.exports = {
  // 文件配置
  files: [
    { pattern: '**/*.less', syntax: 'postcss-less' },
    { pattern: '**/*.scss', syntax: 'postcss-scss' },
    { pattern: '**/*.css', syntax: null }
  ],

  // stylelint 配置
  stylelint: {
    rules: {
      'max-nesting-depth': 5,   // 最大嵌套深度
      'selector-max-id': 0,      // 最大id选择器数量
      'selector-class-pattern': "^[a-z][a-z0-9-]*$|^[a-z][a-zA-Z0-9]+$",  // 类名必需为小写或驼峰，小写支持中划线拼接
      'declaration-block-single-line-max-declarations': 1, // 单行最大声明数量
      'color-hex-case': "lower", // 十六进制颜色必须小写
      'color-no-invalid-hex': true, // 十六进制颜色必须有效
      'declaration-block-no-duplicate-properties': true, // 禁止重复属性
      'block-no-empty': true, // 禁止空块
    }
  }
}; 