const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const glob = require('glob');

function validateEjsTemplate(content) {
  try {
    ejs.compile(content);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = async function checkEjsTemplates(rootDir) {
  const result = { 
    templatesFound: false, 
    allValid: true, 
    invalidTemplates: [] 
  };

  const templateFiles = glob.sync('**/*.ejs', { cwd: rootDir });

  if (templateFiles.length > 0) {
    result.templatesFound = true;

    for (const file of templateFiles) {
      const filePath = path.join(rootDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const isValid = validateEjsTemplate(content);
        if (!isValid) {
          result.allValid = false;
          result.invalidTemplates.push(file);
        }
      } catch (error) {
        result.allValid = false;
        result.invalidTemplates.push({ file, error: error.message });
      }
    }
  }

  return result;
};
