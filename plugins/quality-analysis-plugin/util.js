/**
 * 从扫描结果中提取质量分析所需的核心信息
 * @param {Object} results - 原始扫描结果
 * @returns {Object} 提取后的核心信息
 */
exports.extractQualityInfo = (results) => {
  const qualityInfo = {};

  // 提取 eslintInfo
  if (results.eslintInfo) {
    qualityInfo.eslintInfo = {
      totalFilesCount: results.eslintInfo.totalFilesCount || 0,
      errorCount: results.eslintInfo.errorCount || 0,
      warningCount: results.eslintInfo.warningCount || 0,
      fileListLength: results.eslintInfo.fileList?.length || 0,
      errorRuleCount: results.eslintInfo.ruleList?.errorRuleList?.length || 0,
      warningRuleCount: results.eslintInfo.ruleList?.warningRuleList?.length || 0,
      errorRuleList: results.eslintInfo.ruleList?.errorRuleList?.map(rule => ({
        rule: rule.rule,
        count: rule.locations?.length || 0
      })) || [],
      warningRuleList: results.eslintInfo.ruleList?.warningRuleList?.map(rule => ({
        rule: rule.rule,
        count: rule.locations?.length || 0
      })) || []
    };
  }

  // 提取 stylelintInfo
  if (results.stylelintInfo) {
    // 收集所有规则
    const ruleMap = new Map();
    results.stylelintInfo.fileList?.forEach(file => {
      file.messages?.forEach(msg => {
        const ruleName = msg.rule;
        if (ruleName) {
          ruleMap.set(ruleName, (ruleMap.get(ruleName) || 0) + 1);
        }
      });
    });

    qualityInfo.stylelintInfo = {
      totalFilesCount: results.stylelintInfo.totalFilesCount || 0,
      errorCount: results.stylelintInfo.errorCount || 0,
      fileListLength: results.stylelintInfo.fileList?.length || 0,
      errorRuleCount: ruleMap.size,
      ruleList: Array.from(ruleMap.entries()).map(([rule, count]) => ({ rule, count }))
    };
  }

  // 提取 countInfo
  if (results.countInfo) {
    qualityInfo.countInfo = {
      totalFilesCount: results.countInfo.totalFilesCount || 0,
      generatorFunctionsCount: results.countInfo.generatorFunctions?.length || 0,
      classComponentsCount: results.countInfo.classComponents?.length || 0,
      totalFunctionsCount: results.countInfo.functionStats?.total || 0,
      missingTypesFunctionsCount: results.countInfo.functionStats?.missingTypes || 0
    };
  }

  // 提取 redundancyInfo
  if (results.redundancyInfo) {
    const clones = results.redundancyInfo.statistic?.clones || [];
    qualityInfo.redundancyInfo = {
      checkFilesCount: results.redundancyInfo.statistic?.total || 0,
      duplicatesCount: clones.length,
      files: results.redundancyInfo.statistic?.files || 0,
      maxDuplicatesFiles: Math.max(...clones.map(c => c.files?.length || 0), 0),
      maxDuplicatesLine: Math.max(...clones.map(c => c.lines || 0), 0)
    };
  }

  // 提取 configInfo
  if (results.configInfo) {
    qualityInfo.configInfo = {
      packageManagerType: results.configInfo.packageJson?.packageManagerType || '',
      packageManagerVersion: results.configInfo.packageJson?.packageManagerVersion || '',
      nodeVersion: results.configInfo.nodeVersion?.version || '',
      configErrorsCount: Object.values(results.configInfo)
        .filter(config => config?.isValid === false).length
    };
  }

  // 提取 gitInfo
  if (results.gitInfo) {
    // 计算所有文件的总数
    const totalFiles = Object.values(results.gitInfo.fileStats || {})
      .reduce((sum, stat) => sum + (stat.count || 0), 0);

    // 获取文件统计信息
    const jsAndJsxFilesCount = (results.gitInfo.fileStats?.['.js']?.count || 0) + 
                              (results.gitInfo.fileStats?.['.jsx']?.count || 0);

    const tsAndTsxFilesCount = (results.gitInfo.fileStats?.['.ts']?.count || 0) + 
                              (results.gitInfo.fileStats?.['.tsx']?.count || 0);

    qualityInfo.gitInfo = {
      commitId: results.gitInfo.commitId || '',
      jsAndJsxFilesCount: jsAndJsxFilesCount,
      tsAndTsxFilesCount: tsAndTsxFilesCount,
      totalFiles,  // 新增：文件总数
      fileNamingIssuesCount: results.gitInfo.namingIssues?.files?.length || 0,
      directoryNamingIssuesCount: results.gitInfo.namingIssues?.directories?.length || 0,
      maxDirectoryDepth: results.gitInfo.directoryDepth?.maxDepth || 0,
      deepDirectoriesCount: results.gitInfo.directoryDepth?.deepDirectories?.length || 0,
      isCommitsInvaild: results.gitInfo.invalidCommits?.length > 0,
      isHuskyCheck: results.gitInfo.huskyCheck?.isValid || false
    };
  }

  return qualityInfo;
};
