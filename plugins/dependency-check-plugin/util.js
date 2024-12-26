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

/**
 * 合并外部依赖对象
 * @param {Object} obj1 - 第一个外部依赖对象
 * @param {Object} obj2 - 第二个外部依赖对象
 * @returns {Object} 合并后的外部依赖对象
 */
exports.combineExternalDependencies = (obj1, obj2) => {
  const result = { ...obj1 };

  Object.entries(obj2).forEach(([packageName, packageInfo]) => {
    if (!result[packageName]) {
      // 如果包名不存在，直接添加
      result[packageName] = packageInfo;
    } else {
      // 如果包名存在，需要合并信息
      // 合并 count
      result[packageName].count += packageInfo.count;
      
      // 合并 dependents 数组
      result[packageName].dependents = [
        ...new Set([...result[packageName].dependents, ...packageInfo.dependents])
      ];
      
      // 合并 detailedImports
      if (!result[packageName].detailedImports) {
        result[packageName].detailedImports = {};
      }
      
      Object.entries(packageInfo.detailedImports).forEach(([importName, importInfo]) => {
        if (!result[packageName].detailedImports[importName]) {
          // 如果导入项不存在，直接添加
          result[packageName].detailedImports[importName] = importInfo;
        } else {
          // 如果导入项存在，合并信息
          result[packageName].detailedImports[importName].count += importInfo.count;
          result[packageName].detailedImports[importName].files = [
            ...new Set([
              ...result[packageName].detailedImports[importName].files,
              ...importInfo.files
            ])
          ];
        }
      });
    }
  });

  return result;
};