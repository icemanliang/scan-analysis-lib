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
  sources: [
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

`pre`: 扫描启动前

`code`: 代码扫描周期

`project`: 工程扫描周期

`dependency`: 依赖扫描周期

`quality`: 质量分析周期

`after`: 扫描结束后

生命周期串行顺序：`pre` ---> `code` ---> `project` ---> `dependency` ---> `quality` ---> `after`

## 内置插件

### code阶段
es规范检查插件:  eslint-check-plugin

css规范检查插件: stylelint-check-plugin

调用统计检查插件: count-check-plugin

代码冗余检查插件：redundancy-check-plugin 

### project阶段
工程配置检查插件: config-check-plugin

代码仓库检查插件: git-check-plugin

构建产物检查插件: build-check-plugin 

### dependency阶段
NPM依赖检查插件:  package-check-plugin

依赖调用检查插件:  dependency-check-plugin 

### quality阶段
应用质量分析插件:  quality-analysis-plugin 

## 企业级场景
(1) CI CLI Tool (CI卡点命令行工具)

(2) Node Analyze Server (代码分析服务)

(3) Vscode Extension (代码扫描插件)

## 自定义插件
除了扫描引擎自带的内置插件，开发者可以基于标准插件开发范式执行自定义扫描插件,在项目中安装scan-analysis-lib后，可以通过API模式来调用驱动它执行，下面是一个标准的扫描插件，以本地测试示例：

```javascript
const fs = require('fs');
const path = require('path');


// 统计指定目录下的 js 文件数量
function countJsFiles(dir) {
  // 计数器
  let count = 0;
  // 读取目录中的所有文件和子目录
  const items = fs.readdirSync(dir);
  for (const item of items) {
    // 获取当前项的完整路径
    const fullPath = path.join(dir, item);

    // 检查文件或目录
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      // 如果是目录，递归调用
      count += countJsFiles(fullPath);
    } else if (stats.isFile() && fullPath.endsWith('.js')) {
      // 如果是 .js 文件，累加计数
      count++;
    }
  }
  return count;
}

class CustomPlugin {
    constructor(config) {
      this.name = 'CustomPlugin';
      this.config = config;
      this.devMode = false;
    }
  
    apply(scanner) {
      // 自定义插件逻辑, 统计指定类型的文件数量,注册到 code 钩子中
      scanner.hooks.code.tapPromise(this.name, async (context) => {
        // this.devLog('config custom', this.config);
        try {
            context.logger.log('info', 'start custom plugin...');
            const countFileType = this.config.countFileType;
            const scanDir = path.join(context.baseDir, context.codeDir);
            const count = countJsFiles(scanDir);

            context.scanResults.customInfo = {
                total: count,
            };
            context.logger.log('info', `total ${count} ${countFileType} files`);
            context.logger.log('info', `custom plugin completed`);
        } catch(error) {
            context.scanResults.customInfo = null;
            context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
        }
      });
    }
}

module.exports = CustomPlugin;
```

然后在扫描配置中添加对于的自定义插件，声明插件代码的位置及配置即可
```javascript
const config = {
  resultDir: 'scan-results',
  sources: [
    {
      appName: 'project-a',
      baseDir: path.join(__dirname, 'resources/project-a'),
      codeDir: 'src',
      buildDir: '',
      aliasConfig: {
        "@/*": ["./src/*"]
      }
    }
  ],
  plugins: [
    {
      name: 'eslint-check-plugin',
      config: {}
    },
    {
      name: 'stylelint-check-plugin',
      config: {}
    },
    ...
    // 配置自定义插件及插件配置
    {
      name: 'custom-plugin',
      config: {
        countFileType: 'js'
      },
      customPlugin: './custom-plugin.js'    // 插件代码文件的位置
    }
  ]
};

// 执行扫描
scan(config).then((result) => {
  // console.log('scan result:', result);
}).catch((error) => {
  console.error('scan failed:', error);
});
```





