import { getDatabaseType, getSupabaseClient, getServerSupabaseClient, getDb } from '../models/db';
import { Pool } from 'pg';

export interface DatabaseResult {
  rows?: any[];
  data?: any[];
  error?: any;
  count?: number;
}

export interface QueryOptions {
  select?: string;
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface WhereCondition {
  [key: string]: any;
}

// 抽象数据库操作接口
abstract class BaseDatabaseAdapter {
  protected client: any;
  
  constructor(client: any) {
    this.client = client;
  }

  abstract select(tableName: string, options?: QueryOptions): Promise<DatabaseResult>;
  abstract insert(tableName: string, data: Record<string, any>): Promise<DatabaseResult>;
  abstract update(tableName: string, data: Record<string, any>, where: WhereCondition): Promise<DatabaseResult>;
  abstract delete(tableName: string, where: WhereCondition): Promise<DatabaseResult>;
  abstract rawQuery(sql: string, params?: any[]): Promise<DatabaseResult>;
  abstract getCurrentTime(): Promise<DatabaseResult>;
  abstract getVersion(): Promise<DatabaseResult>;
  abstract getTables(schema?: string, prefix?: string): Promise<DatabaseResult>;
  abstract count(tableName: string, where?: WhereCondition): Promise<number>;
  abstract exists(tableName: string, where: WhereCondition): Promise<boolean>;
  abstract transaction(callback: (adapter: BaseDatabaseAdapter) => Promise<any>): Promise<any>;
  abstract cleanup(): Promise<void>;
}

// Supabase 适配器实现
class SupabaseDatabaseAdapter extends BaseDatabaseAdapter {
  async select(tableName: string, options: QueryOptions = {}): Promise<DatabaseResult> {
    try {
      let query = this.client.from(tableName);
      
      if (options.select) {
        query = query.select(options.select);
      } else {
        query = query.select('*');
      }

      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          query = query.eq(key, value);
        }
      }

      if (options.orderBy) {
        const [column, direction] = options.orderBy.split(' ');
        query = query.order(column, { ascending: direction !== 'DESC' });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;
      return { data, error, count };
    } catch (error) {
      return { error };
    }
  }

  async insert(tableName: string, data: Record<string, any>): Promise<DatabaseResult> {
    try {
      const { data: result, error } = await this.client
        .from(tableName)
        .insert(data)
        .select();
      return { data: result, error };
    } catch (error) {
      return { error };
    }
  }

  async update(tableName: string, data: Record<string, any>, where: WhereCondition): Promise<DatabaseResult> {
    try {
      let query = this.client.from(tableName).update(data);
      
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }

      const { data: result, error } = await query.select();
      return { data: result, error };
    } catch (error) {
      return { error };
    }
  }

  async delete(tableName: string, where: WhereCondition): Promise<DatabaseResult> {
    try {
      let query = this.client.from(tableName);
      
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query.delete().select();
      return { data, error };
    } catch (error) {
      return { error };
    }
  }

  async rawQuery(sql: string, params: any[] = []): Promise<DatabaseResult> {
    // Supabase 不支持原始 SQL，抛出友好的错误信息
    throw new Error('Supabase 不支持原始 SQL 查询。请使用表操作方法或创建存储过程。如果需要复杂查询，请考虑使用 PostgreSQL。');
  }

  async getCurrentTime(): Promise<DatabaseResult> {
    // 使用 JavaScript 获取当前时间，因为 Supabase 不支持原始 SQL
    return {
      data: [{ current_time: new Date().toISOString() }],
      rows: [{ current_time: new Date().toISOString() }]
    };
  }

  async getVersion(): Promise<DatabaseResult> {
    // Supabase 版本信息
    return {
      data: [{ version: 'Supabase PostgreSQL (version info not available via API)' }],
      rows: [{ version: 'Supabase PostgreSQL (version info not available via API)' }]
    };
  }

  async getTables(schema: string = 'public', prefix?: string): Promise<DatabaseResult> {
    try {
      // 使用 information_schema 查询表
      let query = this.client.from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', schema);

      if (prefix) {
        query = query.like('table_name', `${prefix}%`);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { error };
    }
  }

  async count(tableName: string, where?: WhereCondition): Promise<number> {
    try {
      let query = this.client.from(tableName).select('*', { count: 'exact', head: true });
      
      if (where) {
        for (const [key, value] of Object.entries(where)) {
          query = query.eq(key, value);
        }
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Count query failed:', error);
      return 0;
    }
  }

  async exists(tableName: string, where: WhereCondition): Promise<boolean> {
    const count = await this.count(tableName, where);
    return count > 0;
  }

  async transaction(callback: (adapter: BaseDatabaseAdapter) => Promise<any>): Promise<any> {
    // Supabase 自动处理事务
    return await callback(this);
  }

  async cleanup(): Promise<void> {
    // Supabase 不需要手动清理连接
  }
}

// PostgreSQL 适配器实现
class PostgreSQLDatabaseAdapter extends BaseDatabaseAdapter {
  async select(tableName: string, options: QueryOptions = {}): Promise<DatabaseResult> {
    try {
      let sql = `SELECT ${options.select || '*'} FROM ${tableName}`;
      const params: any[] = [];
      let paramCount = 0;

      if (options.where && Object.keys(options.where).length > 0) {
        const whereConditions = Object.entries(options.where).map(([key, value]) => {
          params.push(value);
          paramCount++;
          return `${key} = $${paramCount}`;
        });
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }

      if (options.limit) {
        paramCount++;
        sql += ` LIMIT $${paramCount}`;
        params.push(options.limit);
      }

      if (options.offset) {
        paramCount++;
        sql += ` OFFSET $${paramCount}`;
        params.push(options.offset);
      }

      const result = await this.client.query(sql, params);
      return { data: result.rows, rows: result.rows };
    } catch (error) {
      return { error };
    }
  }

  async insert(tableName: string, data: Record<string, any>): Promise<DatabaseResult> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.client.query(sql, values);
      return { data: result.rows, rows: result.rows };
    } catch (error) {
      return { error };
    }
  }

  async update(tableName: string, data: Record<string, any>, where: WhereCondition): Promise<DatabaseResult> {
    try {
      const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const whereClause = Object.keys(where).map((key, i) => `${key} = $${Object.keys(data).length + i + 1}`).join(' AND ');
      
      const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
      const params = [...Object.values(data), ...Object.values(where)];
      
      const result = await this.client.query(sql, params);
      return { data: result.rows, rows: result.rows };
    } catch (error) {
      return { error };
    }
  }

  async delete(tableName: string, where: WhereCondition): Promise<DatabaseResult> {
    try {
      const whereClause = Object.keys(where).map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      const sql = `DELETE FROM ${tableName} WHERE ${whereClause} RETURNING *`;
      const params = Object.values(where);
      
      const result = await this.client.query(sql, params);
      return { data: result.rows, rows: result.rows };
    } catch (error) {
      return { error };
    }
  }

  async rawQuery(sql: string, params: any[] = []): Promise<DatabaseResult> {
    try {
      const result = await this.client.query(sql, params);
      return { data: result.rows, rows: result.rows };
    } catch (error) {
      return { error };
    }
  }

  async getCurrentTime(): Promise<DatabaseResult> {
    return this.rawQuery('SELECT NOW() as current_time');
  }

  async getVersion(): Promise<DatabaseResult> {
    return this.rawQuery('SELECT version() as version');
  }

  async getTables(schema: string = 'public', prefix?: string): Promise<DatabaseResult> {
    let sql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
    `;
    const params = [schema];

    if (prefix) {
      sql += ` AND table_name LIKE $2`;
      params.push(`${prefix}%`);
    }

    sql += ` ORDER BY table_name`;

    return this.rawQuery(sql, params);
  }

  async count(tableName: string, where?: WhereCondition): Promise<number> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
      const params: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const whereConditions = Object.entries(where).map(([key, value], index) => {
          params.push(value);
          return `${key} = $${index + 1}`;
        });
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      const result = await this.rawQuery(sql, params);
      return parseInt(result.rows?.[0]?.count || '0');
    } catch (error) {
      console.error('Count query failed:', error);
      return 0;
    }
  }

  async exists(tableName: string, where: WhereCondition): Promise<boolean> {
    const count = await this.count(tableName, where);
    return count > 0;
  }

  async transaction(callback: (adapter: BaseDatabaseAdapter) => Promise<any>): Promise<any> {
    const client = await this.client.connect();
    try {
      await client.query('BEGIN');
      const transactionAdapter = new PostgreSQLDatabaseAdapter(client);
      
      const result = await callback(transactionAdapter);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cleanup(): Promise<void> {
    // PostgreSQL 连接池会自动管理连接
  }
}

// 主要的 DatabaseAdapter 类
export class DatabaseAdapter {
  private adapter: BaseDatabaseAdapter;
  private dbType: 'supabase' | 'postgresql';

  constructor(useServerClient = false) {
    this.dbType = getDatabaseType();
    
    if (this.dbType === 'supabase') {
      const client = useServerClient ? getServerSupabaseClient() : getSupabaseClient();
      this.adapter = new SupabaseDatabaseAdapter(client);
    } else {
      const client = getDb();
      this.adapter = new PostgreSQLDatabaseAdapter(client);
    }
  }

  // 代理所有方法到具体的适配器
  async select(tableName: string, options?: QueryOptions): Promise<DatabaseResult> {
    return this.adapter.select(tableName, options);
  }

  async insert(tableName: string, data: Record<string, any>): Promise<DatabaseResult> {
    return this.adapter.insert(tableName, data);
  }

  async update(tableName: string, data: Record<string, any>, where: WhereCondition): Promise<DatabaseResult> {
    return this.adapter.update(tableName, data, where);
  }

  async delete(tableName: string, where: WhereCondition): Promise<DatabaseResult> {
    return this.adapter.delete(tableName, where);
  }

  async rawQuery(sql: string, params?: any[]): Promise<DatabaseResult> {
    return this.adapter.rawQuery(sql, params);
  }

  async getCurrentTime(): Promise<DatabaseResult> {
    return this.adapter.getCurrentTime();
  }

  async getVersion(): Promise<DatabaseResult> {
    return this.adapter.getVersion();
  }

  async getTables(schema?: string, prefix?: string): Promise<DatabaseResult> {
    return this.adapter.getTables(schema, prefix);
  }

  async count(tableName: string, where?: WhereCondition): Promise<number> {
    return this.adapter.count(tableName, where);
  }

  async exists(tableName: string, where: WhereCondition): Promise<boolean> {
    return this.adapter.exists(tableName, where);
  }

  async transaction(callback: (adapter: DatabaseAdapter) => Promise<any>): Promise<any> {
    return this.adapter.transaction(async (baseAdapter) => {
      // 创建一个新的 DatabaseAdapter 包装器
      const wrappedAdapter = new DatabaseAdapter();
      wrappedAdapter.adapter = baseAdapter;
      wrappedAdapter.dbType = this.dbType;
      return callback(wrappedAdapter);
    });
  }

  async cleanup(): Promise<void> {
    return this.adapter.cleanup();
  }

  // 获取数据库类型（用于调试）
  getDbType(): 'supabase' | 'postgresql' {
    return this.dbType;
  }

  // 兼容性方法（保持向后兼容）
  async query(sql: string, params?: any[]): Promise<DatabaseResult> {
    console.warn('⚠️ query() 方法已废弃，请使用 rawQuery() 或表操作方法');
    return this.rawQuery(sql, params);
  }
} 