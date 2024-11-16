const path = require('path');

/**
 * 根据重复内容对克隆进行分组
 * @param {Array} clones - 原始克隆数组
 * @param {string} baseDir - 基础目录路径
 * @returns {Array} 分组后的克隆数组
*/
exports.groupClonesByContent = (clones, baseDir) => {
    const cloneGroups = [];
    const processedClones = new Set();

    clones.forEach((clone, index) => {
        if (processedClones.has(index)) return;

        // 获取当前克隆对的特征
        const currentLines = clone.duplicationA.end.line - clone.duplicationA.start.line;
        const currentTokens = clone.duplicationA.range;
        const currentFragment = clone.duplicationA.fragment;
        
        // 找到所有完全匹配的克隆对
        const sameClones = clones.reduce((acc, otherClone, otherIndex) => {
        if (index === otherIndex) {
            acc.push(otherIndex);
            return acc;
        }

        const otherLines = otherClone.duplicationA.end.line - otherClone.duplicationA.start.line;
        
        // 严格检查：行数相同、代码片段相同、token序列相同
        if (otherLines === currentLines && 
            otherClone.duplicationA.fragment === currentFragment &&
            JSON.stringify(otherClone.duplicationA.range) === JSON.stringify(currentTokens)) {
            acc.push(otherIndex);
        }
        return acc;
        }, []);

        // 如果找到匹配的克隆对
        if (sameClones.length > 0) {
        const files = new Set();
        sameClones.forEach(cloneIndex => {
            const currentClone = clones[cloneIndex];
            // 添加两个文件
            [
            {
                sourceId: currentClone.duplicationA.sourceId,
                start: currentClone.duplicationA.start,
                end: currentClone.duplicationA.end
            },
            {
                sourceId: currentClone.duplicationB.sourceId,
                start: currentClone.duplicationB.start,
                end: currentClone.duplicationB.end
            }
            ].forEach(file => {
            // 验证行数一致性
            const fileLines = file.end.line - file.start.line;
            if (fileLines === currentLines) {
                files.add(JSON.stringify({
                name: path.relative(baseDir, file.sourceId),
                startLine: file.start.line,
                endLine: file.end.line
                }));
            }
            });
            processedClones.add(cloneIndex);
        });

        const group = {
            files: Array.from(files).map(f => JSON.parse(f)),
            lines: currentLines,
            tokens: currentTokens.length
        };
        cloneGroups.push(group);
        }
    });

    return cloneGroups
        .filter(group => group.files.length > 1) // 确保每个组至少有两个文件
        .sort((a, b) => {
            const filesDiff = b.files.length - a.files.length;
            if (filesDiff !== 0) return filesDiff;
            return b.lines - a.lines;
        });
}