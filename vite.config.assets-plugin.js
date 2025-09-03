// Vite资源路径处理插件
// 此插件会在构建过程中自动处理代码中的'/assets/'路径引用

/**
 * 创建资源路径处理插件
 * 自动将代码中的'/assets/'引用转换为兼容GitHub Pages的路径格式
 * 
 * @param {Object} options - 插件选项
 * @param {string} options.basePath - 基础路径（通常与Vite的base配置相同）
 */
export const createAssetPathPlugin = (options = {}) => {
  // 默认基础路径，通常会在vite.config.js中传入
  const basePath = options.basePath || '/';
  
  return {
    name: 'asset-path-resolver',
    enforce: 'pre', // 在其他插件之前执行
    
    // 转换源代码中的资源路径
    transform(code, id) {
      // 检查代码中是否包含'/assets/'路径引用
      if (code.includes('/assets/')) {
        // 在开发环境中不做修改
        if (process.env.NODE_ENV === 'development') {
          return code;
        }
        
        // 在生产环境中，根据基础路径转换'/assets/'路径
        // 避免与Vite的base配置冲突导致路径重复
        const targetPath = basePath.endsWith('/') 
          ? `${basePath}assets/` 
          : `${basePath}/assets/`;
        
        const transformedCode = code.replace(/\/assets\//g, targetPath);
        return transformedCode;
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
          // 检查是否还有未处理的'/assets/'路径引用
          if (chunk.code.includes('/assets/')) {
            // 在最终的bundle中再次替换，确保所有路径都正确处理
            const targetPath = basePath.endsWith('/') 
              ? `${basePath}assets/` 
              : `${basePath}/assets/`;
               
            chunk.code = chunk.code.replace(/\/assets\//g, targetPath);
          }
        }
      }
    }
  };
};