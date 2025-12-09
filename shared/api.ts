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
  customCategories?: string[]; // Store custom categories for the group
}

export type SplitType = "equal" | "custom" | "percentage";

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  percentage?: number; // Only used for percentage split type
}

export type ExpenseCategory = 
  | 'food' 
  | 'travel' 
  | 'rent' 
  | 'shopping' 
  | 'groceries' 
  | 'utilities' 
  | 'entertainment' 
  | 'healthcare' 
  | 'transport' 
  | 'other' 
  | string; // Allow custom categories

export interface ExpenseBase {
  expenseId: string;
  groupId: string;
  paidBy: string;
  amount: number;
  description?: string;
  category: ExpenseCategory;
  splitType: SplitType;
  timestamp: string;
  splitDetails?: ExpenseSplit[]; // Made optional in base type
}

export interface Expense extends ExpenseBase {
  splitDetails: ExpenseSplit[]; // Required in the final type
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
