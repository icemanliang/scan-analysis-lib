# ConfigCheckPlugin

配置检查插件，用于检查项目配置是否符合规范。

## 配置

## 检查项

### commitlint

### prettier

### eslint

### tsconfig

### packageJson

### license

### ignoreFiles

### browserslist

### nodeVersion

### editorconfig

### readme

### npmrc

## 参考

- [Browserslist](https://github.com/browserslist/browserslist)
- [Node Version](https://github.com/nodejs/node-version)
- [EditorConfig](https://editorconfig.org/)
- [Prettier](https://prettier.io/)
- [Eslint](https://eslint.org/)

## 注意事项

- 检查项中，`readme`、`license`、`ignoreFiles`、`npmrc`、`packageJson`、`editorconfig`、`tsconfig`、`eslint`、`prettier`、`commitlint` 等检查项需要项目中存在对应的文件，否则检查会失败。

## 输出

- 输出结果中，`configInfo` 为 `null` 表示跳过检查。

