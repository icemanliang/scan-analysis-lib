const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');

class PackageCheckPlugin {
  constructor(options = {}) {
    this.name = 'PackageCheckPlugin';
    this.options = {
      privatePackagePrefix: '@iceman',
      riskThreshold: {
        lastUpdateMonths: 6,
        monthlyDownloads: 1000
      },
      similarPackages: [
        ['moment', 'dayjs'],
        // 添加其他相似包组
      ],
      ...options
    };
  }

  async apply(scanner) {
    scanner.hooks.afterScan.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'Starting dependency check...');
        
        const packageJson = this.readPackageJson(context.root);
        const lockFile = this.findLockFile(context.root);
        const dependencies = this.analyzeDependencies(packageJson, lockFile);
        
        const privatePackages = this.identifyPrivatePackages(dependencies);
        const analysis = {
          dependencies,
          privatePackages,
          riskPackages: await this.identifyRiskPackages(dependencies, privatePackages),
          similarPackages: this.checkSimilarPackages(dependencies)
        };

        context.scanResults.packageInfo = analysis;
        context.logger.log('info', 'Dependency check completed.');
      } catch (error) {
        context.scanResults.packageInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  readPackageJson(rootDir) {
    const packageJsonPath = path.join(rootDir, 'package.json');
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  }

  findLockFile(rootDir) {
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    for (const file of lockFiles) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        return { type: path.basename(file), content: fs.readFileSync(filePath, 'utf8') };
      }
    }
    return null;
  }

  analyzeDependencies(packageJson, lockFile) {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const result = {};

    for (const [name, declaredVersion] of Object.entries(dependencies)) {
      result[name] = {
        declaredVersion,
        lockedVersion: this.getLockedVersion(name, lockFile)
      };
    }

    return result;
  }

  getLockedVersion(packageName, lockFile) {
    if (!lockFile) return null;

    switch (lockFile.type) {
      case 'package-lock.json':
        const npmLock = JSON.parse(lockFile.content);
        return npmLock.packages[`node_modules/${packageName}`]?.version;
      case 'yarn.lock':
        // 简化的 yarn.lock 解析，可能需要更复杂的逻辑
        const match = lockFile.content.match(new RegExp(`"${packageName}@[^"]+"\n  version "([^"]+)"`));
        return match ? match[1] : null;
      case 'pnpm-lock.yaml':
        const pnpmLock = yaml.load(lockFile.content);
        return pnpmLock.packages[`/${packageName}`]?.version;
      default:
        return null;
    }
  }

  identifyPrivatePackages(dependencies) {
    return Object.keys(dependencies).filter(name => 
      name.startsWith(this.options.privatePackagePrefix)
    );
  }

  async identifyRiskPackages(dependencies, privatePackages) {
    const riskPackages = [];
    for (const [name, info] of Object.entries(dependencies)) {
      if (privatePackages.includes(name)) continue;

      const npmInfo = await this.fetchNpmPackageInfo(name);
      if (!npmInfo) continue;

      const lastUpdateMonths = this.getMonthsSinceLastUpdate(npmInfo.time.modified);
      const monthlyDownloads = await this.getMonthlyDownloads(name);

      if (lastUpdateMonths > this.options.riskThreshold.lastUpdateMonths ||
          monthlyDownloads < this.options.riskThreshold.monthlyDownloads) {
        riskPackages.push({
          name,
          reason: lastUpdateMonths > this.options.riskThreshold.lastUpdateMonths ? 'outdated' : 'low-usage',
          lastUpdateMonths,
          monthlyDownloads
        });
      }
    }
    return riskPackages;
  }

  checkSimilarPackages(dependencies) {
    const installedSimilarPackages = [];
    for (const group of this.options.similarPackages) {
      const installed = group.filter(pkg => dependencies[pkg]);
      if (installed.length > 1) {
        installedSimilarPackages.push(installed);
      }
    }
    return installedSimilarPackages;
  }

  async fetchNpmPackageInfo(packageName) {
    try {
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching npm info for ${packageName}:`, error.message);
      return null;
    }
  }

  getMonthsSinceLastUpdate(lastUpdateDate) {
    const now = new Date();
    const lastUpdate = new Date(lastUpdateDate);
    const monthDiff = (now.getFullYear() - lastUpdate.getFullYear()) * 12 + 
                      (now.getMonth() - lastUpdate.getMonth());
    return monthDiff;
  }

  async getMonthlyDownloads(packageName) {
    try {
      const response = await axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
      return response.data.downloads;
    } catch (error) {
      console.error(`Error fetching download stats for ${packageName}:`, error.message);
      return 0;
    }
  }
}

module.exports = PackageCheckPlugin;
