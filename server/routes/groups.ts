import { RequestHandler } from "express";
import { ok, fail } from "../utils/response";
import {
  addExpenseToGroup,
  addMemberToGroup,
  addGroup,
  computeBalances,
  computeSettlement,
  getExpenses,
  getGroup,
  removeMemberFromGroup,
} from "../store/demoStore";

export const createGroup: RequestHandler = (req, res) => {
  const { groupName, description, members } = req.body || {};
  if (!groupName) return fail(res, "groupName is required");
  const group = addGroup({ groupName, description, members });
  return ok(res, group, "Group created");
};

export const getGroupById: RequestHandler = (req, res) => {
  const { groupId } = req.params;
  const group = getGroup(groupId);
  if (!group) return fail(res, "Group not found", null, 404);
  return ok(res, group);
};

export const addMember: RequestHandler = (req, res) => {
  const { groupId } = req.params;
  const { name, mobile, upiId } = req.body || {};
  if (!name || !mobile) return fail(res, "name and mobile are required");
  const member = addMemberToGroup(groupId, { name, mobile, upiId });
  if (!member) return fail(res, "Group not found", null, 404);
  return ok(res, member, "Member added");
};

export const removeMember: RequestHandler = (req, res) => {
  const { groupId, memberId } = req.params;
  const result = removeMemberFromGroup(groupId, memberId);
  if (!result.ok) return fail(res, result.reason || "Unable to remove member");
  return ok(res, { removed: true }, "Member removed");
};

export const addExpense: RequestHandler = (req, res) => {
  const { groupId } = req.params;
  const { paidBy, amount, description, timestamp } = req.body || {};
  if (!paidBy || amount == null) return fail(res, "paidBy and amount are required");
  const expense = addExpenseToGroup(groupId, { paidBy, amount: Number(amount), description, timestamp });
  if (!expense) return fail(res, "Group not found or invalid paidBy", null, 400);
  return ok(res, expense, "Expense added");
};

export const listExpenses: RequestHandler = (req, res) => {
  const { groupId } = req.params;
  const group = getGroup(groupId);
  if (!group) return fail(res, "Group not found", null, 404);
  const expenses = getExpenses(groupId);
  const summary = computeBalances(groupId);
  return ok(res, { expenses, ...summary });
};

export const getSettlement: RequestHandler = (req, res) => {
  const { groupId } = req.params;
  const group = getGroup(groupId);
  if (!group) return fail(res, "Group not found", null, 404);
  const pairs = computeSettlement(groupId);
  return ok(res, pairs);
};
