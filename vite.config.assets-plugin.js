// Vite资源路径处理插件
// 此插件会在构建过程中自动处理代码中的'/assets/'路径引用

/**
 * 创建资源路径处理插件
 * 自动将代码中的'/assets/'引用转换为兼容GitHub Pages的路径格式
 */
export const createAssetPathPlugin = () => {
  // 开发环境标志
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    name: 'asset-path-resolver',
    enforce: 'pre', // 在其他插件之前执行
    
    // 转换源代码中的资源路径
    transform(code, id) {
      // 检查代码中是否包含'/assets/'路径引用
      if (code.includes('/assets/')) {
        // 在开发环境中不做修改
        if (isDev) {
          return code;
        }
        
        // 在生产环境中，将'/assets/'替换为相对路径格式
        // 这样Vite的base配置才能正确地处理这些路径
        return code.replace(/\/assets\//g, 'assets/');
      }
      
      return code;
    },
    
    // 处理构建输出
    generateBundle(options, bundle) {
      // 遍历所有输出文件
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        
        // 处理JS文件中的资源路径
        if (chunk.type === 'chunk' && chunk.code) {
          // 检查是否有硬编码的'/assets/'路径引用
          if (chunk.code.includes('/assets/') && !isDev) {
            // 将所有剩余的'/assets/'替换为相对路径格式
            chunk.code = chunk.code.replace(/\/assets\//g, '/assets/');
          }
        }
      }
    }
  };
};