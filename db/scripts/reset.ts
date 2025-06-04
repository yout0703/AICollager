import { db } from '../client'
import { sql } from 'drizzle-orm'

/**
 * 完全重置数据库
 * 删除所有表、序列、函数等，准备重新创建
 */
async function resetDatabase() {
  console.log('🗑️  开始重置数据库...')

  try {
    // 1. 禁用外键约束检查
    await db.execute(sql`SET session_replication_role = replica`)

    // 2. 删除所有表
    console.log('📋 获取所有表...')
    const tablesResult = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `) as { tablename: string }[]

    for (const table of tablesResult) {
      const tableName = table.tablename
      console.log(`🗑️  删除表: ${tableName}`)
      await db.execute(sql.raw(`DROP TABLE IF EXISTS public."${tableName}" CASCADE`))
    }

    // 3. 删除所有序列
    console.log('🔢 删除所有序列...')
    const sequencesResult = await db.execute(sql`
      SELECT sequencename 
      FROM pg_sequences 
      WHERE schemaname = 'public'
    `) as { sequencename: string }[]

    for (const sequence of sequencesResult) {
      const sequenceName = sequence.sequencename
      console.log(`🗑️  删除序列: ${sequenceName}`)
      await db.execute(sql.raw(`DROP SEQUENCE IF EXISTS public."${sequenceName}" CASCADE`))
    }

    // 4. 删除所有用户定义的函数
    console.log('⚙️  删除所有函数...')
    const functionsResult = await db.execute(sql`
      SELECT proname, oidvectortypes(proargtypes) as argtypes 
      FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.prokind = 'f'
    `) as { proname: string; argtypes: string }[]

    for (const func of functionsResult) {
      const funcName = func.proname
      const args = func.argtypes
      console.log(`🗑️  删除函数: ${funcName}`)
      await db.execute(sql.raw(`DROP FUNCTION IF EXISTS public."${funcName}"(${args}) CASCADE`))
    }

    // 5. 删除所有枚举类型
    console.log('📝 删除所有枚举类型...')
    const typesResult = await db.execute(sql`
      SELECT typname 
      FROM pg_type t 
      JOIN pg_namespace n ON t.typnamespace = n.oid 
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `) as { typname: string }[]

    for (const type of typesResult) {
      const typeName = type.typname
      console.log(`🗑️  删除类型: ${typeName}`)
      await db.execute(sql.raw(`DROP TYPE IF EXISTS public."${typeName}" CASCADE`))
    }

    // 6. 重新启用外键约束检查
    await db.execute(sql`SET session_replication_role = DEFAULT`)

    // 7. 确保必要的扩展存在
    console.log('🔧 创建必要的扩展...')
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    console.log('✅ 数据库重置完成!')
    console.log('📝 现在可以运行 pnpm run db:push 来创建新的表结构')

  } catch (error) {
    console.error('❌ 数据库重置失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 数据库重置成功!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 重置失败:', error)
      process.exit(1)
    })
}

export { resetDatabase } 