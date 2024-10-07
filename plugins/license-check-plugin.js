class LicenseCheckPlugin {
    constructor() {
        this.name = 'LicenseCheckPlugin';
    }
    apply(scanner) {
        scanner.hooks.afterScan.tapPromise('LicenseCheckPlugin', (context) => {
            return new Promise((resolve, rejects) =>{
                try{
                    const fs = require('fs');
                    const path = require('path');
                    
                    const licensePath = path.join(context.root, 'LICENSE');
                    
    
                    if (!fs.existsSync(licensePath)) {
                        const errorMsg = 'LICENSE 文件不存在';
                        console.error(errorMsg);
                        // context.scanResults.license = { compliant: false, message: errorMsg };
                        throw new Error(errorMsg);
                    }
    
                    const acceptedLicenses = ['MIT', 'Apache-2.0', 'GPL-3.0'];
                    const content = fs.readFileSync(licensePath, 'utf-8');
                    const isCompliant = acceptedLicenses.some(license => content.includes(license));
    
                    if (isCompliant) {
                        console.log('LICENSE 文件合规');
                    } else {
                        const errorMsg = 'LICENSE 文件不包含被认可的license';
                        console.error(errorMsg);
                        // context.scanResults.license = { compliant: false, message: errorMsg };
                        throw new Error(errorMsg);
                    }
    
                    context.scanResults.license = { compliant: isCompliant };
                    resolve();
                }catch(error){
                    context.scanResults.license = null;
                    process.send({ type: 'log', level: 'error', text: `Error in plugin ${this.name}: ${error.message}` });
                    resolve();
                }
            })
        });
    }
}

module.exports = LicenseCheckPlugin;