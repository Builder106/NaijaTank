export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  reputationScore: number; // 1-100
  reportCount: number;
  createdAt: string; // ISO date string
  lastLogin: string; // ISO date string
}