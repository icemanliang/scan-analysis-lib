const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');
const css = require('css');
const less = require('less');
const sass = require('sass');

class StyleCheckPlugin {
  constructor() {
    this.name = 'StyleCheckPlugin';
  }
  async parseLess(content) {
    return new Promise((resolve, reject) => {
      less.render(content, (error, output) => {
        if (error) return reject(error);
        resolve(css.parse(output.css));
      });
    });
  }

  async parseSass(content) {
    const result = sass.renderSync({ data: content });
    return css.parse(result.css.toString());
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('StyleCheckPlugin', (context) => {
      return new Promise(async (resolve, reject) => {
        try {
          const styleFiles = await glob(['**/*.css', '**/*.less', '**/*.scss'], { cwd: context.root });
          let totalFiles = 0, totalLines = 0, totalSize = 0;
          const nonConformantClasses = [];
          const largeFiles = [];

          for (const file of styleFiles) {
            const fullPath = path.join(context.root, file);
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            
            totalFiles += 1;
            totalLines += lines;

            const { size } = fs.statSync(fullPath);
            totalSize += size;
            if (lines > 500) {
              largeFiles.push({ file, lines });
            }

            let parsed;
            if (file.endsWith('.css')) {
              parsed = css.parse(content);
            } else if (file.endsWith('.less')) {
              parsed = await this.parseLess(content);
            } else if (file.endsWith('.scss')) {
              parsed = await this.parseSass(content);
            }

            this.checkAST(parsed, file, nonConformantClasses);
          }

          context.scanResults.styles = {
            totalFiles,
            totalLines,
            totalSize,
            nonConformantClasses,
            largeFiles
          };
          resolve();
        } catch (error) {
          context.scanResults.styles = null
          process.send({ type: 'log', level: 'error', text: `Error in plugin ${this.name}: ${error.message}` });
          resolve();
        }
      });
    });
  }

  checkAST(ast, file, nonConformantClasses) {
    const rules = ast.stylesheet.rules || [];
    for (const rule of rules) {
      if (rule.type === 'rule') {
        for (const selector of rule.selectors) {
          const classNames = selector.split('.').slice(1); // 忽略第一个字符（标签或空字符串）
          classNames.forEach(className => {
            if (!/^[a-z]+([A-Z][a-z0-9]+)*$/.test(className)) {
              const lineNumber = rule.position.start.line;
              nonConformantClasses.push({ file, className, line: lineNumber });
            }
          });
        }
      }
    }
  }
}

module.exports = StyleCheckPlugin;