import { Pool } from "pg";

let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      // 提供默认的开发环境连接字符串
      const defaultConnectionString = 'postgresql://postgres:123123@localhost:5432/aicollager';
      console.warn('⚠️  POSTGRES_URL 环境变量未设置，使用默认配置:', defaultConnectionString);
      
      globalPool = new Pool({
        connectionString: defaultConnectionString,
      });
    } else {
      globalPool = new Pool({
        connectionString,
      });
    }
  }

  return globalPool;
}
