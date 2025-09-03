// Vite资源路径处理插件
// 此插件会在构建过程中自动处理代码中的'/assets/'路径引用

/**
 * 创建资源路径处理插件
 * 自动将代码中的'/assets/'引用转换为兼容GitHub Pages的路径格式
 */
export const createAssetPathPlugin = () => {
  return {
    name: 'asset-path-resolver',
    enforce: 'pre', // 在其他插件之前执行
    
    // 转换源代码中的资源路径
    transform(code, id) {
      // 只处理JavaScript/JSX/TS/TSX文件
      if (!id.endsWith('.js') && 
          !id.endsWith('.jsx') && 
          !id.endsWith('.ts') && 
          !id.endsWith('.tsx')) {
        return code;
      }
      
      // 检查代码中是否包含'/assets/'路径引用
      if (code.includes('/assets/')) {
        // 在开发环境中不做修改
        if (process.env.NODE_ENV === 'development') {
          return code;
        }
        
        // 在生产环境中，将所有'/assets/'路径引用替换为'/@assets/'
        // 这样rollup的paths配置会进一步将其转换为正确的路径
        const transformedCode = code.replace(/\/assets\//g, '/@assets/');
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
            chunk.code = chunk.code.replace(/\/assets\//g, '/power-plant-twin/assets/');
          }
        }
      }
    }
  };
};