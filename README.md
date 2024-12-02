# scan-analysis-lib

a tool to scan and analyze the code of the projects

## 安装

```bash
pnpm install scan-analysis-lib
```

## 使用

```javascript
const scan = require('scan-analysis-lib');

const scanConfig = {
  resultDir: 'scan-results',
  source: [
    {
      appName: 'demo',
      baseDir: 'resources/demo',
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {
        '@': './src',
      }
    },
    ...
  ],
  plugins: [
    {
      name: 'config-check-plugin',
      config: {}
    },
    {
      name: 'count-check-plugin',
      config: {}
    },
    ...
  ]
};

scan(scanConfig);
```

## 生命周期

code: 代码扫描周期
project: 工程扫描周期
dependency: 依赖扫描周期
quality: 质量分析周期

## 插件

code阶段插件：
### eslint-check-plugin eslint 检查插件
### stylelint-check-plugin stylelint 检查插件
### count-check-plugin 文件数量检查插件
### redundancy-check-plugin 冗余检查插件

project阶段插件：
### config-check-plugin 配置检查插件
### git-check-plugin git 检查插件
### build-check-plugin 构建检查插件

dependency阶段插件：
### package-check-plugin 包检查插件
### dependency-check-plugin 依赖检查插件

quality阶段插件
### quality-analysis-plugin 质量分析插件

## 企业级场景
(1) CLI Tool (命令行工具)  
(2) Node Analyze Server (服务端)
(3) Vscode Extension (VSCode 插件)




