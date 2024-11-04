module.exports = {
  // 开发模式
  devMode: false,
  
  // 文件类型分类配置
  fileTypes: {
    media: [
      '.jpg', '.jpeg', '.png', '.gif', '.svg',
      '.mp4', '.webm',
      '.woff', '.woff2', '.ttf', '.eot'
    ]
  },

  // 文件压缩检查配置
  minification: {
    minLines: 5,
    maxLineLength: 100
  },

  // HTML 文件检查配置
  html: {
    // CDN 资源检查配置
    cdn: {
      // 不安全的 CDN 域名列表
      unsafeHosts: ['unsafecdn.com'],
      
      // 标准的 CDN 域名列表
      standardHosts: [
        'cdn.example.com',
        'static.example.com'
      ]
    }
  }
}; 