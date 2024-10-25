const fs = require('fs');
const path = require('path');

module.exports = async function checkIgnoreFiles(rootDir) {
  const ignoreFiles = [
    '.gitignore',
    '.npmignore',
    '.eslintignore',
    '.stylelintignore',
    '.prettierignore'
  ];

  const results = {};

  for (const file of ignoreFiles) {
    const filePath = path.join(rootDir, file);
    const result = { exists: false, isValid: false, errors: [] };

    if (fs.existsSync(filePath)) {
      result.exists = true;
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').map(line => line.trim());

        // 检查是否有内容
        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
          result.errors.push(`${file} 是空的`);
        }

        // 特定文件的检查逻辑
        switch (file) {
          case '.gitignore':
            checkGitignore(lines, result);
            break;
          case '.eslintignore':
            checkEslintignore(lines, result);
            break;
          case '.prettierignore':
            checkPrettierignore(lines, result);
            break;
          case '.stylelintignore':
            checkStylelintignore(lines, result);
            break;
          case '.npmignore':
            checkNpmignore(lines, result);
            break;
        }

        result.isValid = result.errors.length === 0;
      } catch (error) {
        result.errors.push(error.message);
      }
    } else {
      result.errors.push(`${file} 文件不存在`);
    }

    results[file] = result;
  }

  return results;
};

function checkGitignore(lines, result) {
  const commonIgnores = [
    'logs',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'lerna-debug.log*',
    '.pnpm-debug.log*',
    '.yarn/cache',
    '.yarn/unplugged',
    '.yarn/build-state.yml',
    '.yarn/install-state.gz',
    '.pnp.*',
    '.temp*',
    '.cache*',
    'node_modules',
    'dist/',
    '.DS_Store'
  ];
  commonIgnores.forEach(ignore => {
    if (!lines.some(line => line.startsWith(ignore) || line === ignore)) {
      result.errors.push(`缺少常见的忽略项: ${ignore}`);
    }
  });
}

function checkEslintignore(lines, result) {
  const requiredIgnores = ['src/**/*.d.ts', 'src/**/*.css'];
  requiredIgnores.forEach(ignore => {
    if (!lines.includes(ignore)) {
      result.errors.push(`缺少必要的忽略项: ${ignore}`);
    }
  });
}

function checkPrettierignore(lines, result) {
  const commonIgnores = [
    '**/*.md',
    '**/*.svg',
    '**/*.ejs',
    '**/*.html',
    'package.json',
    'node_modules',
    'dist',
    'build',
    '.DS_Store',
    '*.log'
  ];
  commonIgnores.forEach(ignore => {
    if (!lines.some(line => line.startsWith(ignore) || line === ignore)) {
      result.errors.push(`建议添加常见的忽略项: ${ignore}`);
    }
  });
}

function checkStylelintignore(lines, result) {
  const commonIgnores = [
    '*.ts',
    '*.tsx',
    '*.ejs',
    '*.html',
    'node_modules',
    'dist',
    'build'
  ];
  commonIgnores.forEach(ignore => {
    if (!lines.some(line => line.startsWith(ignore) || line === ignore)) {
      result.errors.push(`建议添加常见的忽略项: ${ignore}`);
    }
  });
}

function checkNpmignore(lines, result) {
  const recommendedIgnores = ['node_modules', 'site', '.DS_Store'];
  recommendedIgnores.forEach(ignore => {
    if (!lines.some(line => line.startsWith(ignore) || line === ignore)) {
      result.errors.push(`建议添加推荐的忽略项: ${ignore}`);
    }
  });
}
