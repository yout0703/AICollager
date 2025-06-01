import { DatabaseAdapter } from "@/lib/database-adapter";
import { v4 as uuidv4 } from 'uuid';
import { UserSession } from '@/types/user';

// 创建用户会话
export async function createUserSession(sessionData: {
  session_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<UserSession> {
  const db = new DatabaseAdapter(true);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天后过期

  const insertData = {
    session_id: sessionData.session_id,
    user_id: sessionData.user_id,
    ip_address: sessionData.ip_address,
    user_agent: sessionData.user_agent,
    created_at: now,
    expires_at: expiresAt
  };

  const result = await db.insert('ac_user_sessions', insertData);
  
  if (result.error) {
    throw new Error('Failed to create user session: ' + result.error.message);
  }

  const insertedData = result.data?.[0] || result.rows?.[0];
  if (!insertedData) {
    throw new Error('Failed to create user session');
  }

  return formatUserSession(insertedData);
}

// 查找用户会话
export async function findUserSession(sessionId: string): Promise<UserSession | undefined> {
  const db = new DatabaseAdapter(true);
  
  // 使用原始查询处理复杂的 WHERE 条件
  const query = `
    SELECT * FROM ac_user_sessions 
    WHERE session_id = $1 AND expires_at > NOW() 
    LIMIT 1
  `;
  
  const result = await db.rawQuery(query, [sessionId]);
  
  if (result.error) {
    throw new Error('Failed to find user session: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatUserSession(rows[0]);
}

// 更新会话最后活动时间
export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    UPDATE ac_user_sessions 
    SET last_activity_at = NOW() 
    WHERE session_id = $1 AND expires_at > NOW()
  `;
  
  const result = await db.rawQuery(query, [sessionId]);
  
  if (result.error) {
    throw new Error('Failed to update session activity: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 删除会话
export async function deleteUserSession(sessionId: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  const result = await db.delete('ac_user_sessions', { session_id: sessionId });
  
  if (result.error) {
    throw new Error('Failed to delete user session: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 增加会话试用次数
export async function incrementSessionTrialUsage(sessionId: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  // 使用原始查询处理复杂的更新逻辑
  const query = `
    UPDATE ac_user_sessions 
    SET trial_usage_count = trial_usage_count + 1, 
        last_activity_at = NOW()
    WHERE session_id = $1 AND expires_at > NOW()
  `;
  
  const result = await db.rawQuery(query, [sessionId]);
  
  if (result.error) {
    throw new Error('Failed to increment session trial usage: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 清理过期会话
export async function cleanupExpiredSessions(): Promise<number> {
  const db = new DatabaseAdapter(true);
  
  // 使用原始查询删除过期会话
  const query = `
    DELETE FROM ac_user_sessions 
    WHERE expires_at <= NOW()
    RETURNING session_id
  `;
  
  const result = await db.rawQuery(query);
  
  if (result.error) {
    throw new Error('Failed to cleanup expired sessions: ' + result.error.message);
  }

  return result.data?.length || result.rows?.length || 0;
}

// 格式化用户会话数据
function formatUserSession(row: any): UserSession {
  return {
    id: row.id,
    session_id: row.session_id,
    user_id: row.user_id,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    trial_usage_count: row.trial_usage_count || 0,
    created_at: row.created_at,
    last_activity_at: row.last_activity_at,
    expires_at: row.expires_at
  };
}

// 绑定会话到用户（用户注册后）
export async function bindSessionToUser(sessionId: string, userId: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    UPDATE ac_user_sessions 
    SET user_id = $1, last_activity_at = NOW() 
    WHERE session_id = $2
  `;
  
  const result = await db.rawQuery(query, [userId, sessionId]);
  
  if (result.error) {
    throw new Error('Failed to bind session to user: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 获取用户的所有会话
export async function getUserSessions(userId: string): Promise<UserSession[]> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    SELECT * FROM ac_user_sessions 
    WHERE user_id = $1 AND expires_at > NOW() 
    ORDER BY last_activity_at DESC
  `;
  
  const result = await db.rawQuery(query, [userId]);
  
  if (result.error) {
    throw new Error('Failed to get user sessions: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  return rows.map(formatUserSession);
} 