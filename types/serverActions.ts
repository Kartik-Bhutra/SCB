import { ReactNode } from "react";

export interface serverActionState {
  success: boolean;
  error: string;
}
export interface blockedData {
  MNE: string;
  createdAt: Date;
  blockedBy: string;
}

export interface clientData {
  MNE: string;
  username: string;
}

export interface ids {
  id: number;
}

export interface forChildren {
  children: ReactNode;
}
