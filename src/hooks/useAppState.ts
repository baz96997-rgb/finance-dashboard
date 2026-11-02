"use client";

import { useState, useEffect, useCallback } from "react";
import { AppState, Transaction, Budget, Goal, Account } from "@/types";
import {
  loadState, saveState,
  addTransaction, updateTransaction, deleteTransaction,
  upsertBudget, deleteBudget,
  upsertGoal, deleteGoal,
  upsertAccount, deleteAccount,
} from "@/lib/store";

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== "undefined") return loadState();
    return {
      user: null,
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      goals: [],
    };
  });

  useEffect(() => {
    setState(loadState());
  }, []);

  const doAddTransaction = useCallback((tx: Transaction) => {
    setState(s => addTransaction(s, tx));
  }, []);

  const doUpdateTransaction = useCallback((tx: Transaction) => {
    setState(s => updateTransaction(s, tx));
  }, []);

  const doDeleteTransaction = useCallback((id: string) => {
    setState(s => deleteTransaction(s, id));
  }, []);

  const doUpsertBudget = useCallback((budget: Budget) => {
    setState(s => upsertBudget(s, budget));
  }, []);

  const doDeleteBudget = useCallback((id: string) => {
    setState(s => deleteBudget(s, id));
  }, []);

  const doUpsertGoal = useCallback((goal: Goal) => {
    setState(s => upsertGoal(s, goal));
  }, []);

  const doDeleteGoal = useCallback((id: string) => {
    setState(s => deleteGoal(s, id));
  }, []);

  const doUpsertAccount = useCallback((account: Account) => {
    setState(s => upsertAccount(s, account));
  }, []);

  const doDeleteAccount = useCallback((id: string) => {
    setState(s => deleteAccount(s, id));
  }, []);

  const resetData = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem("wallet_data");
    const { loadState: reload } = require("@/lib/store");
    setState(reload());
  }, []);

  return {
    state,
    addTransaction: doAddTransaction,
    updateTransaction: doUpdateTransaction,
    deleteTransaction: doDeleteTransaction,
    upsertBudget: doUpsertBudget,
    deleteBudget: doDeleteBudget,
    upsertGoal: doUpsertGoal,
    deleteGoal: doDeleteGoal,
    upsertAccount: doUpsertAccount,
    deleteAccount: doDeleteAccount,
    resetData,
  };
}
