declare namespace CodeScanner {
  interface ScannerOptions {
    baseDir: string;        // 项目根目录
    codeDir?: string;       // 代码目录,默认 src
    devMode?: boolean;      // 是否开启调试模式
    plugins?: Plugin[];     // 插件列表
  }

  interface Context {
    baseDir: string;        // 项目根目录
    codeDir: string;        // 代码目录
    devMode: boolean;       // 是否开启调试模式
  }

  interface Plugin {
    name: string;           // 插件名称
    apply(scanner: Scanner): void;  // 插件注册方法
  }

  interface Scanner {
    options: ScannerOptions;
    context: Context;
    hooks: {
      code: AsyncSeriesHook;            // 代码检查钩子
      project: AsyncSeriesHook;         // 项目检查钩子
      dependencies: AsyncSeriesHook;    // 依赖检查钩子
      quality: AsyncSeriesHook;         // 质量检查钩子
    };
    run(): Promise<ScanResult>;     // 执行扫描
  }

  interface ScanResult {
    configInfo?: any;                  // 项目信息
    dependenciesInfo?: any;             // 依赖信息
    eslintInfo?: any;                   // eslint 信息
    stylelintInfo?: any;                // stylelint 信息
    countInfo?: any;                   // 统计信息
    qualityInfo?: any;                  // 质量信息
  }
}

export = CodeScanner; 