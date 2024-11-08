const path = require('path');
const { RESULT_DIR, MAX_WORKER_NUM } = require('./const');

// 配置文件
module.exports = {
    getConfig: (userConfig = {}) => ({
        resultDir: path.join(process.cwd(), userConfig.resultDir || RESULT_DIR),
        maxWorkerNum: userConfig.maxWorkerNum || MAX_WORKER_NUM,
        sources: userConfig.sources,
        plugins: userConfig.plugins
    })
};
