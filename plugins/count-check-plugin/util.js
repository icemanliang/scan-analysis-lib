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
      issues: formatArray(results.tFunctionCheck.issues),
      issuesCount: results.tFunctionCheck.issues.length,
      noParamCalls: formatArray(results.tFunctionCheck.noParamCalls),
      runParamCalls: formatArray(results.tFunctionCheck.runParamCalls),
      noParamCallsCount: results.tFunctionCheck.noParamCalls.length,
      runParamCallsCount: results.tFunctionCheck.runParamCalls.length,
      issueRules: getIssueRules(results.tFunctionCheck.issues)
    }
  };
};