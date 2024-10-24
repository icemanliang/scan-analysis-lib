module.exports = function checkCommitMessage(commits) {
  const results = [];
  
  // 修正正则表达式以正确匹配所有情况
  const commitMessageRegex = /^(Merge branch|(\[[A-Z]+-\d+\]\s)?(feat|fix|docs|style|refactor|test|chore)(\([\w-]+\))?: .+)/;

  for (const commit of commits) {
    const isValid = commitMessageRegex.test(commit.message);
    const errors = isValid ? [] : ['Invalid commit message'];
    const warnings = []; // 可以根据需要添加警告规则

    results.push({
      hash: commit.hash,
      message: commit.message,
      isValid,
      errors,
      warnings
    });
  }

  return results;
};
