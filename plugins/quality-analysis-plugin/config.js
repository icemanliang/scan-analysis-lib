/**
 * 质量分析评分配置
 */
module.exports = {
  // 评分维度配置
  scoreDimensions: {
    eslint: {
      avgIssues: {
        maxScore: 20, // ESLint 错误评分的最高分
        errorWeight: 0.7, // error 级别问题的权重
        warningWeight: 0.3, // warning 级别问题的权重
        maxErrorsPerFile: 3, // 单文件允许的最大 error 数，超过后得0分
        maxWarningsPerFile: 3 // 单文件允许的最大 warning 数，超过后得0分
      },
      fileRatio: {
        maxScore: 5 // ESLint 检查文件覆盖率评分的最高分
      }
    },
    stylelint: {
      avgErrors: {
        maxScore: 8, // StyleLint 错误评分的最高分
        maxErrorsPerFile: 6 // 单文件允许的最大错误数，超过后得0分
      },
      fileRatio: {
        maxScore: 2 // StyleLint 检查文件覆盖率评分的最高分
      }
    },
    duplication: {
      maxLines: {
        maxScore: 5, // 代码重复行数评分的最高分
        threshold: 20, // 允许的最大重复行数阈值
        penaltyFactor: 50 // 超过阈值后的惩罚系数，越大惩罚越小
      },
      filesRatio: {
        maxScore: 3 // 重复文件占比评分的最高分
      },
      itemsRatio: {
        maxScore: 2 // 重复项占比评分的最高分
      }
    },
    directory: {
      depth: {
        maxScore: 1, // 目录深度评分的最高分
        maxDepth: 5 // 允许的最大目录深度，超过后得0分
      },
      deep: {
        maxScore: 2, // 深层目录数量评分的最高分
        maxCount: 10 // 允许的最大深层目录数量，超过后按比例扣分
      }
    },
    node: {
      version: {
        maxScore: 2, // Node.js 版本评分的最高分
        recommended: 20, // 推荐的 Node.js 版本，达到或超过得满分
        minimum: 18 // 最低可接受的 Node.js 版本，低于此版本得0分
      }
    },
    git: {
      commitMessage: {
        maxScore: 1 // Git 提交信息规范评分的最高分
      },
      huskyCheck: {
        maxScore: 1 // Husky 检查配置评分的最高分
      }
    },
    config: {
      errors: {
        maxScore: 10, // 配置错误评分的最高分
        maxErrors: 100 // 允许的最大配置错误数，超过后按比例扣分
      },
      packageManager: {
        maxScore: 1, // 包管理器选择评分的最高分
        preferredType: 'pnpm' // 推荐使用的包管理器，使用其他工具得0分
      }
    },
    codeQuality: {
      generatorFunctions: {
        maxScore: 3 // 生成器函数使用评分的最高分
      },
      classComponents: {
        maxScore: 3 // 类组件使用评分的最高分
      },
      missingTypes: {
        maxScore: 3 // 类型完整性评分的最高分
      },
      typeScriptUsage: {
        maxScore: 3 // TypeScript 使用率评分的最高分
      },
      invalidNames: {
        maxScore: 3 // 命名规范评分的最高分
      }
    },
    apis: {
      bom: {
        maxScore: 2, // BOM API 使用评分的最高分
        maxCallsPerFile: 10 // 单文件允许的最大调用次数，使用对数计算扣分
      },
      dom: {
        maxScore: 2, // DOM API 使用评分的最高分
        maxCallsPerFile: 10 // 单文件允许的最大调用次数，使用对数计算扣分
      }
    },
    packages: {
      similar: {
        maxScore: 1 // 相似依赖包评分的最高分
      },
      risk: {
        maxScore: 1 // 风险依赖包评分的最高分
      }
    }
  }
};