export {
  createInvitation,
  findInvitationByCode,
  completeInvitation,
  getUserInvitations,
  getUserInvitationStats,
  cleanupExpiredInvitations
} from '@/lib/repositories/credits'

import { findInvitationByCode } from '@/lib/repositories/credits'

// 用于兼容性的别名
export { completeInvitation as markInvitationRewardGiven } from '@/lib/repositories/credits'

// 临时实现缺失的函数
export async function markInvitationClicked(_inviteCode: string): Promise<boolean> {
  console.warn('markInvitationClicked not implemented yet')
  return true
}

export async function isInvitationValid(inviteCode: string): Promise<boolean> {
  console.warn('isInvitationValid not implemented yet')
  // 使用已导出的函数
  const invitation = await findInvitationByCode(inviteCode)
  return invitation !== null
}
