module.exports = {
  // 问题严重程度权重
  severityWeights: {
    critical: 10,
    major: 5,
    minor: 2,
    info: 1
  },

  // 需要提取的关键指标
  metrics: {
    codeQuality: [
      'eslintErrorCount',
      'redundancyCount',
      'dependencyIssues'
    ],
    buildQuality: [
      'buildSize',
      'minificationRate',
      'sourceMapStatus'
    ],
    configQuality: [
      'configErrorCount',
      'missingConfigs',
      'invalidConfigs'
    ]
  },

  // 质量分数计算配置
  scoring: {
    maxScore: 100,
    penaltyFactors: {
      eslintError: 2,
      redundancy: 1,
      configError: 3
    }
  }
}; 