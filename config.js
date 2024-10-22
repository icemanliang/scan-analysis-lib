const path = require('path');

// 用于调试，应用配置，插件配置先都放在这里
module.exports = {
    getConfig: (userConfig = {}) => ({
        FINAL_RESULT_DIR: userConfig.FINAL_RESULT_DIR || path.join(process.cwd(), 'scan-result'),
        source: userConfig.source || [],
        plugins: userConfig.plugins || {}
    })
};
