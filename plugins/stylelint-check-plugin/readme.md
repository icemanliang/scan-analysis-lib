# stylelint-check-plugin

stylelint 检查插件，用于检查项目中的 CSS/LESS/SCSS 文件是否符合规范。

## 配置项

```javascript
{
  // 开发模式
  devMode: false,

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

  // stylelint 规则配置
  stylelint: {
    rules: {
      // 最大嵌套深度为 5
      'max-nesting-depth': [5, {
        ignore: ['blockless-at-rules', 'pseudo-classes']
      }],
      
      // 禁止使用 ID 选择器
      'selector-max-id': [0, {
        message: 'Expected no ID selectors'
      }],
      
      // 类名必须使用驼峰命名
      'selector-class-pattern': [
        '^[a-z][a-zA-Z0-9]+$',
        {
          message: 'Expected class selector to be camelCase'
        }
      ],
      
      // 单行声明块中最多允许一条声明
      'declaration-block-single-line-max-declarations': [1, {
        message: 'Expected no more than 1 declaration per line'
      }],
      
      // 十六进制颜色必须小写
      'color-hex-case': ['lower', {
        message: 'Expected hex colors to be lowercase'
      }]
    }
  }
}
```

## 检查结果

插件会返回如下格式的检查结果：

```javascript
{
  // 错误总数
  errorCount: 10,
  
  // 违反的规则数量
  errorRuleCount: 3,
  
  // 文件列表（按错误数量降序排序）
  fileList: [
    {
      file: 'src/styles/main.less',
      errorCount: 5,
      messages: [
        {
          rule: 'max-nesting-depth',
          message: 'Expected nesting depth to be no more than 5',
          line: 23
        }
        // ...
      ]
    }
    // ...
  ],
  
  // 规则列表（按违规次数降序排序）
  ruleList: [
    {
      ruleId: 'max-nesting-depth',
      count: 5,
      locations: [
        {
          file: 'src/styles/main.less',
          line: 23,
          message: 'Expected nesting depth to be no more than 5'
        }
        // ...
      ]
    }
    // ...
  ]
}
```

## 默认规则说明

1. `max-nesting-depth`: 限制最大嵌套深度为 5 层
2. `selector-max-id`: 禁止使用 ID 选择器
3. `selector-class-pattern`: 类名必须使用驼峰命名法
4. `declaration-block-single-line-max-declarations`: 单行最多只能有一条声明
5. `color-hex-case`: 十六进制颜色值必须小写

## 支持的文件类型

- CSS 文件 (*.css)
- LESS 文件 (*.less)
- SCSS 文件 (*.scss)

## 注意事项

1. 需要安装相应的语法解析器：
   - LESS: `postcss-less`
   - SCSS: `postcss-scss`
2. 所有规则默认都是 error 级别
3. 可以通过配置的 `files` 字段自定义检查的文件范围
4. 支持通过 `glob` 配置项自定义文件匹配行为