module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ['eslint:recommended', 'prettier'],
  ignorePatterns: ['*.js', '!src/**/*'],
  parserOptions: {
    sourceType: 'module'
  }
}