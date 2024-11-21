module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '要求函数必须有任意格式的注释'
    }
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    function checkComments(node) {
      // 获取当前节点的所有前置注释
      const beforeComments = sourceCode.getCommentsBefore(node);
      // 获取当前行的注释
      const lineComments = sourceCode.getCommentsInside(node);
      
      return beforeComments.length > 0 || lineComments.length > 0;
    }

    return {
      // 处理 export function 的情况
      ExportNamedDeclaration(node) {
        if (node.declaration && node.declaration.type === 'FunctionDeclaration') {
          const hasComment = checkComments(node) || checkComments(node.declaration);
          
          if (!hasComment) {
            context.report({
              node: node.declaration,
              message: '函数必须包含注释说明'
            });
          }
        }
      },
      
      // 处理普通函数声明
      FunctionDeclaration(node) {
        // 如果父节点不是 ExportNamedDeclaration，才检查
        if (node.parent.type !== 'ExportNamedDeclaration') {
          const hasComment = checkComments(node);
          
          if (!hasComment) {
            context.report({
              node,
              message: '函数必须包含注释说明'
            });
          }
        }
      }
    };
  }
}; 