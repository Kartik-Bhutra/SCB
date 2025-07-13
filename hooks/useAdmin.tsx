"use client";

import { createContext, useContext } from "react";

interface UserContextProps {
  role: boolean;
  userId: string;
}

export const AdminContext = createContext<UserContextProps>({
  role: false,
  userId: "",
});

export const useAdmin = () => useContext(AdminContext);
