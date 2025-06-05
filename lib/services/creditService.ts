import { CreditTransaction } from "@/db/schema/credits";
import {
  createCreditTransaction,
  getUserCreditTransactions,
  getUserCreditsBalance,
  deductUserCredits,
  addUserCredits
} from "@/lib/repositories/credits";

// 查询用户积分余额
export async function getUserBalance(userId: string): Promise<{
  balance: number;
  success: boolean;
}> {
  try {
    const balance = await getUserCreditsBalance(userId);
    return { balance, success: true };
    
  } catch (error) {
    console.error('Get user balance failed:', error);
    return { balance: 0, success: false };
  }
}

// 消耗积分（拼图、下载等）
export async function consumeCredits(params: {
  userId: string;
  amount: number;
  purpose: 'collage' | 'download' | 'premium_template';
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  newBalance: number;
  message?: string;
  transaction?: CreditTransaction;
}> {
  try {
    const { userId, amount, purpose, relatedEntityId, metadata } = params;
    
    // 根据用途生成标题和描述
    const titleMap = {
      collage: 'AI拼图生成',
      download: '高清图片下载',
      premium_template: '高级模板使用'
    };
    
    const descriptionMap = {
      collage: '使用AI生成拼图',
      download: '下载高清拼图图片',
      premium_template: '使用高级拼图模板'
    };
    
    const result = await deductUserCredits(userId, amount, purpose);
    
    if (!result.success) {
      return {
        success: false,
        newBalance: result.newBalance,
        message: '积分余额不足'
      };
    }
    
    // 创建积分交易记录
    const transaction = await createCreditTransaction({
      userId,
      amount: -amount,
      transactionType: 'spent',
      title: titleMap[purpose],
      description: descriptionMap[purpose],
      relatedEntityType: purpose === 'collage' ? 'collage' : purpose === 'download' ? 'collage' : 'template',
      relatedEntityId: relatedEntityId,
      metadata: metadata || {}
    });
    
    return {
      success: true,
      newBalance: result.newBalance,
      transaction
    };
    
  } catch (error) {
    console.error('Consume credits failed:', error);
    return {
      success: false,
      newBalance: 0,
      message: '扣除积分失败'
    };
  }
}

// 获得积分（邀请奖励、系统赠送等）
export async function earnCredits(params: {
  userId: string;
  amount: number;
  reason: 'invite' | 'register' | 'admin_adjust' | 'promotion';
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  newBalance: number;
  message?: string;
  transaction?: CreditTransaction;
}> {
  try {
    const { userId, amount, reason, relatedEntityId, metadata } = params;
    
    // 根据原因生成标题和描述
    const titleMap = {
      invite: '邀请奖励',
      register: '注册奖励',
      admin_adjust: '系统调整',
      promotion: '活动奖励'
    };
    
    const descriptionMap = {
      invite: '成功邀请好友获得奖励',
      register: '新用户注册奖励',
      admin_adjust: '管理员调整积分',
      promotion: '参与活动获得奖励'
    };
    
    const result = await addUserCredits(
      userId,
      amount,
      reason,
      titleMap[reason],
      descriptionMap[reason],
      reason === 'invite' ? 'invitation' : reason,
      relatedEntityId
    );
    
    // 创建积分交易记录
    const transaction = await createCreditTransaction({
      userId,
      amount,
      transactionType: 'earned',
      title: titleMap[reason],
      description: descriptionMap[reason],
      relatedEntityType: reason === 'invite' ? 'invitation' : reason,
      relatedEntityId: relatedEntityId,
      metadata: metadata || {}
    });
    
    return {
      success: result.success,
      newBalance: result.newBalance,
      transaction
    };
    
  } catch (error) {
    console.error('Earn credits failed:', error);
    return {
      success: false,
      newBalance: 0,
      message: '积分发放失败'
    };
  }
}

// 检查积分是否足够
export async function checkCreditsAvailable(userId: string, requiredAmount: number): Promise<{
  available: boolean;
  currentBalance: number;
  shortfall?: number;
}> {
  try {
    const balance = await getUserCreditsBalance(userId);
    
    return {
      available: balance >= requiredAmount,
      currentBalance: balance,
      shortfall: balance < requiredAmount ? requiredAmount - balance : undefined
    };
    
  } catch (error) {
    console.error('Check credits available failed:', error);
    return {
      available: false,
      currentBalance: 0,
      shortfall: requiredAmount
    };
  }
}

// 获取用户积分流水
export async function getUserTransactionHistory(
  userId: string, 
  options: {
    limit?: number;
    offset?: number;
    type?: 'earned' | 'spent';
  } = {}
): Promise<{
  transactions: CreditTransaction[];
  total: number;
  success: boolean;
}> {
  try {
    const { limit = 20, offset = 0 } = options;
    
    const transactions = await getUserCreditTransactions(userId);
    
    // 如果需要过滤类型
    const filteredTransactions = options.type 
      ? transactions.filter(t => t.transactionType === options.type)
      : transactions;
    
    // 转换类型格式
    const formattedTransactions: CreditTransaction[] = filteredTransactions.map(t => ({
      id: t.id,
      uuid: t.uuid,
      userId: t.userId,
      amount: t.amount,
      balanceAfter: 0, // 临时值，实际应该从数据库获取
      transactionType: t.transactionType as any,
      title: t.title,
      description: t.description,
      relatedEntityType: t.relatedEntityType as any,
      relatedEntityId: t.relatedEntityId,
      metadata: t.metadata as any,
      createdAt: new Date(t.createdAt)
    }));
    
    return {
      transactions: formattedTransactions,
      total: filteredTransactions.length,
      success: true
    };
    
  } catch (error) {
    console.error('Get user transaction history failed:', error);
    return {
      transactions: [],
      total: 0,
      success: false
    };
  }
}

// 获取积分统计信息
export async function getUserCreditStats(userId: string): Promise<{
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  transactionCount: number;
  success: boolean;
}> {
  try {
    const [balance, transactions] = await Promise.all([
      getUserCreditsBalance(userId),
      getUserCreditTransactions(userId) // 获取较多记录用于统计
    ]);
    
    const totalEarned = transactions
      .filter(t => t.transactionType === 'earned')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = Math.abs(transactions
      .filter(t => t.transactionType === 'spent')
      .reduce((sum, t) => sum + t.amount, 0));
    
    return {
      currentBalance: balance,
      totalEarned,
      totalSpent,
      transactionCount: transactions.length,
      success: true
    };
    
  } catch (error) {
    console.error('Get user credit stats failed:', error);
    return {
      currentBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactionCount: 0,
      success: false
    };
  }
}

// 预检积分消费（用于前端提示）
export async function preCheckConsumption(userId: string, purpose: 'collage' | 'download' | 'premium_template'): Promise<{
  canConsume: boolean;
  currentBalance: number;
  requiredAmount: number;
  message?: string;
}> {
  try {
    // 定义各功能的积分消费
    const costMap = {
      collage: 5,
      download: 10,
      premium_template: 15
    };
    
    const requiredAmount = costMap[purpose];
    const balance = await getUserCreditsBalance(userId);
    
    return {
      canConsume: balance >= requiredAmount,
      currentBalance: balance,
      requiredAmount,
      message: balance < requiredAmount ? `积分不足，还需要 ${requiredAmount - balance} 积分` : undefined
    };
    
  } catch (error) {
    console.error('Pre-check consumption failed:', error);
    return {
      canConsume: false,
      currentBalance: 0,
      requiredAmount: 0,
      message: '检查失败'
    };
  }
} 