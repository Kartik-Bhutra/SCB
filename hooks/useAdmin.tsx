"use client";

import { createContext, useContext } from "react";

interface UserContextProps {
  adminType: boolean;
  userId: string;
}

export const AdminContext = createContext<UserContextProps>({
  adminType: false,
  userId: "",
});

export const useAdmin = () => useContext(AdminContext);
