const config = require('./config');
const { scoreDimensions: scores } = config;

/**
 * 评分维度配置
 */
const SCORE_DIMENSIONS = {
  eslintAvgIssues: {
    maxScore: scores.eslint.avgIssues.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.eslintInfo?.totalFilesCount) return 0;
      const avgErrors = qualityInfo.eslintInfo.errorCount / qualityInfo.eslintInfo.totalFilesCount;
      const avgWarnings = qualityInfo.eslintInfo.warningCount / qualityInfo.eslintInfo.totalFilesCount;
      
      return Number((Math.max(0, scores.eslint.avgIssues.maxScore * (
        scores.eslint.avgIssues.errorWeight * Math.max(0, 1 - avgErrors / scores.eslint.avgIssues.maxErrorsPerFile) + 
        scores.eslint.avgIssues.warningWeight * Math.max(0, 1 - avgWarnings / scores.eslint.avgIssues.maxWarningsPerFile)
      ))).toFixed(2));
    }
  },

  // eslint 文件占比评分
  eslintFileRatio: {
    maxScore: 5,
    calculate: (qualityInfo) => {
      if (!qualityInfo.eslintInfo?.fileListLength) return 5;
      const ratio = qualityInfo.eslintInfo.fileListLength / qualityInfo.eslintInfo.totalFilesCount;
      return Math.max(0, 5 * (1 - ratio));
    }
  },
  
  // stylelint 平均错误数评分
  stylelintAvgErrors: {
    maxScore: 8,
    calculate: (qualityInfo) => {
      if (!qualityInfo.stylelintInfo?.totalFilesCount) return 8;
      const avgErrors = qualityInfo.stylelintInfo.errorCount / qualityInfo.stylelintInfo.totalFilesCount;
      return Math.max(0, 8 * (1 - avgErrors / 5));
    }
  },

  // stylelint 文件占比评分
  stylelintFileRatio: {
    maxScore: 2,
    calculate: (qualityInfo) => {
      if (!qualityInfo.stylelintInfo?.totalFilesCount) return 2;
      const ratio = qualityInfo.stylelintInfo.fileListLength / qualityInfo.stylelintInfo.totalFilesCount;
      return Math.max(0, 2 * (1 - ratio));
    }
  },
  
  // 最大重复行数评分
  maxDuplicateLines: {
    maxScore: 5,
    calculate: (qualityInfo) => {
      // 设置阈值
      const threshold = 20; 
      // 获取最大重复行数
      const maxLines = qualityInfo.redundancyInfo?.maxDuplicatesLine || 0;
      // 如果最大重复行数不超过阈值，返回 5 分
      if (maxLines <= threshold) return 5;
      // 根据最大重复行数计算得分，使用线性计算
      return Math.max(0, 5 * (1 - (maxLines - threshold) / 50));
    }
  },
  
  // 重复文件占比评分
  duplicateFilesRatio: {
    maxScore: 3,
    calculate: (qualityInfo) => {
      // 如果没有任何重复文件，返回 0 分
      if (!qualityInfo.redundancyInfo?.checkFilesCount) return 0;
      // 计算重复文件占比
      const ratio = qualityInfo.redundancyInfo.files / qualityInfo.redundancyInfo.checkFilesCount;
      // 根据占比计算得分，使用线性计算
      return Math.max(0, 3 * (1 - ratio));
    }
  },
  
  // 重复项占比评分
  duplicateItemsRatio: {
    maxScore: 2,
    calculate: (qualityInfo) => {
      // 如果没有任何重复项，返回 0 分
      if (!qualityInfo.redundancyInfo?.checkFilesCount) return 0;
      // 计算重复项占比
      const ratio = qualityInfo.redundancyInfo.duplicatesCount / qualityInfo.redundancyInfo.checkFilesCount;
      // 根据占比计算得分，使用线性计算
      return Math.max(0, 2 * (1 - ratio));
    }
  },
  
  // node 版本评分
  nodeVersion: {
    maxScore: 2,
    calculate: (qualityInfo) => {
      // 如果没有任何 node 版本，返回 0 分  
      if (!qualityInfo.configInfo?.nodeVersion) return 0;
      // 获取 node 版本
      const version = parseInt(qualityInfo.configInfo?.nodeVersion);
      // 根据 node 版本返回得分
      if (version >= 20) return 2;
      if (version >= 18) return 1;
      return 0;
    }
  },
  
  // 提交信息评分
  commitMessage: {
    maxScore: 1,
    calculate: (qualityInfo) => qualityInfo.gitInfo?.isCommitsInvaild ? 0 : 1
  },
  
  // husky 检查评分
  huskyCheck: {
    maxScore: 1,
    calculate: (qualityInfo) => qualityInfo.gitInfo?.isHuskyCheck ? 1 : 0
  },
  
  // 目录深度评分
  directoryDepth: {
    maxScore: 1,
    calculate: (qualityInfo) => {
      // 如果目录深度不超过 5，返回 1 分
      if (!qualityInfo.gitInfo?.maxDirectoryDepth) return 1;
      const depth = qualityInfo.gitInfo?.maxDirectoryDepth || 0;
      return depth <= 5 ? 1 : 0;
    }
  },
  
  // 深层目录评分
  deepDirectories: {
    maxScore: 2,
    calculate: (qualityInfo) => {
      // 如果没有任何超过 5 层的目录，返回 2 分
      if (!qualityInfo.gitInfo?.deepDirectoriesCount) return 2;
      // 计算超过 5 层的目录占比
      const count = qualityInfo.gitInfo?.deepDirectoriesCount || 0;
      // 根据占比计算得分，使用线性计算
      return Math.max(0, 2 * (1 - count / 10));
    }
  },
  
  // 配置错误评分
  configErrors: {
    maxScore: 10,
    calculate: (qualityInfo) => {
      // 如果没有任何配置错误，返回 10 分
      if (!qualityInfo.configInfo?.configErrorsCount) return 10;
      // 计算配置错误的占比
      const errors = qualityInfo.configInfo?.configErrorsCount || 0;
      // 根据占比计算得分，使用线性计算
      return Math.max(0, 10 * (1 - errors / 100));
    }
  },
  
  // 包管理器评分
  packageManager: {
    maxScore: 1,
    calculate: (qualityInfo) => 
      qualityInfo.configInfo?.packageManagerType === 'pnpm' ? 1 : 0
  },
  
  // 生成器函数评分
  generatorFunctions: {
    maxScore: 3,
    calculate: (qualityInfo) => {
      // 如果没有任何生成器函数，返回 3 分
      if (!qualityInfo.countInfo?.generatorFunctionsCount) return 3;
      // 计算生成器函数占比
      const ratio = qualityInfo.countInfo.generatorFunctionsCount / 
        qualityInfo.countInfo.totalFilesCount;
      // 根据占比计算得分，使用线性计算
      return Math.max(0, 3 * (1 - ratio));
    }
  },
  
  // 类组件评分
  classComponents: {
    maxScore: 3,
    calculate: (qualityInfo) => {
      // 如果没有任何类组件，返回 3 分
      if (!qualityInfo.countInfo?.classComponentsCount) return 3;
      // 计算类组件占比
      const ratio = qualityInfo.countInfo.classComponentsCount / 
        qualityInfo.countInfo.totalFilesCount;
      // 根据占比计算得分，使用线性计算
      return Math.max(0, 3 * (1 - ratio));
    }
  },
  
  // 缺少类型评分
  missingTypes: {
    maxScore: 3,
    calculate: (qualityInfo) => {
      // 如果没有任何缺少类型的函数，返回 3 分
      if (!qualityInfo.countInfo?.missingTypesFunctionsCount) return 3;
      // 计算缺少类型函数的占比
      const ratio = qualityInfo.countInfo.missingTypesFunctionsCount / 
        qualityInfo.countInfo.totalFunctionsCount;
      // 根据占比计算得分，使用线性计算
      return Math.max(0, 3 * (1 - ratio));
    }
  },
  
  // TypeScript 使用率评分
  typeScriptUsage: {
    maxScore: 3,
    calculate: (qualityInfo) => {
      const tsFiles = qualityInfo.gitInfo?.tsAndTsxFilesCount || 0;
      const jsFiles = qualityInfo.gitInfo?.jsAndJsxFilesCount || 0;
      
      // 如果没有任何 JS/TS 文件，返回 0 分
      if (tsFiles === 0 && jsFiles === 0) return 0;
      
      // 如果只有 TS 文件没有 JS 文件，说明是纯 TS 项目，直接满分
      if (tsFiles > 0 && jsFiles === 0) return 3;
      
      // 计算 TS 文件占比
      const ratio = tsFiles / (tsFiles + jsFiles);
      
      // 根据占比计算得分，使用线性计算
      // 比如：
      // - 80% 的文件是 TS 文件时，得 2.4 分
      // - 50% 的文件是 TS 文件时，得 1.5 分
      // - 20% 的文件是 TS 文件时，得 0.6 分
      return Math.max(0, 3 * ratio);
    }
  },
  
  // 命名规范评分
  invalidNames: {
    maxScore: scores.codeQuality.invalidNames.maxScore,
    calculate: (qualityInfo) => {
      // 如果没有扫描文件，返回满分
      if (!qualityInfo.gitInfo?.totalFilesCount) return scores.codeQuality.invalidNames.maxScore;
      
      // 获取命名不规范的文件和目录总数
      const invalidCount = (qualityInfo.gitInfo?.invalidNameFilesCount || 0) + 
                         (qualityInfo.gitInfo?.invalidNameDirectoriesCount || 0);
      
      // 计算不规范命名的占比
      const ratio = invalidCount / qualityInfo.gitInfo.totalFilesCount;
      
      // 根据占比计算得分，使用线性计算
      return Number((Math.max(0, scores.codeQuality.invalidNames.maxScore * (1 - ratio))).toFixed(2));
    }
  }
};

/**
 * 计算质量得分
 * @param {Object} qualityInfo - 质量信息
 * @returns {Object} 得分详情
 */
function calculateQualityScore(qualityInfo) {
  const scores = {};
  let totalScore = 0;

  // 计算每个维度的得分
  Object.entries(SCORE_DIMENSIONS).forEach(([key, dimension]) => {
    const score = Number(dimension.calculate(qualityInfo).toFixed(2));
    scores[key] = {
      score,
      maxScore: dimension.maxScore
    };
    totalScore += score;
  });

  // 直接使用得分总和
  scores.total = Number(totalScore.toFixed(2));

  return scores;
}

module.exports = {
  calculateQualityScore,
  SCORE_DIMENSIONS
}; 