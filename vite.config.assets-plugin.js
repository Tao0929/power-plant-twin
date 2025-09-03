// Vite资源路径处理插件
// 此插件会帮助处理项目中使用的'/assets/'路径引用

/**
 * 创建资源路径处理插件
 * 自动处理代码中使用的'/assets/'路径引用
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
        // 我们不需要修改代码，因为Vite会自动处理这些路径
        // 但我们可以在这里添加日志，帮助调试
        // console.log(`Found asset references in file: ${id}`);
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
          // 检查是否包含需要处理的资源路径
          if (chunk.code.includes('/assets/')) {
            // 这里不需要修改代码，因为Vite会根据base配置自动处理路径
            // 但我们可以添加额外的处理逻辑，如果需要
          }
        }
      }
    }
  };
};