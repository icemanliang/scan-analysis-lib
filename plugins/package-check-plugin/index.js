const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const defaultConfig = require('./config');
class PackageCheckPlugin {
  constructor(config = {}) {
    this.name = 'PackageCheckPlugin';
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  async apply(scanner) {
    scanner.hooks.dependency.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'starting package check...');
        
        const packageJson = this.readPackageJson(context.baseDir);
        const lockFile = this.findLockFile(context.baseDir);
        const dependencies = this.analyzeDependencies(packageJson, lockFile);
        
        const privatePackages = this.identifyPrivatePackages(dependencies);
        const analysis = {
          dependencies,
          privatePackages,
          riskPackages: await this.identifyRiskPackages(dependencies, privatePackages),
          similarPackages: this.checkSimilarPackages(dependencies),
          versionUpgrades: this.checkVersionUpgrades(dependencies) // 新增版本升级检查
        };

        context.scanResults.packageInfo = analysis;
        context.logger.log('info', 'package check completed.');
      } catch (error) {
        context.scanResults.packageInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.message}`);
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
    try {
      const { type, content } = lockFile;
      
      switch (type) {
        case 'package-lock.json': {
          const lockFileContent = JSON.parse(content);
          // package-lock.json v2 格式
          if (lockFileContent.packages) {
            return lockFileContent.packages?.[`node_modules/${packageName}`]?.version;
          }
          // package-lock.json v1 格式
          return lockFileContent.dependencies?.[packageName]?.version;
        }
        
        case 'pnpm-lock.yaml': {
          const lockFileContent = yaml.load(content);
          // pnpm-lock.yaml v6 格式
          if (lockFileContent.packages) {
            for (const [pkgPath, pkgInfo] of Object.entries(lockFileContent.packages)) {
              if (pkgPath.includes(`/${packageName}/`)) {
                return pkgInfo.version;
              }
            }
          }
          // 旧版格式
          return lockFileContent.dependencies?.[packageName]?.version;
        }
        
        case 'yarn.lock': {
          const lines = content.split('\n');
          const packageLine = lines.findIndex(line => line.includes(`"${packageName}@`));
          if (packageLine !== -1) {
            const versionLine = lines.slice(packageLine).find(line => line.trim().startsWith('version'));
            if (versionLine) {
              return versionLine.split('"')[1];
            }
          }
          return null;
        }
        
        default:
          return null;
      }
    } catch (error) {
      console.error(`error reading lock file for ${packageName}:`, error.message);
      return null;
    }
  }

  identifyPrivatePackages(dependencies) {
    return Object.keys(dependencies).filter(name => 
      name.startsWith(this.config.privatePackagePrefix)
    );
  }

  async identifyRiskPackages(dependencies, privatePackages) {
    const riskPackages = [];
    for (const [name, info] of Object.entries(dependencies)) {
      if (privatePackages.includes(name)) continue;

      const npmInfo = await this.fetchNpmPackageInfo(name);
      if (!npmInfo) continue;

      const lastModifiedMonths = this.getMonthsSinceLastUpdate(npmInfo.time.modified);
      const latestVersion = npmInfo['dist-tags']?.latest;
      const lastPublishMonths = this.getMonthsSinceLastUpdate(npmInfo.time[latestVersion]);
      const monthlyDownloads = await this.getMonthlyDownloads(name);
      const license = npmInfo.license;

      const hasLicenseRisk = !license || 
                            this.config.licenses.risky.includes(license) || 
                            !this.config.licenses.safe.includes(license);

      if (lastModifiedMonths > this.config.riskThreshold.lastUpdateMonths ||
          lastPublishMonths > this.config.riskThreshold.lastUpdateMonths ||
          monthlyDownloads < this.config.riskThreshold.monthlyDownloads ||
          hasLicenseRisk) {
        riskPackages.push({
          name,
          reason: this.getRiskReason(lastModifiedMonths, lastPublishMonths, monthlyDownloads, license),
          lastModifiedMonths,
          lastPublishMonths,
          monthlyDownloads,
          latestVersion,
          license,
          licenseRisk: hasLicenseRisk ? this.getLicenseRiskLevel(license) : 'safe'
        });
      }
    }
    return riskPackages;
  }

  checkSimilarPackages(dependencies) {
    const installedSimilarPackages = [];
    for (const group of this.config.similarPackages) {
      const installed = group.filter(pkg => dependencies[pkg]);
      if (installed.length > 1) {
        installedSimilarPackages.push(installed);
      }
    }
    return installedSimilarPackages;
  }

  async fetchNpmPackageInfo(packageName) {
    try {
      const response = await axios.get(`${this.config.packageInfoApi}${packageName}`);
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
      const response = await axios.get(`${this.config.downloadInfoApi}${packageName}`);
      return response.data.downloads;
    } catch (error) {
      console.error(`Error fetching download stats for ${packageName}:`, error.message);
      return 0;
    }
  }

  getRiskReason(lastModifiedMonths, lastPublishMonths, monthlyDownloads, license) {
    const reasons = [];

    if (lastModifiedMonths > 12) {
      reasons.push(`超过 ${lastModifiedMonths} 个月未更新代码`);
    }

    if (lastPublishMonths > 12) {
      reasons.push(`超过 ${lastPublishMonths} 个月未发布新版本`);
    }

    if (monthlyDownloads < 1000) {
      reasons.push(`月下载量较低(${monthlyDownloads})`);
    }

    if (!license) {
      reasons.push('未声明开源协议');
    } else if (!['MIT', 'ISC', 'Apache-2.0', 'BSD-3-Clause'].includes(license)) {
      reasons.push(`使用了非主流开源协议(${license})`);
    }

    return reasons;
  }

  getLicenseRiskLevel(license) {
    if (!license) return 'high';
    if (this.config.licenses.risky.includes(license)) return 'medium';
    if (!this.config.licenses.safe.includes(license)) return 'unknown';
    return 'safe';
  }

  checkVersionUpgrades(dependencies) {
    // console.log('=========>',dependencies);
    const upgrades = [];
    for (const [name, version] of Object.entries(dependencies)) {
      const upgrade = this.config.versionUpgrades[name];
      if (upgrade) {
        try {
          // console.log('=========>',name,version);
          // 获取当前版本的主版本号
          const currentMajor = this.getMajorVersion(version);
          const recommendedMajor = this.getMajorVersion(upgrade.minVersion);
          
          if (currentMajor < recommendedMajor) {
            upgrades.push({
              name,
              currentVersion: `v${currentMajor}`,
              recommendedVersion: `v${recommendedMajor}`,
              message: upgrade.message
            });
          }
        } catch (error) {
          console.warn(`Skipping version check for ${name}: ${error.message}`);
        }
      }
    }
    return upgrades;
  }

  getMajorVersion(version) {
    // 处理字符串版本号
    if (typeof version === 'string') {
      const match = version.match(/^[~^]?(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    // 处理对象类型版本号
    if (typeof version === 'object' && version !== null) {
      const versionStr = version.declaredVersion || version.lockedVersion || '';
      const match = versionStr.match(/^[~^]?(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    throw new Error('Invalid version format');
  }
}

module.exports = PackageCheckPlugin;
