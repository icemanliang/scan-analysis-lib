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
    qualityInfo.stylelintInfo = {
      totalFilesCount: results.stylelintInfo.totalFilesCount || 0,
      errorCount: results.stylelintInfo.errorCount || 0,
      fileListLength: results.stylelintInfo.fileList?.length || 0,
      errorRuleCount: results.stylelintInfo.errorRuleCount || 0,
      errorRuleList: results.stylelintInfo.errorRuleList.map(rule => ({
        rule: rule.rule,
        count: rule.count
      }))
    };
  }

  // 提取 countInfo
  if (results.countInfo) {
    qualityInfo.countInfo = {
      totalFilesCount: results.countInfo.totalFilesCount || 0,
      domApiTotalCount: results.countInfo.domApiTotalCount || 0,
      bomApiTotalCount: results.countInfo.bomApiTotalCount || 0,
      generatorFunctionsCount: results.countInfo.generatorFunctions?.length || 0,
      classComponentsCount: results.countInfo.classComponents?.length || 0,
      totalFunctionsCount: results.countInfo.functionStats?.total || 0,
      missingTypesFunctionsCount: results.countInfo.functionStats?.missingTypes || 0,
      tFunctionTotalCount: results.countInfo.tFunctionCheck?.total || 0,
      tFunctionIssuesCount: results.countInfo.tFunctionCheck?.issuesCount || 0,
    };
  }

  // 提取 redundancyInfo
  if (results.redundancyInfo) {
    const clones = results.redundancyInfo?.clones || [];
    qualityInfo.redundancyInfo = {
      checkFilesCount: results.redundancyInfo?.total || 0,
      duplicatesCount: clones.length,
      files: results.redundancyInfo?.files || 0,
      maxDuplicatesFiles: Math.max(...clones.map(c => c.files?.length || 0), 0),
      maxDuplicatesLine: Math.max(...clones.map(c => c.lines || 0), 0)
    };
  }

  // 提取 configInfo
  if (results.configInfo) {
    qualityInfo.configInfo = {
      // readme 配置是否有效
      isReadmeValid: results.configInfo.readme?.exists && results.configInfo.readme?.isValid || false,
      // packageJson 配置是否有效
      isPackageJsonValid: results.configInfo.packageJson?.exists && results.configInfo.packageJson?.isValid || false,
      // packageManager 配置
      packageManagerType: results.configInfo.packageJson?.packageManagerType || '',
      // packageManagerVersion 配置
      packageManagerVersion: results.configInfo.packageJson?.packageManagerVersion || '',
      // npmrc 配置
      isNpmrcValid: results.configInfo.npmrc?.exists && results.configInfo.npmrc?.isValid || false,
      // node版本配置是否有效
      isNodeVersionValid: results.configInfo.nodeVersion?.exists && results.configInfo.nodeVersion?.isValid || false,
      // node 版本
      nodeVersion: results.configInfo.nodeVersion?.version || '',
      // 配置信息总数
      configInfoCount: Object.keys(results.configInfo).length,
      // 配置信息有效总数
      configInfoValidCount: Object.values(results.configInfo)
        .filter(config => config.exists && config?.isValid === true).length,
      // 配置信息无效错误总数
      configInfoInvalidErrorCount: Object.values(results.configInfo)
        .filter(config => config.exists && config?.isValid === false)
        .reduce((sum, config) => sum + (config?.errors?.length || 0), 0)
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
    // 计算代码文件总大小
    const totalSize = Object.values(results.gitInfo.fileStats || {})
      .reduce((sum, stat) => sum + (stat.totalSize || 0), 0);

    qualityInfo.gitInfo = {
      commitId: results.gitInfo.commitId || '',  // 提交 id
      jsAndJsxFilesCount: jsAndJsxFilesCount,  // js 和 jsx 文件总数
      tsAndTsxFilesCount: tsAndTsxFilesCount,  // ts 和 tsx 文件总数
      totalFiles,  // 文件总数
      totalSize,   // 文件总大小
      fileNamingIssuesCount: results.gitInfo.namingIssues?.files?.length || 0,  // 文件命名问题总数
      directoryNamingIssuesCount: results.gitInfo.namingIssues?.directories?.length || 0,  // 目录命名问题总数
      maxDirectoryDepth: results.gitInfo.directoryDepth?.maxDepth || 0,  // 最大目录深度
      deepDirectoriesCount: results.gitInfo.directoryDepth?.deepDirectories?.length || 0,  // 深度目录总数
      isCommitsInvaild: results.gitInfo.invalidCommits?.length > 0,  // 提交是否有效
      isHuskyCheck: results.gitInfo.huskyCheck?.isValid || false  // husky 检查是否有效
    };
  }

  // 提取 packageInfo
  if (results.packageInfo) {
    qualityInfo.packageInfo = {
      riskPackagesCount: results.packageInfo.riskPackages?.length || 0,  // 风险包总数
      similarPackagesCount: results.packageInfo.similarPackages?.length || 0,  // 相似包总数
      updatePackagesCount: results.packageInfo.versionUpgrades?.length || 0  // 可更新包总数
    };
  }

  // 提取 dependencyInfo
  if (results.dependencyInfo) {
    qualityInfo.dependencyInfo = {
      dependencyZeroFilesCount: results.dependencyInfo.dependencyZeroFiles.length
    };
  }

  return qualityInfo;
};
