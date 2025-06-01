import { CreditTransaction, Invitation, CreditOperationRequest, CreateInvitationRequest } from "@/types/credits";
import { getDb } from "@/models/db";
import { v4 as uuidv4 } from 'uuid';

// 生成邀请码
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// 创建积分交易记录
export async function createCreditTransaction(
  request: CreditOperationRequest & { balance_after: number }
): Promise<CreditTransaction> {
  const db = getDb();
  const uuid = uuidv4();
  const now = new Date().toISOString();

  const res = await db.query(
    `INSERT INTO ac_credit_transactions 
      (uuid, user_id, amount, balance_after, transaction_type, title, description, related_entity_type, related_entity_id, metadata, created_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
    [
      uuid,
      request.user_id,
      request.amount,
      request.balance_after,
      request.transaction_type,
      request.title,
      request.description,
      request.related_entity_type,
      request.related_entity_id,
      JSON.stringify(request.metadata || {}),
      now
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create credit transaction');
  }

  return formatCreditTransaction(res.rows[0]);
}

// 获取用户积分交易历史
export async function getUserCreditTransactions(
  userId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<CreditTransaction[]> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM ac_credit_transactions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return res.rows.map(formatCreditTransaction);
}

// 获取用户积分余额
export async function getUserCreditsBalance(userId: string): Promise<number> {
  const db = getDb();
  const res = await db.query(
    `SELECT credits FROM ac_users WHERE uuid = $1 AND status = 'active'`,
    [userId]
  );

  if (res.rowCount === 0) {
    return 0;
  }

  return res.rows[0].credits || 0;
}

// 扣除用户积分（原子操作）
export async function deductUserCredits(
  userId: string, 
  amount: number, 
  transactionType: CreditTransaction['transaction_type'],
  title?: string,
  description?: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; transaction?: CreditTransaction }> {
  const db = getDb();
  
  try {
    await db.query('BEGIN');

    // 检查并更新用户积分
    const updateRes = await db.query(
      `UPDATE ac_users 
       SET credits = credits - $1, 
           total_used_credits = total_used_credits + $1,
           updated_at = NOW()
       WHERE uuid = $2 AND status = 'active' AND credits >= $1
       RETURNING credits`,
      [amount, userId]
    );

    if (updateRes.rowCount === 0) {
      await db.query('ROLLBACK');
      return { success: false, newBalance: 0 };
    }

    const newBalance = updateRes.rows[0].credits;

    // 创建交易记录
    const transaction = await createCreditTransaction({
      user_id: userId,
      amount: -amount,
      balance_after: newBalance,
      transaction_type: transactionType,
      title,
      description,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      metadata
    });

    await db.query('COMMIT');
    return { success: true, newBalance, transaction };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

// 增加用户积分（原子操作）
export async function addUserCredits(
  userId: string, 
  amount: number, 
  transactionType: CreditTransaction['transaction_type'],
  title?: string,
  description?: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; transaction?: CreditTransaction }> {
  const db = getDb();
  
  try {
    await db.query('BEGIN');

    // 更新用户积分
    const updateRes = await db.query(
      `UPDATE ac_users 
       SET credits = credits + $1, 
           total_earned_credits = total_earned_credits + $1,
           updated_at = NOW()
       WHERE uuid = $2 AND status = 'active'
       RETURNING credits`,
      [amount, userId]
    );

    if (updateRes.rowCount === 0) {
      await db.query('ROLLBACK');
      return { success: false, newBalance: 0 };
    }

    const newBalance = updateRes.rows[0].credits;

    // 创建交易记录
    const transaction = await createCreditTransaction({
      user_id: userId,
      amount: amount,
      balance_after: newBalance,
      transaction_type: transactionType,
      title,
      description,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      metadata
    });

    await db.query('COMMIT');
    return { success: true, newBalance, transaction };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
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
      (uuid, inviter_id, invite_code, email, invitation_method, metadata, created_at, updated_at, expires_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
    [
      uuid,
      request.inviter_id,
      inviteCode,
      request.email,
      request.invitation_method || 'link',
      JSON.stringify(request.metadata || {}),
      now,
      now,
      expiresAt
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create invitation');
  }

  return formatInvitation(res.rows[0]);
}

// 根据邀请码查找邀请记录
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

// 完成邀请（用户注册后调用）
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

    // 给邀请人和被邀请人发放积分奖励
    await addUserCredits(
      invitation.inviter_id,
      invitation.inviter_reward,
      'invite',
      '邀请奖励',
      `成功邀请用户注册获得 ${invitation.inviter_reward} 积分`,
      'invitation',
      invitation.uuid
    );

    await addUserCredits(
      inviteeId,
      invitation.invitee_reward,
      'invite',
      '注册奖励',
      `通过邀请注册获得 ${invitation.invitee_reward} 积分`,
      'invitation',
      invitation.uuid
    );

    // 更新奖励发放时间
    await db.query(
      `UPDATE ac_invitations SET reward_given_at = NOW() WHERE uuid = $1`,
      [invitation.uuid]
    );

    await db.query('COMMIT');
    return { success: true, invitation };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
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
       COALESCE(SUM(CASE WHEN status = 'completed' THEN inviter_reward ELSE 0 END), 0) as total_rewards
     FROM ac_invitations 
     WHERE inviter_id = $1`,
    [userId]
  );

  const row = res.rows[0];
  return {
    total: parseInt(row.total),
    completed: parseInt(row.completed),
    pending: parseInt(row.pending),
    totalRewards: parseInt(row.total_rewards)
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

// 格式化积分交易数据
function formatCreditTransaction(row: any): CreditTransaction {
  let metadata = undefined;
  if (row.metadata) {
    if (typeof row.metadata === 'string') {
      try {
        metadata = JSON.parse(row.metadata);
      } catch (e) {
        console.warn('Failed to parse metadata as JSON:', e);
        metadata = undefined;
      }
    } else if (typeof row.metadata === 'object') {
      metadata = row.metadata;
    }
  }

  return {
    id: row.id,
    uuid: row.uuid,
    user_id: row.user_id,
    amount: row.amount,
    balance_after: row.balance_after,
    transaction_type: row.transaction_type,
    title: row.title,
    description: row.description,
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    metadata: metadata,
    created_at: row.created_at
  };
}

// 格式化邀请数据
function formatInvitation(row: any): Invitation {
  let metadata = undefined;
  if (row.metadata) {
    if (typeof row.metadata === 'string') {
      try {
        metadata = JSON.parse(row.metadata);
      } catch (e) {
        console.warn('Failed to parse invitation metadata as JSON:', e);
        metadata = undefined;
      }
    } else if (typeof row.metadata === 'object') {
      metadata = row.metadata;
    }
  }

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
    metadata: metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at
  };
} 