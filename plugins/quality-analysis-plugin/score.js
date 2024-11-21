const config = require('./config');
const { scoreDimensions: scores } = config;

/**
 * 评分维度配置
 * 每个维度包含:
 * - maxScore: 最高分值
 * - calculate: 计算函数，接收 qualityInfo 参数，返回得分
 */
const SCORE_DIMENSIONS = {
  // ESLint 平均错误数评分
  // 计算逻辑：根据每个文件的平均 error 和 warning 数量计算得分
  // error 和 warning 分别有权重，超过阈值得 0 分，否则按比例得分
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

  // ESLint 文件覆盖率评分
  // 计算逻辑：有问题的文件数量占总文件数的比例越低得分越高
  eslintFileRatio: {
    maxScore: scores.eslint.fileRatio.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.eslintInfo?.fileListLength) return scores.eslint.fileRatio.maxScore;
      const ratio = qualityInfo.eslintInfo.fileListLength / qualityInfo.eslintInfo.totalFilesCount;
      return Number(Math.max(0, scores.eslint.fileRatio.maxScore * (1 - ratio)).toFixed(2));
    }
  },
  
  // StyleLint 平均错误数评分
  // 计算逻辑：每个文件的平均错误数，超过阈值得 0 分，否则按比例得分
  stylelintAvgErrors: {
    maxScore: scores.stylelint.avgErrors.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.stylelintInfo?.totalFilesCount) return scores.stylelint.avgErrors.maxScore;
      const avgErrors = qualityInfo.stylelintInfo.errorCount / qualityInfo.stylelintInfo.totalFilesCount;
      return Number(Math.max(0, scores.stylelint.avgErrors.maxScore * 
        (1 - avgErrors / scores.stylelint.avgErrors.maxErrorsPerFile)).toFixed(2));
    }
  },

  // StyleLint 文件覆盖率评分
  // 计算逻辑：有问题的文件数量占总文件数的比例越低得分越高
  stylelintFileRatio: {
    maxScore: scores.stylelint.fileRatio.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.stylelintInfo?.totalFilesCount) return scores.stylelint.fileRatio.maxScore;
      const ratio = qualityInfo.stylelintInfo.fileListLength / qualityInfo.stylelintInfo.totalFilesCount;
      return Number(Math.max(0, scores.stylelint.fileRatio.maxScore * (1 - ratio)).toFixed(2));
    }
  },
  
  // 代码重复行数评分
  // 计算逻辑：最大重复行数超过阈值后，按惩罚系数计算扣分
  maxDuplicateLines: {
    maxScore: scores.duplication.maxLines.maxScore,
    calculate: (qualityInfo) => {
      const maxLines = qualityInfo.redundancyInfo?.maxDuplicatesLine || 0;
      if (maxLines <= scores.duplication.maxLines.threshold) return scores.duplication.maxLines.maxScore;
      return Number(Math.max(0, scores.duplication.maxLines.maxScore * 
        (1 - (maxLines - scores.duplication.maxLines.threshold) / scores.duplication.maxLines.penaltyFactor)).toFixed(2));
    }
  },
  
  // 重复文件占比评分
  // 计算逻辑：包含重复代码的文件数量占检查文件总数的比例越低得分越高
  duplicateFilesRatio: {
    maxScore: scores.duplication.filesRatio.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.redundancyInfo?.checkFilesCount) return 0;
      const ratio = qualityInfo.redundancyInfo.files / qualityInfo.redundancyInfo.checkFilesCount;
      return Number(Math.max(0, scores.duplication.filesRatio.maxScore * (1 - ratio)).toFixed(2));
    }
  },
  
  // 重复项占比评分
  // 计算逻辑：重复代码块数量占检查文件总数的比例越低得分越高
  duplicateItemsRatio: {
    maxScore: scores.duplication.itemsRatio.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.redundancyInfo?.checkFilesCount) return 0;
      const ratio = qualityInfo.redundancyInfo.duplicatesCount / qualityInfo.redundancyInfo.checkFilesCount;
      return Number(Math.max(0, scores.duplication.itemsRatio.maxScore * (1 - ratio)).toFixed(2));
    }
  },
  
  // Node.js 版本评分
  // 计算逻辑：
  // - 达到或超过推荐版本得满分
  // - 达到最低版本得一半分
  // - 低于最低版本得 0 分
  nodeVersion: {
    maxScore: scores.node.version.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.configInfo?.nodeVersion) return 0;
      const version = parseInt(qualityInfo.configInfo?.nodeVersion);
      if (version >= scores.node.version.recommended) return scores.node.version.maxScore;
      if (version >= scores.node.version.minimum) return scores.node.version.maxScore / 2;
      return 0;
    }
  },
  
  // Git 提交信息规范评分
  // 计算逻辑：提交信息不规范得 0 分，规范得满分
  commitMessage: {
    maxScore: scores.git.commitMessage.maxScore,
    calculate: (qualityInfo) => qualityInfo.gitInfo?.isCommitsInvaild ? 0 : scores.git.commitMessage.maxScore
  },
  
  // Husky 检查配置评分
  // 计算逻辑：配置了 Husky 得满分，否则得 0 分
  huskyCheck: {
    maxScore: scores.git.huskyCheck.maxScore,
    calculate: (qualityInfo) => qualityInfo.gitInfo?.isHuskyCheck ? scores.git.huskyCheck.maxScore : 0
  },
  
  // 目录深度评分
  // 计算逻辑：最大目录深度不超过阈值得满分，否则得 0 分
  directoryDepth: {
    maxScore: scores.directory.depth.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.gitInfo?.maxDirectoryDepth) return scores.directory.depth.maxScore;
      const depth = qualityInfo.gitInfo?.maxDirectoryDepth || 0;
      return depth <= scores.directory.depth.maxDepth ? scores.directory.depth.maxScore : 0;
    }
  },
  
  // 深层目录数量评分
  // 计算逻辑：深层目录数量占阈值的比例越低得分越高
  deepDirectories: {
    maxScore: scores.directory.deep.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.gitInfo?.deepDirectoriesCount) return scores.directory.deep.maxScore;
      const count = qualityInfo.gitInfo?.deepDirectoriesCount || 0;
      return Number(Math.max(0, scores.directory.deep.maxScore * 
        (1 - count / scores.directory.deep.maxCount)).toFixed(2));
    }
  },
  
  // 配置错误评分
  // 计算逻辑：配置错误数量占阈值的比例越低得分越高
  configErrors: {
    maxScore: scores.config.errors.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.configInfo?.configErrorsCount) return scores.config.errors.maxScore;
      const errors = qualityInfo.configInfo?.configErrorsCount || 0;
      return Number(Math.max(0, scores.config.errors.maxScore * 
        (1 - errors / scores.config.errors.maxErrors)).toFixed(2));
    }
  },
  
  // 包管理器选择评分
  // 计算逻辑：使用推荐的包管理器得满分，否则得 0 分
  packageManager: {
    maxScore: scores.config.packageManager.maxScore,
    calculate: (qualityInfo) => 
      qualityInfo.configInfo?.packageManagerType === scores.config.packageManager.preferredType ? 
        scores.config.packageManager.maxScore : 0
  },
  
  // 生成器函数使用评分
  // 计算逻辑：生成器函数数量占总文件数的比例越低得分越高
  generatorFunctions: {
    maxScore: scores.codeQuality.generatorFunctions.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.countInfo?.generatorFunctionsCount) return scores.codeQuality.generatorFunctions.maxScore;
      const ratio = qualityInfo.countInfo.generatorFunctionsCount / qualityInfo.countInfo.totalFilesCount;
      return Number(Math.max(0, scores.codeQuality.generatorFunctions.maxScore * (1 - ratio)).toFixed(2));
    }
  },
  
  // 类组件使用评分
  // 计算逻辑：类组件数量占总文件数的比例越低得分越高
  classComponents: {
    maxScore: scores.codeQuality.classComponents.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.countInfo?.classComponentsCount) return scores.codeQuality.classComponents.maxScore;
      const ratio = qualityInfo.countInfo.classComponentsCount / qualityInfo.countInfo.totalFilesCount;
      return Number(Math.max(0, scores.codeQuality.classComponents.maxScore * (1 - ratio)).toFixed(2));
    }
  },
  
  // 类型完整性评分
  // 计算逻辑：缺少类型的函数数量占总函数数量的比例越低得分越高
  missingTypes: {
    maxScore: scores.codeQuality.missingTypes.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.countInfo?.missingTypesFunctionsCount) return scores.codeQuality.missingTypes.maxScore;
      const ratio = qualityInfo.countInfo.missingTypesFunctionsCount / qualityInfo.countInfo.totalFunctionsCount;
      return Number(Math.max(0, scores.codeQuality.missingTypes.maxScore * (1 - ratio)).toFixed(2));
    }
  },
  
  // TypeScript 使用率评分
  // 计算逻辑：
  // - 全部使用 TS 得满分
  // - 没有 JS/TS 文件得 0 分
  // - 其他情况按 TS 文件比例得分
  typeScriptUsage: {
    maxScore: scores.codeQuality.typeScriptUsage.maxScore,
    calculate: (qualityInfo) => {
      const tsFiles = qualityInfo.gitInfo?.tsAndTsxFilesCount || 0;
      const jsFiles = qualityInfo.gitInfo?.jsAndJsxFilesCount || 0;
      
      if (tsFiles === 0 && jsFiles === 0) return 0;
      if (tsFiles > 0 && jsFiles === 0) return scores.codeQuality.typeScriptUsage.maxScore;
      
      const ratio = tsFiles / (tsFiles + jsFiles);
      return Number(Math.max(0, scores.codeQuality.typeScriptUsage.maxScore * ratio).toFixed(2));
    }
  },
  
  // 命名规范评分
  // 计算逻辑：不规范命名的文件和目录数量占总文件数的比例越低得分越高
  invalidNames: {
    maxScore: scores.codeQuality.invalidNames.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.gitInfo?.totalFilesCount) return scores.codeQuality.invalidNames.maxScore;
      
      const invalidCount = (qualityInfo.gitInfo?.invalidNameFilesCount || 0) + 
                         (qualityInfo.gitInfo?.invalidNameDirectoriesCount || 0);
      
      const ratio = invalidCount / qualityInfo.gitInfo.totalFilesCount;
      return Number(Math.max(0, scores.codeQuality.invalidNames.maxScore * (1 - ratio)).toFixed(2));
    }
  },

  // BOM API 使用评分
  // 计算逻辑：使用对数函数计算，平均调用次数越少得分越高
  bomApiAvgCount: {
    maxScore: scores.apis.bom.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.countInfo?.totalFilesCount) return scores.apis.bom.maxScore;
      const avgCalls = qualityInfo.countInfo.bomApiTotalCount / qualityInfo.countInfo.totalFilesCount;
      
      const score = scores.apis.bom.maxScore * 
        (1 - Math.log10(avgCalls + 1) / Math.log10(scores.apis.bom.maxCallsPerFile + 1));
      return Number(Math.max(0, score).toFixed(2));
    }
  },

  // DOM API 使用评分
  // 计算逻辑：使用对数函数计算，平均调用次数越少得分越高
  domApiAvgCount: {
    maxScore: scores.apis.dom.maxScore,
    calculate: (qualityInfo) => {
      if (!qualityInfo.countInfo?.totalFilesCount) return scores.apis.dom.maxScore;
      const avgCalls = qualityInfo.countInfo.domApiTotalCount / qualityInfo.countInfo.totalFilesCount;
      
      const score = scores.apis.dom.maxScore * 
        (1 - Math.log10(avgCalls + 1) / Math.log10(scores.apis.dom.maxCallsPerFile + 1));
      return Number(Math.max(0, score).toFixed(2));
    }
  },

  // 相似包评分
  // 计算逻辑：存在相似包得 0 分，否则得满分
  similarPackages: {
    maxScore: scores.packages.similar.maxScore,
    calculate: (qualityInfo) => qualityInfo.packageInfo?.similarPackagesCount > 0 ? 0 : scores.packages.similar.maxScore
  },

  // 风险包评分
  // 计算逻辑：存在风险包得 0 分，否则得满分
  npmPackages: {
    maxScore: scores.packages.risk.maxScore,
    calculate: (qualityInfo) => qualityInfo.packageInfo?.riskPackagesCount > 0 ? 0 : scores.packages.risk.maxScore
  }
};

/**
 * 计算质量得分
 * @param {Object} qualityInfo - 质量信息对象
 * @returns {Object} 包含各维度得分和总分的对象
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

  // 计算总分
  scores.total = Number(totalScore.toFixed(2));
  scores.maxScore = Object.values(SCORE_DIMENSIONS).reduce((sum, dimension) => sum + dimension.maxScore, 0);

  return scores;
}

module.exports = {
  calculateQualityScore,
  SCORE_DIMENSIONS
}; 