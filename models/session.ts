import { UserSession } from "@/types/user";
import { getDb } from "@/models/db";
import { v4 as uuidv4 } from 'uuid';

// 创建用户会话
export async function createUserSession(sessionData: {
  session_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<UserSession> {
  const db = getDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天后过期

  const res = await db.query(
    `INSERT INTO ac_user_sessions 
      (session_id, user_id, ip_address, user_agent, last_activity_at, created_at, expires_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
    [
      sessionData.session_id,
      sessionData.user_id,
      sessionData.ip_address,
      sessionData.user_agent,
      now,
      now,
      expiresAt
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create user session');
  }

  return formatUserSession(res.rows[0]);
}

// 查找用户会话
export async function findUserSession(sessionId: string): Promise<UserSession | undefined> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_user_sessions 
     WHERE session_id = $1 AND expires_at > NOW() 
     LIMIT 1`,
    [sessionId]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatUserSession(res.rows[0]);
}

// 更新会话活动时间
export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  const db = getDb();
  const res = await db.query(
    `UPDATE ac_user_sessions 
     SET last_activity_at = NOW() 
     WHERE session_id = $1 AND expires_at > NOW()`,
    [sessionId]
  );

  return (res.rowCount || 0) > 0;
}

// 增加试用次数
export async function incrementSessionTrialUsage(sessionId: string): Promise<boolean> {
  const db = getDb();
  const res = await db.query(
    `UPDATE ac_user_sessions 
     SET trial_usage_count = trial_usage_count + 1,
         last_activity_at = NOW()
     WHERE session_id = $1 AND expires_at > NOW()`,
    [sessionId]
  );

  return (res.rowCount || 0) > 0;
}

// 绑定会话到用户（用户注册后）
export async function bindSessionToUser(sessionId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const res = await db.query(
    `UPDATE ac_user_sessions 
     SET user_id = $1, last_activity_at = NOW() 
     WHERE session_id = $2`,
    [userId, sessionId]
  );

  return (res.rowCount || 0) > 0;
}

// 获取用户的所有会话
export async function getUserSessions(userId: string): Promise<UserSession[]> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_user_sessions 
     WHERE user_id = $1 AND expires_at > NOW() 
     ORDER BY last_activity_at DESC`,
    [userId]
  );

  return res.rows.map(formatUserSession);
}

// 清理过期会话
export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDb();
  const res = await db.query(
    `DELETE FROM ac_user_sessions WHERE expires_at <= NOW()`
  );

  return res.rowCount || 0;
}

// 格式化会话数据
function formatUserSession(row: any): UserSession {
  return {
    id: row.id,
    session_id: row.session_id,
    user_id: row.user_id,
    trial_usage_count: row.trial_usage_count || 0,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    last_activity_at: row.last_activity_at,
    created_at: row.created_at,
    expires_at: row.expires_at
  };
} 