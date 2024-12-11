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
      const beforeComments = sourceCode.getCommentsBefore(node);
      const lineComments = sourceCode.getCommentsInside(node);
      return beforeComments.length > 0 || lineComments.length > 0;
    }

    function isObjectPropertyFunction(node) {
      return node.parent.type === 'Property' && 
             (node.parent.key.name === 'render' || 
              node.parent.key.name === 'onChange' ||
              node.parent.key.name === 'onClick' ||
              node.parent.key.name === 'onSubmit' ||
              node.parent.key.name === 'onFinish' ||
              node.parent.key.name === 'formatter');
    }

    return {
      // 处理 export function 的情况
      ExportNamedDeclaration(node) {
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            const hasComment = checkComments(node) || checkComments(node.declaration);
            if (!hasComment) {
              context.report({
                node: node.declaration,
                message: '函数必须包含注释说明'
              });
            }
          } else if (node.declaration.type === 'VariableDeclaration') {
            // 处理导出的箭头函数
            const declarator = node.declaration.declarations[0];
            if (declarator && declarator.init && 
               (declarator.init.type === 'ArrowFunctionExpression' || 
                declarator.init.type === 'FunctionExpression')) {
              const hasComment = checkComments(node) || checkComments(node.declaration);
              if (!hasComment) {
                context.report({
                  node: declarator.init,
                  message: '函数必须包含注释说明'
                });
              }
            }
          }
        }
      },
      
      // 处理普通函数声明
      FunctionDeclaration(node) {
        if (node.parent.type !== 'ExportNamedDeclaration') {
          const hasComment = checkComments(node);
          if (!hasComment) {
            context.report({
              node,
              message: '函数必须包含注释说明'
            });
          }
        }
      },

      // 处理类方法
      MethodDefinition(node) {
        // 跳过 React 生命周期方法和常见事件处理方法
        if (['constructor', 'render', 'componentDidMount', 'componentDidUpdate', 
             'componentWillUnmount', 'shouldComponentUpdate', 'getSnapshotBeforeUpdate',
             'onChange', 'onClick', 'onSubmit', 'onFinish'].includes(node.key.name)) {
          return;
        }

        const hasComment = checkComments(node);
        if (!hasComment) {
          context.report({
            node,
            message: '类方法必须包含注释说明'
          });
        }
      },

      // 处理函数表达式
      FunctionExpression(node) {
        // 跳过对象属性中的函数
        if (isObjectPropertyFunction(node)) {
          return;
        }

        // 检查是否为变量声明的函数表达式
        const isVariableDeclaration = node.parent.type === 'VariableDeclarator';
        
        if (isVariableDeclaration) {
          const hasComment = checkComments(node) || checkComments(node.parent.parent);
          if (!hasComment) {
            context.report({
              node,
              message: '函数必须包含注释说明'
            });
          }
        }
      },

      // 处理箭头函数
      ArrowFunctionExpression(node) {
        // 跳过导出的箭头函数，因为已经在 ExportNamedDeclaration 中处理
        if (node.parent.type === 'VariableDeclarator' && 
            node.parent.parent.type === 'VariableDeclaration' &&
            node.parent.parent.parent.type === 'ExportNamedDeclaration') {
          return;
        }

        // 跳过对象属性中的函数
        if (isObjectPropertyFunction(node)) {
          return;
        }

        // 检查是否为变量声明的箭头函数
        const isVariableDeclaration = node.parent.type === 'VariableDeclarator';
        
        if (isVariableDeclaration) {
          const hasComment = checkComments(node) || checkComments(node.parent.parent);
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