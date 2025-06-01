import { User, UserSession, CreateUserRequest } from "@/types/user";
import { DatabaseAdapter } from "@/lib/database-adapter";
import { v4 as uuidv4 } from 'uuid';

// 生成邀请码
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// 创建用户
export async function createUser(userData: CreateUserRequest): Promise<User> {
  const db = new DatabaseAdapter(true);
  const inviteCode = generateInviteCode();
  const now = new Date().toISOString();
  
  const insertData = {
    clerk_user_id: userData.clerk_user_id,
    email: userData.email,
    username: userData.username,
    display_name: userData.display_name,
    avatar_url: userData.avatar_url,
    invite_code: inviteCode,
    invited_by_code: userData.invited_by_code,
    created_at: now,
    updated_at: now
  };

  const result = await db.insert('ac_users', insertData);
  
  if (result.error) {
    throw new Error('Failed to create user: ' + result.error.message);
  }

  const insertedData = result.data?.[0] || result.rows?.[0];
  if (!insertedData) {
    throw new Error('Failed to create user');
  }

  return formatUser(insertedData);
}

// 根据邮箱查找用户
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = new DatabaseAdapter(true);
  const result = await db.select('ac_users', {
    where: { email, status: 'active' },
    limit: 1
  });
  
  if (result.error) {
    throw new Error('Failed to find user by email: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatUser(rows[0]);
}

// 根据UUID查找用户
export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  const db = new DatabaseAdapter(true);
  const result = await db.select('ac_users', {
    where: { uuid, status: 'active' },
    limit: 1
  });
  
  if (result.error) {
    throw new Error('Failed to find user by UUID: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatUser(rows[0]);
}

// 根据Clerk用户ID查找用户
export async function findUserByClerkId(clerkUserId: string): Promise<User | undefined> {
  const db = new DatabaseAdapter(true);
  const result = await db.select('ac_users', {
    where: { clerk_user_id: clerkUserId, status: 'active' },
    limit: 1
  });
  
  if (result.error) {
    throw new Error('Failed to find user by Clerk ID: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatUser(rows[0]);
}

// 根据邀请码查找用户
export async function findUserByInviteCode(inviteCode: string): Promise<User | undefined> {
  const db = new DatabaseAdapter(true);
  const result = await db.select('ac_users', {
    where: { invite_code: inviteCode, status: 'active' },
    limit: 1
  });
  
  if (result.error) {
    throw new Error('Failed to find user by invite code: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatUser(rows[0]);
}

// 更新用户信息
export async function updateUser(uuid: string, updates: Partial<User>): Promise<User | undefined> {
  const db = new DatabaseAdapter(true);
  const updateData: Record<string, any> = {};

  // 构建更新数据
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'uuid' && key !== 'created_at') {
      updateData[key] = value;
    }
  });

  if (Object.keys(updateData).length === 0) {
    return findUserByUuid(uuid);
  }

  updateData.updated_at = new Date().toISOString();

  const result = await db.update('ac_users', updateData, { uuid, status: 'active' });
  
  if (result.error) {
    throw new Error('Failed to update user: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatUser(rows[0]);
}

// 更新用户积分
export async function updateUserCredits(uuid: string, newCredits: number): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  const result = await db.update('ac_users', {
    credits: newCredits,
    updated_at: new Date().toISOString()
  }, { uuid, status: 'active' });

  if (result.error) {
    throw new Error('Failed to update user credits: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 增加用户AI使用次数
export async function incrementUserAIUsage(uuid: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  const today = new Date().toISOString().split('T')[0];
  
  // 使用原始查询处理复杂的更新逻辑
  const query = `
    UPDATE ac_users 
    SET daily_ai_usage = CASE 
      WHEN last_ai_usage_date = $1 THEN daily_ai_usage + 1 
      ELSE 1 
    END,
    last_ai_usage_date = $1,
    total_ai_usage = total_ai_usage + 1,
    updated_at = $2
    WHERE uuid = $3 AND status = 'active'
  `;
  
  const result = await db.rawQuery(query, [today, new Date().toISOString(), uuid]);

  if (result.error) {
    throw new Error('Failed to increment user AI usage: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

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
  const result = await db.select('ac_user_sessions', {
    where: { session_id: sessionId },
    limit: 1
  });
  
  if (result.error) {
    throw new Error('Failed to find user session: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatUserSession(rows[0]);
}

// 增加会话试用次数
export async function incrementSessionTrialUsage(sessionId: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  const result = await db.update('ac_user_sessions', {
    trial_usage: db.rawQuery('trial_usage + 1', []),
    updated_at: new Date().toISOString()
  }, { session_id: sessionId });

  if (result.error) {
    // 使用原始查询处理
    const query = `
      UPDATE ac_user_sessions 
      SET trial_usage = trial_usage + 1, updated_at = $1
      WHERE session_id = $2
    `;
    
    const rawResult = await db.rawQuery(query, [new Date().toISOString(), sessionId]);
    
    if (rawResult.error) {
      throw new Error('Failed to increment session trial usage: ' + rawResult.error.message);
    }

    return (rawResult.data?.length || rawResult.rows?.length || 0) > 0;
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 清理过期会话
export async function cleanupExpiredSessions(): Promise<number> {
  const db = new DatabaseAdapter(true);
  
  // 使用原始查询删除过期会话
  const query = `
    DELETE FROM ac_user_sessions 
    WHERE expires_at < NOW()
    RETURNING session_id
  `;
  
  const result = await db.rawQuery(query);
  
  if (result.error) {
    throw new Error('Failed to cleanup expired sessions: ' + result.error.message);
  }

  return result.data?.length || result.rows?.length || 0;
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
