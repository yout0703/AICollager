import { findUserByEmail, createUser } from "@/models/user";
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
        clerk_user_id: user.id,
        email: email,
        display_name: nickname,
        avatar_url: avatarUrl
      });
    }

    return respData(userInfo);
  } catch (e) {
    console.log("get user info failed", e);
    return respErr("get user info failed");
  }
}
