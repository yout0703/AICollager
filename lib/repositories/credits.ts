import { db } from '@/db/client'
import { creditTransactions, invitations, type CreditTransaction, type NewCreditTransaction, type Invitation, type NewInvitation } from '@/db/schema/credits'
import { eq, and, lt, desc, sql, count, inArray } from 'drizzle-orm'
import { createHash } from 'crypto'

// Credits 相关函数
export async function createCreditTransaction(data: Partial<CreditTransaction>): Promise<CreditTransaction> {
    const newCreditTransaction: NewCreditTransaction = {
      userId: data.userId || '',
      amount: data.amount || 0,
      balanceAfter: data.balanceAfter || 0,
      transactionType: data.transactionType || '',
      title: data.title || '',
      description: data.description || '',
      relatedEntityType: data.relatedEntityType || '',
      relatedEntityId: data.relatedEntityId || '',
      metadata: data.metadata || {}
  }

  const [result] = await db
    .insert(creditTransactions)
    .values(newCreditTransaction)
    .returning()
    return result
  }

  export async function getUserCreditTransactions(userId: string, options?: any): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
}

export async function getUserCreditsBalance(userId: string): Promise<number> {
  const [result] = await db
    .select({ balance: sql<number>`SUM(${creditTransactions.amount})` })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .limit(1)
    
  return result?.balance || 0
}

export async function deductUserCredits(userId: string, amount: number, reason?: string): Promise<{ success: boolean; newBalance: number }> {
  const [result] = await db
    .update(creditTransactions)
    .set({ amount: sql<number>`${creditTransactions.amount} - ${amount}` })
    .where(eq(creditTransactions.userId, userId))
    .returning()
    
  return { success: !!result, newBalance: result?.balanceAfter || 0 }
}

export async function addUserCredits(userId: string, amount: number, type?: string, reason?: string, description?: string, source?: string, referenceId?: string): Promise<{ success: boolean; newBalance: number }> {
  const [result] = await db
    .update(creditTransactions)
    .set({ amount: sql<number>`${creditTransactions.amount} + ${amount}` })
    .where(eq(creditTransactions.userId, userId))
    .returning()
    
  return { success: !!result, newBalance: result?.balanceAfter || 0 }
}

// Invitation 相关函数
export async function createInvitation(data: Partial<Invitation>): Promise<Invitation> {
  const newInvitation: NewInvitation = {
    inviteCode: data.inviteCode || Math.random().toString(36).substring(7),
    inviterId: data.inviterId || '',
    inviterReward: data.inviterReward || 10,
    inviteeReward: data.inviteeReward || 10,
    status: 'pending',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
    email: data.email,
    invitationMethod: data.invitationMethod || 'link',
    metadata: data.metadata || {}
  }

  const [result] = await db
    .insert(invitations)
    .values(newInvitation)
    .returning()
    
  return result
}

export async function findInvitationByCode(inviteCode: string): Promise<Invitation | null> {
  const [result] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.inviteCode, inviteCode))
    .limit(1)
    
  return result || null
}

export async function completeInvitation(inviteCode: string, inviteeId: string): Promise<{ success: boolean; invitation?: Invitation }> {
  const [result] = await db
    .update(invitations)
    .set({ 
      status: 'completed', 
      registeredAt: new Date(), 
      inviteeId: inviteeId 
    })
    .where(eq(invitations.inviteCode, inviteCode))
    .returning()
    
  return { success: !!result, invitation: result || undefined }
}

export async function getUserInvitations(userId: string): Promise<Invitation[]> {
  return await db
    .select()
    .from(invitations)
    .where(eq(invitations.inviterId, userId))
    .orderBy(desc(invitations.createdAt))
}

export async function getUserInvitationStats(userId: string): Promise<{
  totalInvitations: number;
  completedInvitations: number;
  totalRewardsEarned: number;
}> {
  console.warn('getUserInvitationStats not implemented yet')
  return {
    totalInvitations: 0,
    completedInvitations: 0,
    totalRewardsEarned: 0
  }
}

export async function cleanupExpiredInvitations(): Promise<number> {
  console.warn('cleanupExpiredInvitations not implemented yet')
  return 0
} 