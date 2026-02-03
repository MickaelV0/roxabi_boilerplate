module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'refactor', // Code refactoring
        'docs', // Documentation
        'style', // Formatting, no code change
        'test', // Adding tests
        'chore', // Maintenance
        'perf', // Performance improvement
        'ci', // CI/CD changes
        'build', // Build system changes
        'revert', // Revert previous commit
      ],
    ],
    // Allow longer subjects for descriptive commits
    'header-max-length': [2, 'always', 100],
  },
}
