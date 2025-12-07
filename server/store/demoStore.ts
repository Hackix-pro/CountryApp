import { Member, Group, Expense, MemberBalance, SettlementPair } from "@shared/api";

// In-memory demo state
interface DemoState {
  users: { userId: string; name: string; mobile: string }[];
  groups: Group[];
  expenses: Expense[];
  counters: Record<string, number>;
}

const state: DemoState = {
  users: [],
  groups: [],
  expenses: [],
  counters: { user: 3, member: 3, group: 1, expense: 2 },
};

function nextId(prefix: string) {
  state.counters[prefix] = (state.counters[prefix] || 0) + 1;
  return `${prefix}${state.counters[prefix]}`;
}

function seedDemo() {
  state.users = [
    { userId: "u1", name: "Demo User", mobile: "9999999999" },
    { userId: "u2", name: "Alice", mobile: "8888888888" },
    { userId: "u3", name: "Bob", mobile: "7777777777" },
  ];

  const members: Member[] = [
    { memberId: "u1", name: "Demo User", mobile: "9999999999", upiId: "DEMO_UPI@upi" },
    { memberId: "u2", name: "Alice", mobile: "8888888888", upiId: "ALICE_UPI@upi" },
    { memberId: "u3", name: "Bob", mobile: "7777777777", upiId: "BOB_UPI@upi" },
  ];

  state.groups = [
    {
      groupId: "g1",
      groupName: "Demo Group",
      description: "A demo FairSplit group",
      baseCurrency: "INR",
      members,
    },
  ];

  state.expenses = [
    {
      expenseId: "e1",
      groupId: "g1",
      paidBy: "u1",
      amount: 600,
      description: "Dinner",
      splitType: "equal",
      timestamp: new Date().toISOString(),
    },
    {
      expenseId: "e2",
      groupId: "g1",
      paidBy: "u2",
      amount: 300,
      description: "Snacks",
      splitType: "equal",
      timestamp: new Date().toISOString(),
    },
  ];

  state.counters = { user: 3, member: 3, group: 1, expense: 2 };
}

seedDemo();

export function resetDemo() {
  seedDemo();
}

export function getUserByMobile(mobile: string) {
  return state.users.find((u) => u.mobile === mobile) || null;
}

export function getDemoUser() {
  return state.users.find((u) => u.userId === "u1")!;
}

export function addGroup(input: { groupName: string; description?: string; baseCurrency?: "INR"; members?: Omit<Member, "memberId">[] }) {
  const groupId = `g${nextId("group_")}`.replace("group_", "");
  const baseCurrency: "INR" = "INR";
  const baseMembers = (input.members && input.members.length
    ? input.members
    : state.users.map((u) => ({ memberId: u.userId, name: u.name, mobile: u.mobile, upiId: `${u.name.toUpperCase().split(" ").join("_")}_UPI@upi` }))
  );
  const members: Member[] = baseMembers.map((m: any) => {
    const memberId: string = typeof m.memberId === "string" && m.memberId.length
      ? m.memberId
      : `u${nextId("member_")}`.replace("member_", "");
    return { name: m.name, mobile: m.mobile, upiId: m.upiId, memberId } as Member;
  });

  const group: Group = {
    groupId,
    groupName: input.groupName,
    description: input.description,
    baseCurrency,
    members,
  };
  state.groups.push(group);
  return group;
}

export function getGroup(groupId: string) {
  return state.groups.find((g) => g.groupId === groupId) || null;
}

export function addMemberToGroup(groupId: string, member: Omit<Member, "memberId">) {
  const group = getGroup(groupId);
  if (!group) return null;
  const newMember: Member = { ...member, memberId: `u${nextId("member_")}`.replace("member_", "") };
  group.members.push(newMember);
  return newMember;
}

export function removeMemberFromGroup(groupId: string, memberId: string) {
  const group = getGroup(groupId);
  if (!group) return { ok: false, reason: "Group not found" } as const;
  const used = state.expenses.some((e) => e.groupId === groupId && e.paidBy === memberId);
  if (used) return { ok: false, reason: "Member has expenses and cannot be removed in demo" } as const;
  const before = group.members.length;
  group.members = group.members.filter((m) => m.memberId !== memberId);
  return { ok: group.members.length < before } as const;
}

export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "expenseId" | "groupId" | "splitType" | "timestamp"> & { timestamp?: string; splitType?: "equal" }) {
  const group = getGroup(groupId);
  if (!group) return null;
  if (!group.members.some((m) => m.memberId === expense.paidBy)) return null;
  const expenseId = `e${nextId("expense_")}`.replace("expense_", "");
  const newExpense: Expense = {
    expenseId,
    groupId,
    paidBy: expense.paidBy,
    amount: Math.max(0, Number(expense.amount || 0)),
    description: expense.description,
    splitType: "equal",
    timestamp: expense.timestamp || new Date().toISOString(),
  };
  state.expenses.push(newExpense);
  return newExpense;
}

export function getExpenses(groupId: string) {
  return state.expenses.filter((e) => e.groupId === groupId);
}

export function computeBalances(groupId: string): { balances: MemberBalance[]; totalAmount: number; perHead: number } {
  const group = getGroup(groupId);
  if (!group) return { balances: [], totalAmount: 0, perHead: 0 };
  const expenses = getExpenses(groupId);
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const n = group.members.length || 1;
  const perHeadRaw = totalAmount / n;
  const perHead = round2(perHeadRaw);
  const paidMap = new Map<string, number>();
  for (const m of group.members) paidMap.set(m.memberId, 0);
  for (const e of expenses) paidMap.set(e.paidBy, (paidMap.get(e.paidBy) || 0) + e.amount);
  const balances: MemberBalance[] = group.members.map((m) => {
    const paid = round2(paidMap.get(m.memberId) || 0);
    const shouldPay = perHead;
    const balance = round2(paid - shouldPay);
    return { memberId: m.memberId, paid, shouldPay, balance };
  });
  // Minor adjustment to ensure sum of balances equals 0 due to rounding
  const sumBal = round2(balances.reduce((s, b) => s + b.balance, 0));
  if (sumBal !== 0 && balances.length) {
    // adjust the largest creditor/debtor slightly
    if (sumBal > 0) {
      const idx = balances.findIndex((b) => b.balance === Math.max(...balances.map((x) => x.balance)));
      balances[idx].balance = round2(balances[idx].balance - sumBal);
    } else {
      const idx = balances.findIndex((b) => b.balance === Math.min(...balances.map((x) => x.balance)));
      balances[idx].balance = round2(balances[idx].balance - sumBal);
    }
  }
  return { balances, totalAmount: round2(totalAmount), perHead };
}

export function computeSettlement(groupId: string): SettlementPair[] {
  const group = getGroup(groupId);
  if (!group) return [];
  const { balances } = computeBalances(groupId);
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ id: b.memberId, amount: round2(-b.balance) }));
  const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ id: b.memberId, amount: round2(b.balance) }));
  // sort for greedy: largest first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const pairs: SettlementPair[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const pay = round2(Math.min(d.amount, c.amount));
    const toMember = group.members.find((m) => m.memberId === c.id);
    const upi = toMember?.upiId || "DEMO_UPI@upi";
    const pn = encodeURIComponent(toMember?.name || "Demo");
    const upiLink = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${pn}&am=${pay.toFixed(2)}&cu=INR&tn=${encodeURIComponent("FairSplit-Demo")}`;
    pairs.push({ from: d.id, to: c.id, amount: pay, upiLink });
    d.amount = round2(d.amount - pay);
    c.amount = round2(c.amount - pay);
    if (d.amount === 0) i++;
    if (c.amount === 0) j++;
  }
  return pairs;
}

function round2(v: number) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
