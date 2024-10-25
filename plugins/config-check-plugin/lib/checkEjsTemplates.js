const fs = require('fs');
const path = require('path');
const fastGlob = require('fast-glob');

function validateEjsTemplate(content, options) {
  const result = { isValid: true, errors: [] };

  // 检查 <!DOCTYPE html>
  if (!content.includes('<!DOCTYPE html>')) {
    result.isValid = false;
    result.errors.push('缺少 <!DOCTYPE html> 声明');
  }

  // 检查 <meta charset="UTF-8">
  if (!content.includes('<meta charset="UTF-8">')) {
    result.isValid = false;
    result.errors.push('缺少 <meta charset="UTF-8"> 标签');
  }

  // 检查 dns-prefetch 或 preconnect
  if (!content.includes('dns-prefetch') && !content.includes('preconnect')) {
    result.isValid = false;
    result.errors.push('缺少 dns-prefetch 或 preconnect 声明');
  }

  // 检查 title 标签内容
  if (!/<title>.*?<\/title>/.test(content)) {
    result.isValid = false;
    result.errors.push('title 标签缺少内容');
  }

  // 检查 CSP 内容安全策略
  if (!content.includes('content-security-policy')) {
    result.isValid = false;
    result.errors.push('缺少 CSP 内容安全策略');
  }

  // 检查 SEO 优化 meta 标签
  if (!content.includes('name="description"') || !content.includes('name="keywords"')) {
    result.isValid = false;
    result.errors.push('缺少 SEO 优化 meta 标签');
  }

  // 检查前端监控 JS SDK
  if (options.monitoringSDK && !content.includes(options.monitoringSDK)) {
    result.isValid = false;
    result.errors.push('缺少前端监控 JS SDK');
  }

  // 检查 CSS 全局统一覆盖样式
  if (options.globalCSS && !content.includes(options.globalCSS)) {
    result.isValid = false;
    result.errors.push('缺少 CSS 全局统一覆盖样式');
  }

  // 检查移动端 viewport 设置
  if (options.isMobile) {
    const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">';
    if (!content.includes(viewportMeta)) {
      result.isValid = false;
      result.errors.push('缺少移动端 viewport 设置');
    }
  }

  // 检查 html 标签的 lang 属性
  if (!/<html.*lang=/.test(content)) {
    result.isValid = false;
    result.errors.push('html 标签缺少 lang 属性');
  }

  // 检查 favicon
  if (!/<link.*rel="icon"/.test(content)) {
    result.isValid = false;
    result.errors.push('缺少 favicon 链接');
  }

  return result;
}

module.exports = async function checkEjsTemplates(rootDir, options = {}) {
  const result = { 
    templatesFound: false, 
    allValid: true, 
    invalidTemplates: [] 
  };

  const templateFiles = await fastGlob('*.ejs', { cwd: rootDir });

  if (templateFiles.length > 0) {
    result.templatesFound = true;

    for (const file of templateFiles) {
      const filePath = path.join(rootDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const validationResult = validateEjsTemplate(content, options);
        if (!validationResult.isValid) {
          result.allValid = false;
          result.invalidTemplates.push({
            file,
            errors: validationResult.errors
          });
        }
      } catch (error) {
        result.allValid = false;
        result.invalidTemplates.push({ file, error: error.message });
      }
    }
  }

  return result;
};
