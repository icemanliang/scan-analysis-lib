/**
 * 转换依赖导入数据结构
 * @param {Object} detailedImports - 原始的详细导入信息
 * @returns {Object} 转换后的导入信息，以导出项为key
 * 
 * 示例输入:
 * {
 *   "src/index.tsx": ["render"],
 *   "src/components/App.tsx": ["render", "useState"]
 * }
 * 
 * 示例输出:
 * {
 *   "render": {
 *     count: 2,
 *     files: ["src/index.tsx", "src/components/App.tsx"]
 *   },
 *   "useState": {
 *     count: 1,
 *     files: ["src/components/App.tsx"]
 *   }
 * }
 */
exports.transformDetailedImports = (detailedImports) => {
  const result = {};

  // 遍历所有文件
  Object.entries(detailedImports).forEach(([filePath, imports]) => {
    // 确保 imports 是数组
    if (!Array.isArray(imports)) return;
    
    // 遍历文件中的所有导入项
    imports.forEach(importName => {
      // 如果这个导入项还没有记录，初始化它
      if (!result[importName]) {
        result[importName] = {
          count: 0,
          files: []
        };
      }
      
      // 更新计数和文件列表
      result[importName].count += 1;
      if (!result[importName].files.includes(filePath)) {
        result[importName].files.push(filePath);
      }
    });
  });

  return result;
}