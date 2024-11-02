# Eslint Check Plugin

## 功能

- 检查代码中的Eslint错误
- 检查代码中的Vue文件
- 检查代码中的React文件
- 分析Eslint错误，按规则分组并统计

## 配置

- devMode: 是否为开发模式，开发模式下会输出更多调试信息
- parserOptions: 解析器配置
- settings: 设置
- env: 环境配置

## 输出

- 输出结果为JSON格式，包含以下字段：
  - errorCount: 错误数量
  - warningCount: 警告数量
  - fileList: 文件列表，每个元素包含filePath和messages字段
  - ruleList: 分析结果，包含以下字段：
    - ErrorRuleCount: 错误规则数量
    - WarningRuleCount: 警告规则数量
    - ErrorRuleList: 错误规则列表
    - WarningRuleList: 警告规则列表



