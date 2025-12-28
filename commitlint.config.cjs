module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Разрешаем кириллицу и произвольный регистр в subject.
    'subject-case': [0],
    'header-max-length': [2, 'always', 100]
  }
};
