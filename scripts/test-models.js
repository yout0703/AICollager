#!/usr/bin/env node

const { Pool } = require('pg');

// 从环境变量获取数据库连接
const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:123123@localhost:5432/aicollager';

async function testModels() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log('🧪 测试数据模型...\n');
    
    // 测试1: 创建测试用户
    console.log('1️⃣ 测试用户创建...');
    const testUser = await pool.query(`
      INSERT INTO ac_users (clerk_user_id, email, username, display_name, invite_code)
      VALUES ('test_clerk_123', 'test@example.com', 'testuser', 'Test User', 'TESTCODE123')
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING uuid, email, credits, invite_code
    `);
    
    const userId = testUser.rows[0].uuid;
    console.log(`   ✅ 用户创建成功: ${testUser.rows[0].email}`);
    console.log(`   💰 初始积分: ${testUser.rows[0].credits}`);
    console.log(`   🔗 邀请码: ${testUser.rows[0].invite_code}`);
    
    // 测试2: 创建积分交易
    console.log('\n2️⃣ 测试积分交易...');
    const transaction = await pool.query(`
      INSERT INTO ac_credit_transactions 
      (uuid, user_id, amount, balance_after, transaction_type, title, description)
      VALUES (gen_random_uuid(), $1, -5, 45, 'collage', '创建拼图', '消耗5积分创建拼图')
      RETURNING uuid, amount, transaction_type, title
    `, [userId]);
    
    console.log(`   ✅ 交易记录创建: ${transaction.rows[0].title}`);
    console.log(`   💸 积分变化: ${transaction.rows[0].amount}`);
    
    // 更新用户积分
    await pool.query(`
      UPDATE ac_users SET credits = 45, total_used_credits = 5 WHERE uuid = $1
    `, [userId]);
    
    // 测试3: 创建用户会话
    console.log('\n3️⃣ 测试用户会话...');
    const session = await pool.query(`
      INSERT INTO ac_user_sessions (session_id, user_id, trial_usage_count)
      VALUES ('test_session_123', $1, 1)
      ON CONFLICT (session_id) DO UPDATE SET trial_usage_count = ac_user_sessions.trial_usage_count + 1
      RETURNING session_id, trial_usage_count
    `, [userId]);
    
    console.log(`   ✅ 会话创建: ${session.rows[0].session_id}`);
    console.log(`   🔢 试用次数: ${session.rows[0].trial_usage_count}`);
    
    // 测试4: 创建邀请记录
    console.log('\n4️⃣ 测试邀请系统...');
    const invitation = await pool.query(`
      INSERT INTO ac_invitations (uuid, inviter_id, invite_code, invitation_method)
      VALUES (gen_random_uuid(), $1, 'INVITE123', 'link')
      RETURNING uuid, invite_code, status
    `, [userId]);
    
    console.log(`   ✅ 邀请创建: ${invitation.rows[0].invite_code}`);
    console.log(`   📊 状态: ${invitation.rows[0].status}`);
    
    // 测试5: 查询统计信息
    console.log('\n5️⃣ 测试数据查询...');
    
    // 用户积分余额
    const userBalance = await pool.query(`
      SELECT credits, total_earned_credits, total_used_credits 
      FROM ac_users WHERE uuid = $1
    `, [userId]);
    
    console.log(`   💰 当前积分: ${userBalance.rows[0].credits}`);
    console.log(`   📈 累计获得: ${userBalance.rows[0].total_earned_credits}`);
    console.log(`   📉 累计使用: ${userBalance.rows[0].total_used_credits}`);
    
    // 积分交易历史
    const transactions = await pool.query(`
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM ac_credit_transactions WHERE user_id = $1
    `, [userId]);
    
    console.log(`   📋 交易记录: ${transactions.rows[0].count} 条`);
    console.log(`   💱 总变化: ${transactions.rows[0].total_amount}`);
    
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await pool.query('DELETE FROM ac_credit_transactions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM ac_invitations WHERE inviter_id = $1', [userId]);
    await pool.query('DELETE FROM ac_user_sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM ac_users WHERE uuid = $1', [userId]);
    
    console.log('   ✅ 测试数据已清理');
    
    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testModels();
}

module.exports = { testModels }; 