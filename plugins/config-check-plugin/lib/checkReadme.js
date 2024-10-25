const fs = require('fs');
const path = require('path');

module.exports = function checkReadme(rootDir, options = {}) {
  const {
    readmeFile = 'README.md',
    requiredSections = [
      '业务介绍',
      '依赖环境',
      '本地调试',
      '目录结构',
      '配置文件',
      '部署方案',
      '访问地址',
      '监控接入',
      '框架工具',
      'API文档',
      '自测流程',
      '合流规范'
    ]
  } = options;

  const readmePath = path.join(rootDir, readmeFile);

  if (!fs.existsSync(readmePath)) {
    return { exists: false, missingSections: requiredSections };
  }

  const content = fs.readFileSync(readmePath, 'utf-8');
  const lines = content.split('\n');

  const foundSections = new Set();
  const regex = /^#+\s*(.*)/;

  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      const sectionTitle = match[1].trim();
      if (requiredSections.includes(sectionTitle)) {
        foundSections.add(sectionTitle);
      }
    }
  });

  const missingSections = requiredSections.filter(section => !foundSections.has(section));

  return {
    exists: true,
    missingSections,
    isValid: missingSections.length === 0
  };
};
