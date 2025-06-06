import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { toastMessage } from '@/lib/toast';
import { ContextProviderProps, AppContextValue } from "@/types/context";

import { User } from "@/types/user";

export const AppContext = createContext({} as AppContextValue);

export const AppContextProvider = ({ children }: ContextProviderProps) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  // TODO: covers将被collages替代
  // const [covers, setCovers] = useState<Cover[] | null>(null);

  const fetchUserInfo = async function () {
    try {
      const uri = "/api/get-user-info";
      const params = {};

      const resp = await fetch(uri, {
        method: "POST",
        body: JSON.stringify(params),
      });

      if (resp.ok) {
        const res = await resp.json();
        if (res.data) {
          setUser(res.data);
          return;
        }
      }

      setUser(null);
    } catch (e) {
      setUser(null);

      console.log("get user info failed: ", e);
      toastMessage("get user info failed", 'error');
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <AppContext.Provider value={{ user, fetchUserInfo }}>
      {children}
    </AppContext.Provider>
  );
};
