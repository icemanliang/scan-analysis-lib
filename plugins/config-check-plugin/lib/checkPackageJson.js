const fs = require('fs');
const path = require('path');

module.exports = async function checkPackageJson(rootDir) {
  const filePath = path.join(rootDir, 'package.json');
  const result = { exists: false, isValid: false, packageManager: null };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result.isValid = (
        packageJson.name &&
        packageJson.version &&
        packageJson.scripts &&
        packageJson.scripts.lint &&
        packageJson.scripts.build &&
        packageJson.scripts.preinstall &&
        packageJson.browserslist &&
        packageJson.packageManager &&
        packageJson['lint-staged']
      );
      result.packageManager = packageJson.packageManager;
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
