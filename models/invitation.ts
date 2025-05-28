import { Invitation, CreateInvitationRequest } from "@/types/credits";
import { getDb } from "@/models/db";
import { v4 as uuidv4 } from 'uuid';

// 生成邀请码
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// 创建邀请记录
export async function createInvitation(request: CreateInvitationRequest): Promise<Invitation> {
  const db = getDb();
  const uuid = uuidv4();
  const inviteCode = generateInviteCode();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天后过期

  const res = await db.query(
    `INSERT INTO ac_invitations 
      (uuid, inviter_id, invite_code, email, invitation_method, inviter_reward, invitee_reward, metadata, created_at, expires_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
    [
      uuid,
      request.inviter_id,
      inviteCode,
      request.email,
      request.invitation_method || 'link',
      request.inviter_reward || 20,
      request.invitee_reward || 20,
      JSON.stringify(request.metadata || {}),
      now,
      expiresAt
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create invitation');
  }

  return formatInvitation(res.rows[0]);
}

// 根据邀请码查找邀请
export async function findInvitationByCode(inviteCode: string): Promise<Invitation | undefined> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_invitations 
     WHERE invite_code = $1 AND status = 'pending' AND expires_at > NOW() 
     LIMIT 1`,
    [inviteCode]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatInvitation(res.rows[0]);
}

// 完成邀请（用户注册时调用）
export async function completeInvitation(
  inviteCode: string, 
  inviteeId: string
): Promise<{ success: boolean; invitation?: Invitation }> {
  const db = getDb();
  
  try {
    await db.query('BEGIN');

    // 更新邀请状态
    const updateRes = await db.query(
      `UPDATE ac_invitations 
       SET invitee_id = $1,
           status = 'completed',
           registered_at = NOW(),
           updated_at = NOW()
       WHERE invite_code = $2 AND status = 'pending' AND expires_at > NOW()
       RETURNING *`,
      [inviteeId, inviteCode]
    );

    if (updateRes.rowCount === 0) {
      await db.query('ROLLBACK');
      return { success: false };
    }

    const invitation = formatInvitation(updateRes.rows[0]);
    await db.query('COMMIT');
    
    return { success: true, invitation };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

// 标记邀请点击
export async function markInvitationClicked(inviteCode: string): Promise<boolean> {
  const db = getDb();
  const res = await db.query(
    `UPDATE ac_invitations 
     SET clicked_at = NOW(), updated_at = NOW() 
     WHERE invite_code = $1 AND status = 'pending' AND clicked_at IS NULL`,
    [inviteCode]
  );

  return (res.rowCount || 0) > 0;
}

// 发放邀请奖励
export async function markInvitationRewardGiven(inviteCode: string): Promise<boolean> {
  const db = getDb();
  const res = await db.query(
    `UPDATE ac_invitations 
     SET reward_given_at = NOW(), updated_at = NOW() 
     WHERE invite_code = $1 AND status = 'completed' AND reward_given_at IS NULL`,
    [inviteCode]
  );

  return (res.rowCount || 0) > 0;
}

// 获取用户的邀请记录
export async function getUserInvitations(
  userId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<Invitation[]> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_invitations 
     WHERE inviter_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return res.rows.map(formatInvitation);
}

// 获取用户邀请统计
export async function getUserInvitationStats(userId: string): Promise<{
  total: number;
  completed: number;
  pending: number;
  totalRewards: number;
}> {
  const db = getDb();
  const res = await db.query(
    `SELECT 
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
       COALESCE(SUM(CASE WHEN status = 'completed' AND reward_given_at IS NOT NULL THEN inviter_reward ELSE 0 END), 0) as total_rewards
     FROM ac_invitations 
     WHERE inviter_id = $1`,
    [userId]
  );

  const row = res.rows[0];
  return {
    total: parseInt(row.total) || 0,
    completed: parseInt(row.completed) || 0,
    pending: parseInt(row.pending) || 0,
    totalRewards: parseInt(row.total_rewards) || 0
  };
}

// 清理过期邀请
export async function cleanupExpiredInvitations(): Promise<number> {
  const db = getDb();
  const res = await db.query(
    `UPDATE ac_invitations 
     SET status = 'expired', updated_at = NOW() 
     WHERE status = 'pending' AND expires_at <= NOW()`
  );

  return res.rowCount || 0;
}

// 检查邀请是否有效
export async function isInvitationValid(inviteCode: string): Promise<boolean> {
  const db = getDb();
  const res = await db.query(
    `SELECT 1 FROM ac_invitations 
     WHERE invite_code = $1 AND status = 'pending' AND expires_at > NOW() 
     LIMIT 1`,
    [inviteCode]
  );

  return (res.rowCount || 0) > 0;
}

// 格式化邀请数据
function formatInvitation(row: any): Invitation {
  return {
    id: row.id,
    uuid: row.uuid,
    inviter_id: row.inviter_id,
    invitee_id: row.invitee_id,
    invite_code: row.invite_code,
    email: row.email,
    invitation_method: row.invitation_method,
    inviter_reward: row.inviter_reward,
    invitee_reward: row.invitee_reward,
    status: row.status,
    clicked_at: row.clicked_at,
    registered_at: row.registered_at,
    reward_given_at: row.reward_given_at,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at
  };
} 