const commitlint = require('@commitlint/lint');
const load = require('@commitlint/load');

module.exports = async function checkCommitMessage(commits) {
  const results = [];

  try {
    const { rules } = await load();

    for (const commit of commits) {
      const { valid, errors, warnings } = await commitlint(
        commit.message,
        rules
      );

      results.push({
        hash: commit.hash,
        message: commit.message,
        isValid: valid,
        errors,
        warnings
      });
    }
  } catch (error) {
    results.push({ error: error.message });
  }

  return results;
};
