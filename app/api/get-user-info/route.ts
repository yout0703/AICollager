import { findUserByEmail, createUser } from "@/lib/repositories/user";
import { respData, respErr } from "@/lib/resp";

import { currentUser } from "@clerk/nextjs/server";

export async function POST() {
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return respErr("not login");
  }

  try {
    const email = user.emailAddresses[0].emailAddress;
    const nickname = user.firstName || "";
    const avatarUrl = user.imageUrl;

    // 查找或创建用户
    let userInfo = await findUserByEmail(email);
    
    if (!userInfo) {
      // 创建新用户
      userInfo = await createUser({
        clerkUserId: user.id,
        email: email,
        displayName: nickname,
        avatarUrl: avatarUrl,
        inviteCode: Math.random().toString(36).substring(2, 12).toUpperCase()
      });
    }

    return respData(userInfo);
  } catch (e) {
    console.log("get user info failed", e);
    return respErr("get user info failed");
  }
}
