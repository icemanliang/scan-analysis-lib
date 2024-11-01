# Count Check Plugin

## 功能

- 统计代码中的生成器函数、类组件、DOM API、BOM API的数量
- 统计代码中的函数总数、Hook函数数量、缺失类型声明的函数数量

## 配置


## 输出

- 输出结果为JSON格式，包含以下字段：
  - generatorFunctions: 生成器函数数量
  - classComponents: 类组件数量
  - domApis: DOM API数量
  - bomApis: BOM API数量
  - functionStats: 函数统计信息