import { ReactNode } from "react";
import { User } from "@/types/user";

// App Context 具体类型定义
export interface AppContextValue {
  user: User | null | undefined;
  fetchUserInfo: () => Promise<void>;
}

// 通用 Context Provider Props
export interface ContextProviderProps {
  children: ReactNode;
}

// 如果需要其他context可以继承这个基础类型
export interface BaseContextValue {
  [key: string]: any;
}
