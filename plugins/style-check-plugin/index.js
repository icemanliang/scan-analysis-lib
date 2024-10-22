const fs = require('fs').promises;
const path = require('path');
const glob = require('fast-glob');
const css = require('css');
const less = require('less');
const sass = require('sass');

class StyleCheckPlugin {
  constructor() {
    this.name = 'StyleCheckPlugin';
  }

  async parseLess(content, filePath) {
    try {
      const result = await less.render(content, { filename: filePath });
      return { ast: css.parse(result.css) };
    } catch (error) {
      return { error: `Error parsing LESS file: ${error.message}` };
    }
  }

  async parseSass(content, filePath) {
    try {
      const result = await sass.compileStringAsync(content, { syntax: 'scss', url: new URL(`file://${filePath}`) });
      return { ast: css.parse(result.css) };
    } catch (error) {
      return { error: `Error parsing SASS file: ${error.message}` };
    }
  }

  async parseCss(content, filePath) {
    try {
      return { ast: css.parse(content) };
    } catch (error) {
      return { error: `Error parsing CSS file: ${error.message}` };
    }
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('StyleCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting style check...');
        const styleFiles = await this.findStyleFiles(context.root);
        const nonConformantClasses = [];
        const parseErrors = [];
        const idSelectors = [];
        const deepNestings = [];

        for (const file of styleFiles) {
          const content = await fs.readFile(file, 'utf-8');
          let result;
          if (file.endsWith('.less')) {
            result = await this.parseLess(content, file);
          } else if (file.endsWith('.scss') || file.endsWith('.sass')) {
            result = await this.parseSass(content, file);
          } else {
            result = await this.parseCss(content, file);
          }

          if (result.error) {
            parseErrors.push({ file, error: result.error });
          } else if (result.ast) {
            this.checkAST(result.ast, file, nonConformantClasses, idSelectors, deepNestings);
          }
        }

        context.scanResults.style = { 
          nonConformantClasses,
          parseErrors,
          idSelectors,
          deepNestings
        };
        
        if (nonConformantClasses.length > 0) {
          context.logger.log('warn', `Found ${nonConformantClasses.length} non-conformant class names.`);
        }
        if (parseErrors.length > 0) {
          context.logger.log('warn', `Found ${parseErrors.length} files with parse errors.`);
        }
        if (idSelectors.length > 0) {
          context.logger.log('warn', `Found ${idSelectors.length} ID selectors.`);
        }
        if (deepNestings.length > 0) {
          context.logger.log('warn', `Found ${deepNestings.length} deeply nested selectors (>5 levels).`);
        }
        if (nonConformantClasses.length === 0 && parseErrors.length === 0 && idSelectors.length === 0 && deepNestings.length === 0) {
          context.logger.log('info', 'All style files passed the check.');
        }

        context.logger.log('info', 'Style check completed.');
      } catch (error) {
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
        context.scanResults.style = null;
      }
    });
  }

  async findStyleFiles(dir) {
    return await glob(['**/*.css', '**/*.less', '**/*.scss', '**/*.sass'], { 
      cwd: dir, 
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
  }

  checkAST(ast, file, nonConformantClasses, idSelectors, deepNestings) {
    if (!ast || !ast.stylesheet || !ast.stylesheet.rules) {
      return;
    }
    
    const rules = ast.stylesheet.rules;
    this.checkRules(rules, file, nonConformantClasses, idSelectors, deepNestings);
  }

  checkRules(rules, file, nonConformantClasses, idSelectors, deepNestings, nestingLevel = 0) {
    for (const rule of rules) {
      if (rule.type === 'rule' && rule.selectors) {
        this.checkSelectors(rule.selectors, file, rule.position, nonConformantClasses, idSelectors);
        
        if (nestingLevel > 4) {  // 5层嵌套，从0开始计数
          deepNestings.push({
            file,
            selector: rule.selectors.join(', '),
            line: rule.position ? rule.position.start.line : 'Unknown'
          });
        }
      }
      
      if (rule.rules) {
        this.checkRules(rule.rules, file, nonConformantClasses, idSelectors, deepNestings, nestingLevel + 1);
      }
    }
  }

  checkSelectors(selectors, file, position, nonConformantClasses, idSelectors) {
    for (const selector of selectors) {
      // 检查ID选择器
      if (selector.includes('#')) {
        idSelectors.push({
          file,
          selector,
          line: position ? position.start.line : 'Unknown'
        });
      }

      // 检查类名
      const classNames = selector.match(/\.[a-zA-Z0-9_-]+/g) || [];
      classNames.forEach(className => {
        const cleanClassName = className.slice(1); // 移除开头的点
        if (!/^[a-z]+([A-Z][a-z0-9]+)*$/.test(cleanClassName)) {
          const lineNumber = position ? position.start.line : 'Unknown';
          nonConformantClasses.push({ file, className: cleanClassName, line: lineNumber });
        }
      });
    }
  }
}

module.exports = StyleCheckPlugin;
