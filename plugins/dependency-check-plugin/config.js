module.exports = {
  compilerOptions: {
    allowJs: true,
    jsx: 'react',
    resolveJsonModule: true,
    moduleResolution: 'node',
  },
  blackImport: [],
  ignoreMatch: ['__tests__/', 'typings/', 'types/'],
  ignoreBailFile: ['/index.ts', '/index.tsx', '/index.js', '/index.jsx']
}
