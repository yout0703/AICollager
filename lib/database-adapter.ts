import { getDatabaseType, getSupabaseClient, getServerSupabaseClient } from '../models/db';
import { Pool } from 'pg';

export interface DatabaseResult {
  rows?: any[];
  data?: any[];
  error?: any;
  count?: number;
}

export class DatabaseAdapter {
  private dbType: 'supabase' | 'postgresql';
  private client: any;

  constructor(useServerClient = false) {
    this.dbType = getDatabaseType();
    
    if (this.dbType === 'supabase') {
      this.client = useServerClient ? getServerSupabaseClient() : getSupabaseClient();
    } else {
      this.client = require('../models/db').getDb();
    }
  }

  async query(sql: string, params: any[] = []): Promise<DatabaseResult> {
    try {
      if (this.dbType === 'supabase') {
        // 对于 Supabase，我们需要使用 rpc 调用原始 SQL
        // 或者转换为 Supabase 的查询方法
        throw new Error('直接 SQL 查询在 Supabase 中需要特殊处理，请使用表操作方法');
      } else {
        // PostgreSQL
        const result = await this.client.query(sql, params);
        return { rows: result.rows };
      }
    } catch (error) {
      return { error };
    }
  }

  // 表操作方法
  async select(tableName: string, options: {
    select?: string;
    where?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<DatabaseResult> {
    try {
      if (this.dbType === 'supabase') {
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
      } else {
        // 构建 PostgreSQL 查询
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
      }
    } catch (error) {
      return { error };
    }
  }

  async insert(tableName: string, data: Record<string, any>): Promise<DatabaseResult> {
    try {
      if (this.dbType === 'supabase') {
        const { data: result, error } = await this.client
          .from(tableName)
          .insert(data)
          .select();
        return { data: result, error };
      } else {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await this.client.query(sql, values);
        return { data: result.rows, rows: result.rows };
      }
    } catch (error) {
      return { error };
    }
  }

  async update(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<DatabaseResult> {
    try {
      if (this.dbType === 'supabase') {
        let query = this.client.from(tableName).update(data);
        
        for (const [key, value] of Object.entries(where)) {
          query = query.eq(key, value);
        }

        const { data: result, error } = await query.select();
        return { data: result, error };
      } else {
        const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
        const whereClause = Object.keys(where).map((key, i) => `${key} = $${Object.keys(data).length + i + 1}`).join(' AND ');
        
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
        const params = [...Object.values(data), ...Object.values(where)];
        
        const result = await this.client.query(sql, params);
        return { data: result.rows, rows: result.rows };
      }
    } catch (error) {
      return { error };
    }
  }

  async delete(tableName: string, where: Record<string, any>): Promise<DatabaseResult> {
    try {
      if (this.dbType === 'supabase') {
        let query = this.client.from(tableName);
        
        for (const [key, value] of Object.entries(where)) {
          query = query.eq(key, value);
        }

        const { data, error } = await query.delete().select();
        return { data, error };
      } else {
        const whereClause = Object.keys(where).map((key, i) => `${key} = $${i + 1}`).join(' AND ');
        const sql = `DELETE FROM ${tableName} WHERE ${whereClause} RETURNING *`;
        const params = Object.values(where);
        
        const result = await this.client.query(sql, params);
        return { data: result.rows, rows: result.rows };
      }
    } catch (error) {
      return { error };
    }
  }

  // 事务支持
  async transaction(callback: (adapter: DatabaseAdapter) => Promise<any>): Promise<any> {
    if (this.dbType === 'supabase') {
      // Supabase 自动处理事务
      return await callback(this);
    } else {
      const client = await this.client.connect();
      try {
        await client.query('BEGIN');
        const transactionAdapter = new DatabaseAdapter(false);
        transactionAdapter.client = client;
        transactionAdapter.dbType = 'postgresql';
        
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
  }

  // 原始 SQL 执行（仅用于特殊情况）
  async rawQuery(sql: string, params: any[] = []): Promise<DatabaseResult> {
    if (this.dbType === 'supabase') {
      console.warn('⚠️ Supabase 不建议使用原始 SQL 查询，请考虑使用表操作方法');
      // 可以使用 rpc 调用存储过程
      throw new Error('Supabase 不支持原始 SQL 查询，请使用表操作方法或创建存储过程');
    } else {
      const result = await this.client.query(sql, params);
      return { data: result.rows, rows: result.rows };
    }
  }
} 