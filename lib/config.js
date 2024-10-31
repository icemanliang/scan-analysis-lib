const path = require('path');
const { RESULT_DIR } = require('./const');

// 用于调试，应用配置，插件配置先都放在这里
module.exports = {
    getConfig: (userConfig = {}) => ({
        resultDir: path.join(process.cwd(), userConfig.resultDir || RESULT_DIR),
        sources: userConfig.sources,
        plugins: userConfig.plugins
    })
};
