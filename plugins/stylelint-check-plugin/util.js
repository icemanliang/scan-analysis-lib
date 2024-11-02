const path = require('path');

/**
 * 格式化 stylelint 检查结果
 * @param {Array} results - stylelint 原始结果
 * @param {string} baseDir - 基础目录路径
 * @returns {Object} 格式化后的结果
 */
exports.formatResults = (results, baseDir) => {
  const fileList = [];
  let errorCount = 0;

  results.forEach(result => {
    // 跳过没有问题的文件
    if (!result.warnings || result.warnings.length === 0) return;

    const messages = result.warnings.map(warning => {
      errorCount++;
      return {
        rule: warning.rule,
        message: warning.text.replace(/\s*\([^)]*\)/g, ''), // 移除消息中的规则引用
        line: warning.line
      };
    });

    fileList.push({
      file: path.relative(baseDir, result.source),
      errorCount: messages.length,
      messages
    });
  });

  // 按错误数量降序排序
  fileList.sort((a, b) => b.errorCount - a.errorCount);

  return {
    errorCount,
    fileList
  };
};

/**
 * 分析 stylelint 结果，按规则分组并统计
 * @param {Array} results - stylelint 原始结果
 * @returns {Object} 分析结果
 */
exports.analyzeResults = (results) => {
  // 初始化规则统计对象
  const rules = {};

  // 遍历结果，按规则分组统计
  results.forEach(result => {
    if (!result.warnings || result.warnings.length === 0) return;

    result.warnings.forEach(warning => {
      if (!warning.rule) return;

      if (!rules[warning.rule]) {
        rules[warning.rule] = {
          count: 0,
          locations: []
        };
      }

      rules[warning.rule].count++;
      rules[warning.rule].locations.push({
        file: result.source,
        line: warning.line,
        message: warning.text.replace(/\s*\([^)]*\)/g, '') // 移除消息中的规则引用
      });
    });
  });

  // 转换规则对象为排序数组
  const ruleList = Object.entries(rules)
    .map(([ruleId, data]) => ({
      ruleId,
      ...data
    }))
    .sort((a, b) => b.count - a.count);

  return {
    errorRuleCount: ruleList.length,
    ruleList
  };
}; 