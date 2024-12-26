import { AsyncSeriesHook } from "tapable";

// 扫描函数
declare function scan(config: ScannerOptions): Promise<ScannerResults>;

// 扫描应用目录配置
interface Source {
  appName: string;
  baseDir: string;
  codeDir: string;
  buildDir?: string;
  aliasConfig: {
    [key: string]: string[];
  };
  subDirs?: string[];
}
// 插件配置接口
interface PluginConfig {
  name: string;
  config: Record<string, any>;
}
// 基础配置接口
interface ScannerOptions {
  resultDir: string;
  maxWorkerNum: number;
  sources: Array<Source>;
  plugins?: Array<PluginConfig>;    
}

interface Manifest {
  appName: string;
  duration: number;
  resultFile: string;
  logFile: string;
}

// 扫描结果接口
interface ScannerResults {
  scanResults: Array<Manifest>;
  scanTotalTime: number;
  scanLogFile: string;
}

// worker 上下文接口
interface Context {
  appName: string;
  baseDir: string;        
  codeDir: string;
  buildDir?: string;
  aliasConfig: {
    [key: string]: string[];
  };
  subDirs?: string[];
  scanResults: WorkerResult;
  logger: Logger;
}

// 日志接口
interface Logger {
  log(level: 'info' | 'warn' | 'error', message: string): void;
}

  // 插件接口
interface Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
}

// 统计检查插件
declare class CountCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// Eslint 插件
declare class EslintCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// Stylelint 插件
declare class StylelintCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// 冗余检查插件
declare class RedundancyCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// 配置检查插件
declare class ConfigCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// Git 检查插件
declare class GitCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// 构建产物检查插件
declare class BuildCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// 包信息检查插件
declare class PackageCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// 依赖检查插件
declare class DependencyCheckPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// 质量检查插件
declare class QualityAnalysisPlugin implements Plugin {
  name: string;
  devMode: boolean;
  devLog(title: string, message: string): void;
  apply(scanner: Scanner): void;
  config: Record<string, any>;
}

// 扫描器类
declare class Scanner {
  resultDir: string;
  sources: Array<Source>;
  plugins: Array<PluginConfig>;
  maxWorkerNum: number;
  queue: Array<Source>;
  logger: Logger;
  // 扫描入口方法
  scan(): Promise<ScannerResults>;
  // 创建工作进程
  createWorker(source: Source): Promise<Manifest>;
}

// worker 类
declare class Worker {
  source: Source;
  resultFile: string;
  logFile: string;
  scanResults: WorkerResult;
  plugins: Array<PluginConfig>;
  logger: Logger;
  hooks: {
    code: AsyncSeriesHook<Context>;           
    project: AsyncSeriesHook<Context>;        
    dependencies: AsyncSeriesHook<Context>;   
    quality: AsyncSeriesHook<Context>;        
  };
  // 日志记录
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string): void;
  // 发送消息到主进程
  sendMessageToParent(type: string, level: string, text: string): void;
  // 注册插件
  usePlugin(plugin: Plugin): void;
  // 运行插件
  runPlugin(): Promise<WorkerResult>;
  // 保存扫描结果
  saveResults(results: WorkerResult): void;
}

  // ESLint检查结果
interface EslintInfo {
  totalFilesCount: number;
  errorCount: number;
  warningCount: number;
  fileList: Array<{
    file: string;
    messages: Array<{
      rule: string;
      severity: number;
      message: string;
      line: number;
    }>;
    errorCount: number;
    warningCount: number;
  }>;
  errorRuleCount: number;
  warningRuleCount: number;
  ruleList: {
    errorRuleList: Array<{
      rule: string;
      count: number;
      locations: Array<{
        file: string;
        line: number;
        message: string;
      }>;
    }>;
    warningRuleList: Array<{
      rule: string;
      count: number;
      locations: Array<{
        file: string;
        line: number;
        message: string;
      }>;
    }>;
  }
}

  // Stylelint检查结果
interface StylelintInfo {
  totalFilesCount: number;
  errorCount: number;
  fileList: Array<{
    file: string;
    errorCount: number;
    messages: Array<{
      rule: string;
      message: string;
      line: number;
    }>;
  }>;
  errorRuleCount: number;
  errorRuleList: Array<{
    rule: string;
    count: number;
    locations: Array<{
      file: string;
      line: number;
      message: string;
    }>;
  }>;
}

// 统计检查结果
interface CountInfo {
  generatorFunctions: Array<{
    file: string;
    name: string;
    line: number;
  }>;
  classComponents: Array<{
    file: string;
    name: string;
    line: number;
  }>;
  domApis: {
    [key: string]: Array<{
      file: string;
      line: number;
    }>;
  };
  bomApis: {
    [key: string]: Array<{
      file: string;
      line: number;
    }>;
  };
  functionStats: {
    total: number;
    hooks: number;
    missingTypes: number;
    functionsWithMissingTypes: Array<{
      name: string;
      file: string;
      line: number;
      hasParameterTypes: boolean;
      hasReturnType: boolean;
    }>;
  };
  tFunctionCheck: {
    total: number;
    fileList: Array<{
      file: string;
      issueCount: number;
      issues: Array<{
        reason: string;
        line: number;
      }>;
    }>;
    noParamCalls: Array<{
      file: string;
      line: number;
      reason: string;
    }>;
    runParamCalls: Array<{
      file: string;
      line: number;
      reason: string;
    }>;
    noParamCallsCount: number;
    runParamCallsCount: number;
    issueRules: Array<{
      reason: string;
      count: number;
    }>;
  };
  domApiTotalCount: number;
  bomApiTotalCount: number;
  totalFilesCount: number;
}

  // 构建产物检查结果
interface BuildInfo {
  stats: {
    html: { count: number; size: number };
    js: { count: number; size: number };
    css: { count: number; size: number };
    media: { count: number; size: number };
    other: { count: number; size: number };
    total: { count: number; size: number };
  };
  htmlChecks: Array<{
    file: string;
    errors: string[];
    warnings: string[];
  }>;
  jsChecks: Array<{
    file: string;
    useStrict: boolean;
    isMinified: boolean;
    hasSourceMap: boolean;
  }>;
  cssChecks: Array<{
    file: string;
    prefixCheck: {
      missingPrefixes: boolean;
      warnings: string[];
    };
    isMinified: boolean;
  }>;
}

interface PackageInfo {
  dependencies: {
    [key: string]: {
      declaredVersion: string;
      lockedVersion: string | null;
    };
  };
  privatePackages: Array<string>;
  riskPackages: Array<{
    name: string;
    reason: string;
    lastModifiedMonths: number;
    lastPublishMonths: number;
    monthlyDownloads: number;
    latestVersion: string;
    license: string;
    licenseRisk: string;
  }>;
  similarPackages: Array<Array<string>>;
  versionUpgrades: Array<{
    name: string;
    currentVersion: string;
    recommendedVersion: string;
    message: string;
  }>;
} 

  // 配置检查结果
interface ConfigInfo {
  commitlint?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
    filePath?: string;
  };
  prettier?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
    filePath?: string;
  };
  readme?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
  };
  npmrc?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
  };
  eslint?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
    filePath?: string;
  };
  tsconfig?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
  };
  nodeVersion?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
    version: string;
  };
  editorconfig?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
  };
  packageJson?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
    packageManagerType: string | null;
    packageManagerVersion: string | null;
  };
  browserslist?: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
  };
}

  // 依赖检查结果
interface DependencyInfo {
  internal: {
    [key: string]: {
      count: number;
      dependents: Array<string>;
    };
  };
  external: {
    [key: string]: {
      count: number;
      dependents: Array<string>;
      detailedImports: {
        [key: string]: {
          count: number;
          files: Array<string>;
        };
      };
    };
  };
  dependencyZeroFiles: Array<string>;
}

// Git 检查结果
interface GitInfo {
  commitId: string;
  fileStats: {
    [key: string]: {
      count: number;
      totalSize: number;
    };
  };
  namingIssues: {
    directories: Array<string>;
    files: Array<string>;
  };
  invalidCommits: Array<{
    hash: string;
    message: string;
  }>;
  huskyCheck: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
  };
  gitignoreCheck: {
    exists: boolean;
    isValid: boolean;
    errors: string[];
  };
  directoryDepth: {
    maxDepth: number;
    deepDirectories: Array<{
      path: string;
      depth: number;
    }>;
  };
}

// 冗余检查结果
interface RedundancyInfo {
  total: number;
  duplicates: number;
  files: number;
  clones: Array<{
    files: Array<{
      name: string;
      startLine: number;
      endLine: number;
    }>;
    lines: number;
    tokens: number;
  }>;
}
// 质量检查结果
interface QualityInfo {
  eslintInfo: {
    totalFilesCount: number;
    errorCount: number;
    warningCount: number;
    fileListLength: number;
    errorRuleCount: number;
    warningRuleCount: number;
    errorRuleList: Array<{
      rule: string;
      count: number;
    }>;
    warningRuleList: Array<{
      rule: string;
      count: number;
    }>;
  };
  stylelintInfo: {
    totalFilesCount: number;
    errorCount: number;
    fileListLength: number;
    errorRuleCount: number;
    errorRuleList: Array<{
      rule: string;
      count: number;
    }>;
  };
  countInfo: {
    totalFilesCount: number;
    domApiTotalCount: number;
    bomApiTotalCount: number;
    generatorFunctionsCount: number;
    classComponentsCount: number;
    totalFunctionsCount: number;
    missingTypesFunctionsCount: number;
    tFunctionTotalCount: number;
    tFunctionIssuesCount: number;
  };
  redundancyInfo: {
    checkFilesCount: number;
    duplicatesCount: number;
    files: number;
    maxDuplicatesFiles: number;
    maxDuplicatesLine: number;
  };
  configInfo: {
    isReadmeValid: boolean;
    isPackageJsonValid: boolean;
    packageManagerType: string;
    packageManagerVersion: string;
    isNpmrcValid: boolean;
    isNodeVersionValid: boolean;
    nodeVersion: string;
    configInfoCount: number;
    configInfoValidCount: number;
    configInfoInvalidErrorCount: number;
  };
  gitInfo: {
    commitId: string;
    jsAndJsxFilesCount: number;
    tsAndTsxFilesCount: number;
    totalFiles: number;
    totalSize: number;
    fileNamingIssuesCount: number;
    directoryNamingIssuesCount: number;
    maxDirectoryDepth: number;
    deepDirectoriesCount: number;
    isCommitsInvaild: boolean;
    isHuskyCheck: boolean;
  };
  packageInfo: {
    riskPackagesCount: number;
    similarPackagesCount: number;
    updatePackagesCount: number;
  };
  qualityScore: {
    [key: string]: {
      score: number;
      maxScore: number;
    };
  };
}

  // worker进程扫描结果
interface WorkerResult {
  eslintInfo?: EslintInfo;                    
  stylelintInfo?: StylelintInfo;              
  countInfo?: CountInfo;                         
  buildInfo?: BuildInfo;                      
  packageInfo?: PackageInfo;                       
  dependencyInfo?: DependencyInfo;            
  gitInfo?: GitInfo;                           
  redundancyInfo?: RedundancyInfo;                    
  configInfo?: ConfigInfo;                    
  qualityInfo?: QualityInfo;                       
}