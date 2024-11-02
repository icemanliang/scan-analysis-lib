const path = require('path');

/**
 * 简化并排序 ESLint 结果
 * @param {Array} results - ESLint 原始结果
 * @param {string} baseDir - 基础目录路径
 * @returns {Array} 简化并排序后的结果
 */
exports.minifyResults = (results, baseDir) => {
  return results
    .map(result => {
      const filePath = path.relative(baseDir, result.filePath);
      const messages = result.messages.map(msg => ({
        ruleId: msg.ruleId,
        severity: msg.severity,
        message: msg.message,
        line: msg.line
      }));

      return {
        filePath,
        messages,
        errorCount: result.errorCount,
        warningCount: result.warningCount
      };
    })
    .sort((a, b) => b.errorCount - a.errorCount);
};

/**
 * 分析 ESLint 结果，按规则分组并统计
 * @param {Array} minResults - 简化后的 ESLint 结果
 * @returns {Object} 分析结果
 */
exports.analyzeResults = (minResults) => {
  // 初始化规则统计对象
  const errorRules = {};
  const warningRules = {};

  // 遍历结果，按规则分组统计
  minResults.forEach(result => {
    result.messages.forEach(msg => {
      if (!msg.ruleId) return;

      const rules = msg.severity === 2 ? errorRules : warningRules;
      
      if (!rules[msg.ruleId]) {
        rules[msg.ruleId] = {
          count: 0,
          locations: []
        };
      }

      rules[msg.ruleId].count++;
      rules[msg.ruleId].locations.push({
        file: result.filePath,
        line: msg.line,
        message: msg.message
      });
    });
  });

  // 转换规则对象为排序数组
  const sortRules = rules => 
    Object.entries(rules)
      .map(([ruleId, data]) => ({
        ruleId,
        ...data
      }))
      .sort((a, b) => b.count - a.count);

  // 生成排序后的规则列表
  const errorRuleList = sortRules(errorRules);
  const warningRuleList = sortRules(warningRules);

  // 返回简化的分析结果
  return {
    errorRuleCount: errorRuleList.length,
    warningRuleCount: warningRuleList.length,
    errorRuleList,
    warningRuleList
  };
};
