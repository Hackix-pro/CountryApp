/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
 
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

export interface Member {
  memberId: string;
  name: string;
  mobile: string;
  upiId?: string;
}

export interface Group {
  groupId: string;
  groupName: string;
  description?: string;
  baseCurrency: "INR";
  members: Member[];
}

export interface Expense {
  expenseId: string;
  groupId: string;
  paidBy: string;
  amount: number;
  description?: string;
  splitType: "equal";
  timestamp: string;
}

export interface MemberBalance {
  memberId: string;
  paid: number;
  shouldPay: number;
  balance: number;
}

export interface SettlementPair {
  from: string;
  to: string;
  amount: number;
  upiLink: string;
}
