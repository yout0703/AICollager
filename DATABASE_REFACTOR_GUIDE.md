# 数据库适配器重构指南

## 🎯 重构目标

消除项目中所有的 `if (dbType === 'supabase')` 条件判断，提供更优雅、统一的数据库操作接口。

## 🔧 重构前的问题

### 问题 1: 代码重复和条件判断
```typescript
// 重构前：每个地方都需要判断数据库类型
if (dbType === 'supabase') {
  const result = await dbAdapter.select('table_name', { where: { id: 1 } });
  // Supabase 特定逻辑
} else {
  const result = await dbAdapter.rawQuery('SELECT * FROM table_name WHERE id = $1', [1]);
  // PostgreSQL 特定逻辑
}
```

### 问题 2: 维护困难
- 每次添加新的数据库操作都需要写两套代码
- 容易出现逻辑不一致的问题
- 代码可读性差，违反 DRY 原则

### 问题 3: 扩展性差
- 如果要支持新的数据库类型，需要修改所有相关代码
- 业务逻辑和数据库实现耦合严重

## ✨ 重构后的解决方案

### 1. 抽象基类设计

```typescript
abstract class BaseDatabaseAdapter {
  protected client: any;
  
  constructor(client: any) {
    this.client = client;
  }

  // 定义统一的抽象接口
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
```

### 2. 具体实现类

#### Supabase 适配器
```typescript
class SupabaseDatabaseAdapter extends BaseDatabaseAdapter {
  async select(tableName: string, options: QueryOptions = {}): Promise<DatabaseResult> {
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

    // ... 其他 Supabase 特定逻辑

    const { data, error, count } = await query;
    return { data, error, count };
  }

  async rawQuery(sql: string, params: any[] = []): Promise<DatabaseResult> {
    // Supabase 不支持原始 SQL，提供友好的错误信息
    throw new Error('Supabase 不支持原始 SQL 查询。请使用表操作方法或创建存储过程。');
  }

  async getCurrentTime(): Promise<DatabaseResult> {
    // 使用 JavaScript 获取当前时间
    return {
      data: [{ current_time: new Date().toISOString() }],
      rows: [{ current_time: new Date().toISOString() }]
    };
  }

  // ... 其他方法实现
}
```

#### PostgreSQL 适配器
```typescript
class PostgreSQLDatabaseAdapter extends BaseDatabaseAdapter {
  async select(tableName: string, options: QueryOptions = {}): Promise<DatabaseResult> {
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

    // ... 构建完整的 SQL

    const result = await this.client.query(sql, params);
    return { data: result.rows, rows: result.rows };
  }

  async rawQuery(sql: string, params: any[] = []): Promise<DatabaseResult> {
    const result = await this.client.query(sql, params);
    return { data: result.rows, rows: result.rows };
  }

  async getCurrentTime(): Promise<DatabaseResult> {
    return this.rawQuery('SELECT NOW() as current_time');
  }

  // ... 其他方法实现
}
```

### 3. 统一的主适配器

```typescript
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

  // ... 其他代理方法
}
```

## 🚀 重构后的优势

### 1. 代码简洁性
```typescript
// 重构后：统一的接口，无需条件判断
const dbAdapter = new DatabaseAdapter(true);

// 所有数据库类型都使用相同的接口
const users = await dbAdapter.select('ac_users', {
  where: { status: 'active' },
  limit: 10
});

const currentTime = await dbAdapter.getCurrentTime();
const tables = await dbAdapter.getTables('public', 'ac_');
```

### 2. 类型安全
```typescript
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
```

### 3. 扩展性
- 添加新的数据库类型只需要实现 `BaseDatabaseAdapter`
- 业务代码无需修改
- 符合开闭原则

### 4. 维护性
- 每个数据库的逻辑封装在独立的类中
- 接口统一，减少出错概率
- 更容易进行单元测试

## 📁 重构涉及的文件

### 核心文件
- `lib/database-adapter.ts` - 重构的核心适配器
- `models/aiAnalysisCache.ts` - AI 缓存模型重构
- `models/aiUsageStats.ts` - AI 统计模型重构
- `app/api/test-db/route.ts` - 测试路由重构

### 新增文件
- `app/api/test-refactored-db/route.ts` - 重构验证测试

## 🧪 测试验证

### 运行测试
```bash
# 测试重构后的数据库适配器
curl http://localhost:3000/api/test-refactored-db

# 原有的数据库测试（已重构）
curl http://localhost:3000/api/test-db
```

### 测试覆盖
1. ✅ 基本连接测试
2. ✅ 表查询测试
3. ✅ 计数查询测试
4. ✅ AI 缓存操作测试
5. ✅ AI 统计操作测试
6. ✅ 原始 SQL 查询测试（PostgreSQL）

## 🔄 迁移指南

### 对于现有代码
1. 移除所有 `if (dbType === 'supabase')` 判断
2. 使用统一的 `DatabaseAdapter` 接口
3. 将原始 SQL 查询替换为抽象方法调用

### 示例迁移

#### 迁移前
```typescript
const dbAdapter = new DatabaseAdapter(true);
const dbType = getDatabaseType();

if (dbType === 'supabase') {
  const result = await dbAdapter.select('ac_users', {
    where: { status: 'active' }
  });
  // Supabase 特定处理
} else {
  const result = await dbAdapter.rawQuery(
    'SELECT * FROM ac_users WHERE status = $1',
    ['active']
  );
  // PostgreSQL 特定处理
}
```

#### 迁移后
```typescript
const dbAdapter = new DatabaseAdapter(true);

// 统一接口，自动适配不同数据库
const result = await dbAdapter.select('ac_users', {
  where: { status: 'active' }
});
```

## 🎉 总结

通过这次重构，我们实现了：

1. **消除了所有条件判断** - 不再需要 `if (dbType === 'supabase')`
2. **提供了统一接口** - 所有数据库操作使用相同的 API
3. **增强了可维护性** - 代码更清晰，更容易维护
4. **提高了扩展性** - 易于支持新的数据库类型
5. **保持了向后兼容** - 现有功能完全保持不变

这是一个典型的**适配器模式**和**策略模式**的应用，通过抽象层隐藏了不同数据库的实现细节，为上层业务代码提供了统一、简洁的接口。 