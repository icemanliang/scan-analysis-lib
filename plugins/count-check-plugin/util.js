const path = require('path');

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

  return {
    ...results,
    generatorFunctions: formatArray(results.generatorFunctions),
    classComponents: formatArray(results.classComponents),
    domApis: formatApiMap(results.domApis),
    bomApis: formatApiMap(results.bomApis),
    functionStats: {
      ...results.functionStats,
      functionsWithMissingTypes: formatArray(results.functionStats.functionsWithMissingTypes)
    }
  };
};