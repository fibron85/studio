'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Income, Goal } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  incomes: Income[];
  goal: Goal;
  addIncome: (income: Omit<Income, 'id'>) => void;
  setGoal: (goal: Goal) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goal, setGoal] = useState<Goal>({ monthly: 2000 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedIncomes = localStorage.getItem('ride-share-incomes');
      if (storedIncomes) {
        setIncomes(JSON.parse(storedIncomes));
      }
      const storedGoal = localStorage.getItem('ride-share-goal');
      if (storedGoal) {
        setGoal(JSON.parse(storedGoal));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({
        title: "Error",
        description: "Could not load saved data.",
        variant: "destructive",
      });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome: Income = { ...income, id: new Date().toISOString() + Math.random() };
    const updatedIncomes = [...incomes, newIncome];
    setIncomes(updatedIncomes);
    localStorage.setItem('ride-share-incomes', JSON.stringify(updatedIncomes));
    toast({
      title: "Success",
      description: "Income added successfully.",
    });
  };

  const updateGoal = (newGoal: Goal) => {
    setGoal(newGoal);
    localStorage.setItem('ride-share-goal', JSON.stringify(newGoal));
    toast({
        title: "Success",
        description: "Income goal updated.",
    });
  };

  return (
    <AppContext.Provider value={{ incomes, goal, addIncome, setGoal: updateGoal, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
