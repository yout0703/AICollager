import { DatabaseAdapter } from "@/lib/database-adapter";
import { v4 as uuidv4 } from 'uuid';
import { Invitation, CreateInvitationRequest } from "@/types/credits";

// 生成邀请码
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// 创建邀请记录
export async function createInvitation(request: CreateInvitationRequest): Promise<Invitation> {
  const db = new DatabaseAdapter(true);
  const uuid = uuidv4();
  const inviteCode = generateInviteCode();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天后过期

  const insertData = {
    uuid,
    inviter_id: request.inviter_id,
    invite_code: inviteCode,
    email: request.email,
    invitation_method: request.invitation_method || 'link',
    inviter_reward: request.inviter_reward || 10,
    invitee_reward: request.invitee_reward || 5,
    metadata: JSON.stringify(request.metadata || {}),
    created_at: now,
    expires_at: expiresAt
  };

  const result = await db.insert('ac_invitations', insertData);
  
  if (result.error) {
    throw new Error('Failed to create invitation: ' + result.error.message);
  }

  const insertedData = result.data?.[0] || result.rows?.[0];
  if (!insertedData) {
    throw new Error('Failed to create invitation');
  }

  return formatInvitation(insertedData);
}

// 根据邀请码查找邀请
export async function findInvitationByCode(inviteCode: string): Promise<Invitation | undefined> {
  const db = new DatabaseAdapter(true);
  
  // 使用原始查询处理复杂的 WHERE 条件
  const query = `
    SELECT * FROM ac_invitations 
    WHERE invite_code = $1 AND status = 'pending' AND expires_at > NOW() 
    LIMIT 1
  `;
  
  const result = await db.rawQuery(query, [inviteCode]);
  
  if (result.error) {
    throw new Error('Failed to find invitation by code: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatInvitation(rows[0]);
}

// 完成邀请（用户注册时调用）
export async function completeInvitation(
  inviteCode: string, 
  inviteeId: string
): Promise<{ success: boolean; invitation?: Invitation }> {
  const db = new DatabaseAdapter(true);
  
  try {
    return await db.transaction(async (transactionDb) => {
      // 更新邀请状态
      const updateQuery = `
        UPDATE ac_invitations 
        SET invitee_id = $1,
            status = 'completed',
            registered_at = NOW(),
            updated_at = NOW()
        WHERE invite_code = $2 AND status = 'pending' AND expires_at > NOW()
        RETURNING *
      `;
      
      const updateResult = await transactionDb.rawQuery(updateQuery, [inviteeId, inviteCode]);

      if (updateResult.error) {
        throw new Error('Failed to update invitation: ' + updateResult.error.message);
      }

      const rows = updateResult.data || updateResult.rows || [];
      if (rows.length === 0) {
        return { success: false };
      }

      const invitation = formatInvitation(rows[0]);
      return { success: true, invitation };
    });

  } catch (error) {
    console.error('Error completing invitation:', error);
    throw error;
  }
}

// 标记邀请点击
export async function markInvitationClicked(inviteCode: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    UPDATE ac_invitations 
    SET clicked_at = NOW(), updated_at = NOW() 
    WHERE invite_code = $1 AND status = 'pending' AND clicked_at IS NULL
  `;
  
  const result = await db.rawQuery(query, [inviteCode]);
  
  if (result.error) {
    throw new Error('Failed to mark invitation clicked: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 发放邀请奖励
export async function markInvitationRewardGiven(inviteCode: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    UPDATE ac_invitations 
    SET reward_given_at = NOW(), updated_at = NOW() 
    WHERE invite_code = $1 AND status = 'completed' AND reward_given_at IS NULL
  `;
  
  const result = await db.rawQuery(query, [inviteCode]);
  
  if (result.error) {
    throw new Error('Failed to mark invitation reward given: ' + result.error.message);
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
}

// 获取用户的邀请记录
export async function getUserInvitations(
  userId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<Invitation[]> {
  const db = new DatabaseAdapter(true);
  const result = await db.select('ac_invitations', {
    where: { inviter_id: userId },
    orderBy: 'created_at DESC',
    limit,
    offset
  });

  if (result.error) {
    throw new Error('Failed to get user invitations: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  return rows.map(formatInvitation);
}

// 获取用户邀请统计
export async function getUserInvitationStats(userId: string): Promise<{
  total: number;
  completed: number;
  pending: number;
  totalRewards: number;
}> {
  const db = new DatabaseAdapter(true);
  
  // 使用原始查询获取统计信息
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COALESCE(SUM(CASE WHEN status = 'completed' AND reward_given_at IS NOT NULL THEN inviter_reward ELSE 0 END), 0) as total_rewards
    FROM ac_invitations 
    WHERE inviter_id = $1
  `;
  
  const result = await db.rawQuery(query, [userId]);

  if (result.error) {
    throw new Error('Failed to get user invitation stats: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  const row = rows[0] || {};
  
  return {
    total: parseInt(row.total) || 0,
    completed: parseInt(row.completed) || 0,
    pending: parseInt(row.pending) || 0,
    totalRewards: parseInt(row.total_rewards) || 0
  };
}

// 清理过期邀请
export async function cleanupExpiredInvitations(): Promise<number> {
  const db = new DatabaseAdapter(true);
  
  // 使用原始查询更新过期邀请
  const query = `
    UPDATE ac_invitations 
    SET status = 'expired', updated_at = NOW() 
    WHERE status = 'pending' AND expires_at <= NOW()
    RETURNING uuid
  `;
  
  const result = await db.rawQuery(query);

  if (result.error) {
    throw new Error('Failed to cleanup expired invitations: ' + result.error.message);
  }

  return result.data?.length || result.rows?.length || 0;
}

// 检查邀请是否有效
export async function isInvitationValid(inviteCode: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    SELECT 1 FROM ac_invitations 
    WHERE invite_code = $1 AND status = 'pending' AND expires_at > NOW() 
    LIMIT 1
  `;
  
  const result = await db.rawQuery(query, [inviteCode]);

  if (result.error) {
    console.error('Failed to check invitation validity:', result.error);
    return false;
  }

  return (result.data?.length || result.rows?.length || 0) > 0;
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