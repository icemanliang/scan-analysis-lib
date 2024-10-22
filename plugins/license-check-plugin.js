class LicenseCheckPlugin {
    constructor() {
        this.name = 'LicenseCheckPlugin';
    }
    apply(scanner) {
        scanner.hooks.afterScan.tapPromise('LicenseCheckPlugin', (context) => {
            return new Promise((resolve, reject) => {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    
                    const licensePath = path.join(context.root, 'LICENSE');
                    
    
                    if (!fs.existsSync(licensePath)) {
                        const errorMsg = 'LICENSE 文件不存在';
                        context.logger.log('warn', errorMsg);
                        context.scanResults.license = { compliant: false, message: errorMsg };
                        resolve();
                        return;
                    }
    
                    const acceptedLicenses = ['MIT', 'Apache-2.0', 'GPL-3.0'];
                    const content = fs.readFileSync(licensePath, 'utf-8');
                    const isCompliant = acceptedLicenses.some(license => content.includes(license));
    
                    if (isCompliant) {
                        context.logger.log('info', 'LICENSE 文件合规');
                    } else {
                        const errorMsg = 'LICENSE 文件不包含被认可的license';
                        context.logger.log('warn', errorMsg);
                    }
    
                    context.scanResults.license = { compliant: isCompliant };
                    resolve();
                } catch(error) {
                    context.scanResults.license = null;
                    context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
                    resolve();
                }
            });
        });
    }
}

module.exports = LicenseCheckPlugin;
