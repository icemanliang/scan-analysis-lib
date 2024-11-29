const path = require('path');

/**
 * 获取问题规则
 * @param {Array} issues - 问题数组
 * @returns {Object} 问题规则
 */
const getIssueRules = issues => {
  // 使用对象来记录每种问题的数量
  const ruleStats = {};

  issues.forEach(issue => {
    const reason = issue.reason;
    if (!ruleStats[reason]) {
      ruleStats[reason] = 1;
    } else {
      ruleStats[reason]++;
    }
  });

  return Object.entries(ruleStats).map(([reason, count]) => ({
    reason,
    count
  }));
};

// 格式化 t 函数检查结果,按文件维度聚合
const formatTFunctionResults = (issues, baseDir) => {
  // 按文件路径分组
  const fileGroups = {};
  
  issues.forEach(issue => {
    const filePath = path.relative(baseDir, issue.file);
    if (!fileGroups[filePath]) {
      fileGroups[filePath] = {
        file: filePath,
        issueCount: 0,
        issues: []
      };
    }
    
    fileGroups[filePath].issueCount++;
    fileGroups[filePath].issues.push({
      reason: issue.reason,
      line: issue.line
    });
  });
  
  // 转换为数组并按问题数量排序
  return Object.values(fileGroups).sort((a, b) => b.issueCount - a.issueCount);
}

/**
 * 格式化结果
 * @param {Object} results - 结果对象
 * @param {string} baseDir - 基础目录
 * @returns {Object} 格式化后的结果
 */
exports.formatResults = (results, baseDir) => {
  const formatItem = item => ({
    ...item,
    file: path.relative(baseDir, item.file)
  });

  const formatArray = array => array.map(formatItem);

  const formatApiMap = apiMap => {
    const newMap = {};
    Object.entries(apiMap).forEach(([key, value]) => {
      newMap[key] = formatArray(value);
    });
    return newMap;
  };

  // 计算 DOM API 使用总数
  const domApiTotalCount = Object.values(results.domApis)
    .reduce((total, apis) => total + apis.length, 0);

  // 计算 BOM API 使用总数
  const bomApiTotalCount = Object.values(results.bomApis)
    .reduce((total, apis) => total + apis.length, 0);

  return {
    ...results,
    generatorFunctions: formatArray(results.generatorFunctions),
    classComponents: formatArray(results.classComponents),
    domApis: formatApiMap(results.domApis),
    bomApis: formatApiMap(results.bomApis),
    domApiTotalCount,
    bomApiTotalCount,
    functionStats: {
      ...results.functionStats,
      functionsWithMissingTypes: formatArray(results.functionStats.functionsWithMissingTypes)
    },
    tFunctionCheck: {
      total: results.tFunctionCheck.total,
      fileList: formatTFunctionResults(results.tFunctionCheck.issues, baseDir),
      issuesCount: results.tFunctionCheck.issues.length,
      noParamCalls: formatArray(results.tFunctionCheck.noParamCalls),
      runParamCalls: formatArray(results.tFunctionCheck.runParamCalls),
      noParamCallsCount: results.tFunctionCheck.noParamCalls.length,
      runParamCallsCount: results.tFunctionCheck.runParamCalls.length,
      issueRules: getIssueRules(results.tFunctionCheck.issues)
    }
  };
};