const fs = require('fs');
const path = require('path');

function identifyLicense(content) {
  if (content.includes('MIT License')) {
    return 'MIT';
  } else if (content.includes('Apache License')) {
    return 'Apache';
  } else if (content.includes('GNU GENERAL PUBLIC LICENSE')) {
    return 'GPL';
  } else if (content.includes('BSD')) {
    return 'BSD';
  } else {
    return 'Unknown';
  }
}

module.exports = async function checkLicense(rootDir) {
  const filePath = path.join(rootDir, 'LICENSE');
  const result = { exists: false, isValid: false, type: null };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      result.type = identifyLicense(content);
      result.isValid = result.type !== 'Unknown';
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
