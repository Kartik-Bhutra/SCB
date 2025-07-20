"use client";

import { createContext, useContext } from "react";

interface UserContextProps {
  adminType: boolean;
  userId: string;
  department: string;
}

export const AdminContext = createContext<UserContextProps>({
  adminType: false,
  userId: "",
  department: "",
});

export const useAdmin = () => useContext(AdminContext);
