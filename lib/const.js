module.exports = {
    // 结果目录
    RESULT_DIR: 'scan-result',
    // 主进程日志文件名
    MASTER_LOG_NAME: 'scanner.log',
    // 并行子进程最大数量
    MAX_WORKER_NUM: 2,
    // 子进程结果文件名
    WORKER_RESULT_NAME: 'result.json',
    // 子进程日志文件名
    WORKER_LOG_NAME: 'worker.log',
    // 插件名
    PLUGINS: {
        CONFIG_CHECK_PLUGIN: 'config-check-plugin',
        ESLINT_CHECK_PLUGIN: 'eslint-check-plugin',
        STYLELINT_CHECK_PLUGIN: 'stylelint-check-plugin',
        COUNT_CHECK_PLUGIN: 'count-check-plugin',
        PACKAGE_CHECK_PLUGIN: 'package-check-plugin',
        GIT_CHECK_PLUGIN: 'git-check-plugin',
        DEPENDENCY_CHECK_PLUGIN: 'dependency-check-plugin',
        BUILD_CHECK_PLUGIN: 'build-check-plugin',
        REDUNDANCY_CHECK_PLUGIN: 'redundancy-check-plugin',
        QUALITY_ANALYSIS_PLUGIN: 'quality-analysis-plugin',
    }
};
