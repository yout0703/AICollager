import { CreditTransaction, Invitation, CreditOperationRequest, CreateInvitationRequest } from "@/types/credits";
import { DatabaseAdapter } from "@/lib/database-adapter";
import { v4 as uuidv4 } from 'uuid';

// 生成邀请码
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// 创建积分交易记录
export async function createCreditTransaction(
  request: CreditOperationRequest & { balance_after: number }
): Promise<CreditTransaction> {
  const db = new DatabaseAdapter(true);
  const uuid = uuidv4();
  const now = new Date().toISOString();

  const insertData = {
    uuid,
    user_id: request.user_id,
    amount: request.amount,
    balance_after: request.balance_after,
    transaction_type: request.transaction_type,
    title: request.title,
    description: request.description,
    related_entity_type: request.related_entity_type,
    related_entity_id: request.related_entity_id,
    metadata: JSON.stringify(request.metadata || {}),
    created_at: now
  };

  const result = await db.insert('ac_credit_transactions', insertData);
  
  if (result.error) {
    throw new Error('Failed to create credit transaction: ' + result.error.message);
  }

  const insertedData = result.data?.[0] || result.rows?.[0];
  if (!insertedData) {
    throw new Error('Failed to create credit transaction');
  }

  return formatCreditTransaction(insertedData);
}

// 获取用户积分交易历史
export async function getUserCreditTransactions(
  userId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<CreditTransaction[]> {
  const db = new DatabaseAdapter(true);
  
  const result = await db.select('ac_credit_transactions', {
    where: { user_id: userId },
    orderBy: 'created_at DESC',
    limit,
    offset
  });

  if (result.error) {
    throw new Error('Failed to get user credit transactions: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  return rows.map(formatCreditTransaction);
}

// 获取用户积分余额
export async function getUserCreditsBalance(userId: string): Promise<number> {
  const db = new DatabaseAdapter(true);
  
  const result = await db.select('ac_users', {
    select: 'credits',
    where: { uuid: userId, status: 'active' }
  });

  if (result.error) {
    throw new Error('Failed to get user credits balance: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return 0;
  }

  return rows[0].credits || 0;
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
  const db = new DatabaseAdapter(true);
  
  try {
    // 使用事务处理
    return await db.transaction(async (transactionDb) => {
      // 检查并更新用户积分
      const updateQuery = `
        UPDATE ac_users 
        SET credits = credits - $1, 
            total_used_credits = total_used_credits + $1,
            updated_at = NOW()
        WHERE uuid = $2 AND status = 'active' AND credits >= $1
        RETURNING credits
      `;
      
      const updateResult = await transactionDb.rawQuery(updateQuery, [amount, userId]);

      if (updateResult.error) {
        throw new Error('Failed to update user credits: ' + updateResult.error.message);
      }

      const rows = updateResult.data || updateResult.rows || [];
      if (rows.length === 0) {
        return { success: false, newBalance: 0 };
      }

      const newBalance = rows[0].credits;

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

      return { success: true, newBalance, transaction };
    });

  } catch (error) {
    console.error('Error deducting user credits:', error);
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
  const db = new DatabaseAdapter(true);
  
  try {
    // 使用事务处理
    return await db.transaction(async (transactionDb) => {
      // 更新用户积分
      const updateQuery = `
        UPDATE ac_users 
        SET credits = credits + $1, 
            total_earned_credits = total_earned_credits + $1,
            updated_at = NOW()
        WHERE uuid = $2 AND status = 'active'
        RETURNING credits
      `;
      
      const updateResult = await transactionDb.rawQuery(updateQuery, [amount, userId]);

      if (updateResult.error) {
        throw new Error('Failed to update user credits: ' + updateResult.error.message);
      }

      const rows = updateResult.data || updateResult.rows || [];
      if (rows.length === 0) {
        return { success: false, newBalance: 0 };
      }

      const newBalance = rows[0].credits;

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

      return { success: true, newBalance, transaction };
    });

  } catch (error) {
    console.error('Error adding user credits:', error);
    throw error;
  }
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
    invite_code: inviteCode,
    inviter_id: request.inviter_id,
    email: request.email,
    invitation_method: request.invitation_method || 'link',
    inviter_reward: request.inviter_reward || 10,
    invitee_reward: request.invitee_reward || 5,
    status: 'pending' as const,
    metadata: JSON.stringify(request.metadata || {}),
    expires_at: expiresAt,
    created_at: now,
    updated_at: now
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

// 根据邀请码查找邀请记录
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

// 完成邀请（用户注册后调用）
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
      const rewardQuery = `UPDATE ac_invitations SET reward_given_at = NOW() WHERE uuid = $1`;
      await transactionDb.rawQuery(rewardQuery, [invitation.uuid]);

      return { success: true, invitation };
    });

  } catch (error) {
    console.error('Error completing invitation:', error);
    throw error;
  }
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
      COALESCE(SUM(CASE WHEN status = 'completed' THEN inviter_reward ELSE 0 END), 0) as total_rewards
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