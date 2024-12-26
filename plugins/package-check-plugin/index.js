const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const defaultConfig = require('./config');
const moment = require('moment');


class PackageCheckPlugin {
  constructor(config = {}) {
    this.name = 'PackageCheckPlugin';       // 插件名称
    this.devMode = false;                   // 是否开启调试模式
    this.config = {                         // 插件配置
      ...defaultConfig,
      ...config
    };
  }

  // 开发模式调试日志
  devLog(title, message) {
    if(this.devMode) {
      console.debug(moment().format('YYYY-MM-DD HH:mm:ss'), 'debug', `[${this.name}]`, title, message);
    }
  }

  // 注册插件
  async apply(scanner) {
    scanner.hooks.dependency.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      try {
        context.logger.log('info', 'start package check...');
        const startTime = Date.now();
        let analysis = {};

        if(context.subDirs && context.subDirs.length > 0){
          // 子目录多包情况，继续扫描
          for(const dir of context.subDirs){
            const subDirPath = context.baseDir + '/' + context.codeDir + '/' + dir;
            const packageJson = this.readPackageJson(subDirPath);
            const lockFile = this.findLockFile(context.baseDir);
            const dependencies = this.analyzeDependencies(packageJson, lockFile, dir);
            
            const privatePackages = this.identifyPrivatePackages(dependencies);

            // 合并结果
            const simpleAnalysis = {
              dependencies,
              privatePackages,
              riskPackages: await this.identifyRiskPackages(dependencies, privatePackages),
              similarPackages: this.checkSimilarPackages(dependencies),
              versionUpgrades: this.checkVersionUpgrades(dependencies) // 新增版本升级检查
            };
            // console.log('simpleAnalysis ===>', JSON.stringify(simpleAnalysis, null, 2));
            analysis = {
              ...analysis,
              ...simpleAnalysis
            };
          }
        }else{
          // 单包情况，直接扫描
          const packageJson = this.readPackageJson(context.baseDir);
          const lockFile = this.findLockFile(context.baseDir);
          const dependencies = this.analyzeDependencies(packageJson, lockFile, '');
          
          const privatePackages = this.identifyPrivatePackages(dependencies);
          analysis = {
            dependencies,
            privatePackages,
            riskPackages: await this.identifyRiskPackages(dependencies, privatePackages),
            similarPackages: this.checkSimilarPackages(dependencies),
            versionUpgrades: this.checkVersionUpgrades(dependencies) // 新增版本升级检查
          };
        }

        context.scanResults.packageInfo = analysis;
        context.logger.log('info', `package check completed, time: ${Date.now() - startTime} ms`);
      } catch (error) {
        context.scanResults.packageInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }

  // 读取 package.json 文件
  readPackageJson(rootDir) {
    const packageJsonPath = path.join(rootDir, 'package.json');
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  }

  // 查找 lock 文件
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

  // 分析依赖
  analyzeDependencies(packageJson, lockFile, subDir='') {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const result = {};

    for (const [name, declaredVersion] of Object.entries(dependencies)) {
      result[name] = {
        declaredVersion,
        lockedVersion: this.getLockedVersion(name, lockFile, subDir)
      };
    }

    this.devLog('analyzeDependencies', result);
    return result;
  }

  // 获取锁文件中的版本
  getLockedVersion(packageName, lockFile, subDir='') {
    try {
      if (!lockFile) return null;
      
      const { type, content } = lockFile;
      let version = null;
      
      switch (type) {
        case 'package-lock.json': {
          const lockFileContent = JSON.parse(content);
          // package-lock.json v2 格式
          if (lockFileContent.packages) {
            version = lockFileContent.packages?.[`node_modules/${packageName}`]?.version;
          }
          // package-lock.json v1 格式
          if (!version) {
            version = lockFileContent.dependencies?.[packageName]?.version;
          }
          break;
        }
        
        case 'pnpm-lock.yaml': {
          const lockFileContent = yaml.load(content);
          // console.log('lockFileContent =========>', Object.keys(lockFileContent.importers));

          // pnpm-lock.yaml v6 格式
          if (lockFileContent.importers) {
            if(subDir){
              for (const [pkgPath, pkgInfo] of Object.entries(lockFileContent.importers['packages/' + subDir].dependencies)) {
                // console.log('pkgPath =========>', packageName);
                if (pkgPath.includes(packageName)) {
                  version = pkgInfo.version;
                  break;
                }
              }
            }else{
              for (const [pkgPath, pkgInfo] of Object.entries(lockFileContent.importers.dependencies)) {
                if (pkgPath.includes(packageName)) {
                  version = pkgInfo.version;
                  break;
                }
              }
            }
          }
          // 旧版格式
          if (!version) {
            version = lockFileContent.dependencies?.[packageName]?.version;
          }
          break;
        }
        
        case 'yarn.lock': {
          const lines = content.split('\n');
          const packageLine = lines.findIndex(line => line.includes(`"${packageName}@`));
          if (packageLine !== -1) {
            const versionLine = lines.slice(packageLine).find(line => line.trim().startsWith('version'));
            if (versionLine) {
              version = versionLine.split('"')[1];
              break;
            }
          }
          break;
        }
        
        default:
          break;
      }

      // 格式化版本号：只保留主版本号部分
      if (version) {
        const versionMatch = version.match(/^([\d.]+)/);
        return versionMatch ? versionMatch[1] : version;
      }
      
      return null;
    } catch (error) {
      console.error(`error reading lock file for ${packageName}:`, error.message);
      return null;
    }
  }

  // 识别私有包
  identifyPrivatePackages(dependencies) {
    return Object.keys(dependencies).filter(name => 
      this.config.privatePackagePrefix.some(prefix => name.startsWith(prefix))
    );
  }

  // 识别风险包
  async identifyRiskPackages(dependencies, privatePackages) {
    const riskPackages = [];
    if(!this.config.riskThreshold.isCheck){
      return riskPackages;
    }
    for (const [name, info] of Object.entries(dependencies)) {
      if (privatePackages.includes(name) || this.config.riskThreshold.whiteList.includes(name)) continue;

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
    this.devLog('riskPackages', riskPackages);
    return riskPackages;
  }

  // 检查相似包
  checkSimilarPackages(dependencies) {
    const installedSimilarPackages = [];
    for (const group of this.config.similarPackages) {
      const installed = group.filter(pkg => dependencies[pkg]);
      if (installed.length > 1) {
        installedSimilarPackages.push(installed);
      }
    }
    this.devLog('similarPackages', installedSimilarPackages);
    return installedSimilarPackages;
  }

  // 获取 npm 包信息
  async fetchNpmPackageInfo(packageName) {
    try {
      const apiUrl = this.config.riskThreshold.packageInfoApi;
      const timeout = this.config.riskThreshold.apiTimeout;
      const response = await axios.get(`${apiUrl}${packageName}`, { timeout: timeout });

      this.devLog('fetchNpmPackageInfo', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching npm info for ${packageName}:`, error.message);
      return null;
    }
  }

  // 获取上次更新时间
  getMonthsSinceLastUpdate(lastUpdateDate) {
    const now = new Date();
    const lastUpdate = new Date(lastUpdateDate);
    const monthDiff = (now.getFullYear() - lastUpdate.getFullYear()) * 12 + 
                      (now.getMonth() - lastUpdate.getMonth());

    this.devLog('getMonthsSinceLastUpdate', monthDiff);
    return monthDiff;
  }

  // 获取月下载量
  async getMonthlyDownloads(packageName) {
    try {
      const apiUrl = this.config.riskThreshold.downloadInfoApi;
      const timeout = this.config.riskThreshold.apiTimeout;
      const response = await axios.get(`${apiUrl}${packageName}`, { timeout: timeout });
      
      this.devLog('getMonthlyDownloads', response.data.downloads);
      return response.data.downloads;
    } catch (error) {
      console.error(`Error fetching download stats for ${packageName}:`, error.message);
      return 0;
    }
  }

  // 获取风险原因
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
    this.devLog('riskReason', reasons);
    return reasons;
  }

  // 获取许可证风险等级
  getLicenseRiskLevel(license) {
    if (!license) return 'high';
    if (this.config.licenses.risky.includes(license)) return 'medium';
    if (!this.config.licenses.safe.includes(license)) return 'unknown';
    return 'safe';
  }

  // 检查版本升级
  checkVersionUpgrades(dependencies) {
    const upgrades = [];
    for (const [name, version] of Object.entries(dependencies)) {
      const upgrade = this.config.versionUpgrades[name];
      if (upgrade) {
        try {
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
          console.warn(`skipping version check for ${name}: ${error.message}`);
        }
      }
    }
    this.devLog('versionUpgrades', upgrades);
    return upgrades;
  }

  // 获取主版本号
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
