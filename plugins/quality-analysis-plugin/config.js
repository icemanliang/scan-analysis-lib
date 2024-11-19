/**
 * 质量分析评分配置
 */
module.exports = {
  // 评分维度配置
  scoreDimensions: {
    eslint: {
      // 平均错误数评分
      avgIssues: {
        maxScore: 20,
        errorWeight: 0.7,
        warningWeight: 0.3,
        maxErrorsPerFile: 3,
        maxWarningsPerFile: 5
      },
      // 文件占比评分
      fileRatio: {
        maxScore: 5
      }
    },
    stylelint: {
      // 平均错误数评分
      avgErrors: {
        maxScore: 8,
        maxErrorsPerFile: 5
      },
      // 文件占比评分
      fileRatio: {
        maxScore: 2
      }
    },
    duplication: {
      // 重复行数评分
      maxLines: {
        maxScore: 5,
        threshold: 20,
        penaltyFactor: 50
      },
      // 文件占比评分
      filesRatio: {
        maxScore: 3
      },
      // 项目占比评分
      itemsRatio: {
        maxScore: 2
      }
    },
    node: {
      // 版本评分
      version: {
        maxScore: 2,
        recommended: 20,
        minimum: 18
      }
    },
    git: {
      // 提交信息评分
      commitMessage: {
        maxScore: 1
      },
      // husky 检查评分
      huskyCheck: {
        maxScore: 1
      },
      // 目录深度评分
      directoryDepth: {
        maxScore: 1,
        maxDepth: 5
      },
      // 深层目录评分
      deepDirectories: {
        maxScore: 2,
        maxCount: 10
      }
    },
    config: {
      // 配置错误评分
      errors: {
        maxScore: 10,
        maxErrors: 100
      },
      // 包管理器评分
      packageManager: {
        maxScore: 1
      }
    },
    codeQuality: {
      // 生成器函数评分
      generatorFunctions: {
        maxScore: 3
      },
      // 类组件评分
      classComponents: {
        maxScore: 3
      },
      // 缺失类型评分
      missingTypes: {
        maxScore: 3
      },
      // 类型脚本使用评分
      typeScriptUsage: {
        maxScore: 3
      },
      // 无效命名评分
      invalidNames: {
        maxScore: 3
      }
    }
  }
};