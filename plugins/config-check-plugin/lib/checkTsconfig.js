const fs = require('fs');
const path = require('path');

module.exports = async function checkTsconfig(rootDir, options = {}) {
  const filePath = path.join(rootDir, 'tsconfig.json');
  const result = { exists: false, isValid: false, errors: [] };

  const recommendedOptions = options.recommendedOptions || {
    "target": "esnext",
    "module": "esnext",
    "allowJs": true,
    "strict": true,
    "outDir": "./dist",
    "jsx": "react",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "lib": ["esnext", "dom", "WebWorker"]
  };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (!config.compilerOptions) {
        result.errors.push("Missing compilerOptions in tsconfig.json");
      } else {
        for (const [key, value] of Object.entries(recommendedOptions)) {
          if (!config.compilerOptions.hasOwnProperty(key)) {
            result.errors.push(`Missing recommended option: ${key}`);
          } else if (JSON.stringify(config.compilerOptions[key]) !== JSON.stringify(value)) {
            result.errors.push(`Incorrect value for ${key}. Expected: ${JSON.stringify(value)}, Got: ${JSON.stringify(config.compilerOptions[key])}`);
          }
        }
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Error parsing tsconfig.json: ${error.message}`);
    }
  } else {
    result.errors.push("tsconfig.json file does not exist");
  }

  return result;
};
