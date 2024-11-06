module.exports = {
  compilerOptions: {
    allowJs: true,
    jsx: 'react',
    resolveJsonModule: true,
    moduleResolution: 'node',
    paths: {
      "@src/*": ["./src/*"]
    }
  },
  detailedImportPackages: ['react', 'lodash'], // 需要详细导入信息的包
}
