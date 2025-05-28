import { User, UserSession, CreateUserRequest } from "@/types/user";
import { getDb } from "@/models/db";
import { v4 as uuidv4 } from 'uuid';

// 生成邀请码
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// 创建用户
export async function createUser(userData: CreateUserRequest): Promise<User> {
  const db = getDb();
  const inviteCode = generateInviteCode();
  const now = new Date().toISOString();
  
  const res = await db.query(
    `INSERT INTO ac_users 
      (clerk_user_id, email, username, display_name, avatar_url, invite_code, invited_by_code, created_at, updated_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
    [
      userData.clerk_user_id,
      userData.email,
      userData.username,
      userData.display_name,
      userData.avatar_url,
      inviteCode,
      userData.invited_by_code,
      now,
      now
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create user');
  }

  return formatUser(res.rows[0]);
}

// 根据邮箱查找用户
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_users WHERE email = $1 AND status = 'active' LIMIT 1`,
    [email]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatUser(res.rows[0]);
}

// 根据UUID查找用户
export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_users WHERE uuid = $1 AND status = 'active' LIMIT 1`,
    [uuid]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatUser(res.rows[0]);
}

// 根据Clerk用户ID查找用户
export async function findUserByClerkId(clerkUserId: string): Promise<User | undefined> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_users WHERE clerk_user_id = $1 AND status = 'active' LIMIT 1`,
    [clerkUserId]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatUser(res.rows[0]);
}

// 根据邀请码查找用户
export async function findUserByInviteCode(inviteCode: string): Promise<User | undefined> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_users WHERE invite_code = $1 AND status = 'active' LIMIT 1`,
    [inviteCode]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatUser(res.rows[0]);
}

// 更新用户信息
export async function updateUser(uuid: string, updates: Partial<User>): Promise<User | undefined> {
  const db = getDb();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // 构建动态更新查询
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'uuid' && key !== 'created_at') {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    return findUserByUuid(uuid);
  }

  updateFields.push(`updated_at = $${paramIndex}`);
  values.push(new Date().toISOString());
  values.push(uuid);

  const query = `
    UPDATE ac_users 
    SET ${updateFields.join(', ')}
    WHERE uuid = $${paramIndex + 1} AND status = 'active'
    RETURNING *
  `;

  const res = await db.query(query, values);
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatUser(res.rows[0]);
}

// 更新用户积分
export async function updateUserCredits(uuid: string, newCredits: number): Promise<boolean> {
  const db = getDb();
  const res = await db.query(
    `UPDATE ac_users 
     SET credits = $1, updated_at = $2 
     WHERE uuid = $3 AND status = 'active'`,
    [newCredits, new Date().toISOString(), uuid]
  );

  return (res.rowCount || 0) > 0;
}

// 增加用户AI使用次数
export async function incrementUserAIUsage(uuid: string): Promise<boolean> {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  const res = await db.query(
    `UPDATE ac_users 
     SET daily_ai_usage = CASE 
       WHEN last_ai_usage_date = $1 THEN daily_ai_usage + 1 
       ELSE 1 
     END,
     last_ai_usage_date = $1,
     total_ai_usage = total_ai_usage + 1,
     updated_at = $2
     WHERE uuid = $3 AND status = 'active'`,
    [today, new Date().toISOString(), uuid]
  );

  return (res.rowCount || 0) > 0;
}

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
      (session_id, user_id, ip_address, user_agent, created_at, expires_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
    [
      sessionData.session_id,
      sessionData.user_id,
      sessionData.ip_address,
      sessionData.user_agent,
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

// 更新会话试用次数
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

// 清理过期会话
export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDb();
  const res = await db.query(
    `DELETE FROM ac_user_sessions WHERE expires_at <= NOW()`
  );

  return res.rowCount || 0;
}

// 格式化用户数据
function formatUser(row: any): User {
  return {
    id: row.id,
    uuid: row.uuid,
    clerk_user_id: row.clerk_user_id,
    email: row.email,
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    credits: row.credits,
    total_earned_credits: row.total_earned_credits,
    total_used_credits: row.total_used_credits,
    invite_code: row.invite_code,
    invited_by_code: row.invited_by_code,
    invited_by_user_id: row.invited_by_user_id,
    daily_ai_usage: row.daily_ai_usage,
    last_ai_usage_date: row.last_ai_usage_date,
    total_ai_usage: row.total_ai_usage,
    language: row.language,
    timezone: row.timezone,
    email_notifications: row.email_notifications,
    status: row.status,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// 格式化用户会话数据
function formatUserSession(row: any): UserSession {
  return {
    id: row.id,
    session_id: row.session_id,
    user_id: row.user_id,
    trial_usage_count: row.trial_usage_count,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    last_activity_at: row.last_activity_at,
    created_at: row.created_at,
    expires_at: row.expires_at
  };
}
