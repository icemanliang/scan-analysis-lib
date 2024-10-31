const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');

class PackageCheckPlugin {
  constructor(options = {}) {
    this.name = 'PackageCheckPlugin';
    this.options = {
      privatePackagePrefix: '@shein',
      riskThreshold: {
        lastUpdateMonths: 12,
        monthlyDownloads: 1000
      },
      licenses: {
        safe: [
          'MIT', 
          'ISC', 
          'BSD-2-Clause',
          'BSD-3-Clause', 
          'Apache-2.0',
          'CC0-1.0',
          '0BSD'
        ],
        risky: [
          'GPL-2.0',
          'GPL-3.0',
          'AGPL-3.0',
          'LGPL-2.1',
          'LGPL-3.0',
          'MPL-2.0',
          'CPAL-1.0',
          'EPL-1.0',
          'EPL-2.0'
        ]
      },
      similarPackages: [
        // 日期处理
        ['moment', 'dayjs', 'date-fns'],
        // HTTP 请求
        ['axios', 'request', 'node-fetch'],
        // 工具库
        ['lodash', 'underscore'],   
        // 状态管理
        ['redux', 'mobx', 'vuex'],
        // 测试框架
        ['jest', 'mocha', 'vitest'],
        // E2E 测试
        ['cypress', 'playwright', 'puppeteer', 'selenium-webdriver'],
        // 打包工具
        ['webpack', 'rollup', 'parcel', 'esbuild', 'vite'],
        // 进程管理
        ['pm2', 'forever', 'nodemon', 'supervisor'],
        // 命令行工具
        ['commander', 'yargs', 'meow', 'minimist'],
        // 日志工具
        ['winston', 'bunyan', 'pino', 'log4js'],
      ],
      versionUpgrades: {
        // 构建工具
        webpack: {
          minVersion: '5.0.0',
          message: '建议升级到 webpack 5 以获得更好的构建性能和模块联邦特性'
        },
        vite: {
          minVersion: '4.0.0',
          message: '建议升级到 vite 4+ 以获得更好的性能和稳定性'
        },
        // 框架相关
        react: {
          minVersion: '16.8.2',
          message: '建议升级到支持 Hooks 的 React 版本'
        },
        'react-dom': {
          minVersion: '16.8.2',
          message: '建议与 React 版本保持一致，升级到支持 Hooks 的版本'
        },
        vue: {
          minVersion: '3.0.0',
          message: '建议升级到 Vue 3 以使用组合式 API 和更好的 TypeScript 支持'
        },
        // 工具链
        '@babel/core': {
          minVersion: '7.0.0',
          message: '建议升级到 Babel 7 以获得更好的性能和特性支持'
        },
        husky: {
          minVersion: '8.0.0',
          message: '建议升级到 husky v8+ 以使用新的配置方式和更好的 Git Hooks 支持'
        },
        typescript: {
          minVersion: '4.5.0',
          message: '建议升级到 TypeScript 4.5+ 以获得更好的类型推导和语言特性'
        },
        eslint: {
          minVersion: '8.0.0',
          message: '建议升级到 ESLint 8 以获得更好的性能和规则支持'
        },
        prettier: {
          minVersion: '2.0.0',
          message: '建议升级到 Prettier 2+ 以获得更好的格式化支持'
        }
      },
      ...options
    };
  }

  async apply(scanner) {
    scanner.hooks.dependency.tapPromise(this.name, async (context) => {
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
          similarPackages: this.checkSimilarPackages(dependencies),
          versionUpgrades: this.checkVersionUpgrades(dependencies) // 新增版本升级检查
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
      console.error(`Error reading lock file for ${packageName}:`, error.message);
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

      const lastModifiedMonths = this.getMonthsSinceLastUpdate(npmInfo.time.modified);
      const latestVersion = npmInfo['dist-tags']?.latest;
      const lastPublishMonths = this.getMonthsSinceLastUpdate(npmInfo.time[latestVersion]);
      const monthlyDownloads = await this.getMonthlyDownloads(name);
      const license = npmInfo.license;

      const hasLicenseRisk = !license || 
                            this.options.licenses.risky.includes(license) || 
                            !this.options.licenses.safe.includes(license);

      if (lastModifiedMonths > this.options.riskThreshold.lastUpdateMonths ||
          lastPublishMonths > this.options.riskThreshold.lastUpdateMonths ||
          monthlyDownloads < this.options.riskThreshold.monthlyDownloads ||
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

  getRiskReason(lastModifiedMonths, lastPublishMonths, monthlyDownloads, license) {
    const reasons = [];
    if (lastModifiedMonths > this.options.riskThreshold.lastUpdateMonths) {
      reasons.push('long-time-no-modification');
    }
    if (lastPublishMonths > this.options.riskThreshold.lastUpdateMonths) {
      reasons.push('long-time-no-publish');
    }
    if (monthlyDownloads < this.options.riskThreshold.monthlyDownloads) {
      reasons.push('low-usage');
    }
    if (!license) {
      reasons.push('missing-license');
    } else if (this.options.licenses.risky.includes(license)) {
      reasons.push('risky-license');
    } else if (!this.options.licenses.safe.includes(license)) {
      reasons.push('unknown-license');
    }
    return reasons.join(', ');
  }

  getLicenseRiskLevel(license) {
    if (!license) return 'high';
    if (this.options.licenses.risky.includes(license)) return 'medium';
    if (!this.options.licenses.safe.includes(license)) return 'unknown';
    return 'safe';
  }

  checkVersionUpgrades(dependencies) {
    // console.log('=========>',dependencies);
    const upgrades = [];
    for (const [name, version] of Object.entries(dependencies)) {
      const upgrade = this.options.versionUpgrades[name];
      if (upgrade) {
        try {
          console.log('=========>',name,version);
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
