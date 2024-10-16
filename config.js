const path = require('path');

// 用于调试，应用配置，插件配置先都放在这里
module.exports = {
    FINAL_RESULT_DIR: path.join(__dirname, 'result'),
    // 扫描的源文件目录
    source: [
        {
            appName: 'siam-admin-front',
            sourceDir: path.join(__dirname, 'resources/siam-admin-front'),
            codeDir: path.join(__dirname, 'resources/siam-admin-front', 'src')
        },
        // {
        //     appName: 'project-app2',
        //     sourceDir: path.join(__dirname, 'resources/project-app2'),
        //     codeDir: path.join(__dirname, 'resources/project-app2', 'src')
        // },
        // {
        //     appName: 'project-app3',
        //     sourceDir: path.join(__dirname, 'resources/project-app3'),
        //     codeDir: path.join(__dirname, 'resources/project-app3', 'src')
        // }
    ]
}