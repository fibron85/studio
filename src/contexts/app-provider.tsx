'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Income, Goal } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-provider';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';

interface AppContextType {
  incomes: Income[];
  goal: Goal;
  addIncome: (income: Omit<Income, 'id'>) => void;
  setGoal: (goal: Goal) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goal, setGoal] = useState<Goal>({ monthly: 2000 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIncomes([]);
      setGoal({ monthly: 2000 });
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const goalRef = doc(db, 'users', user.uid, 'settings', 'goal');
        const goalSnap = await getDoc(goalRef);
        if (goalSnap.exists()) {
          setGoal(goalSnap.data() as Goal);
        }

        const incomesRef = collection(db, 'users', user.uid, 'incomes');
        const q = query(incomesRef, orderBy('date', 'desc'));
        const incomeSnap = await getDocs(q);
        const userIncomes = incomeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income));
        setIncomes(userIncomes);

      } catch (error) {
        console.error("Failed to load data from Firestore", error);
        toast({
          title: "Error",
          description: "Could not load your data.",
          variant: "destructive",
        });
      } finally {
          setLoading(false);
      }
    }
    fetchData();

  }, [user, authLoading, toast]);

  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!user) return;
    const newId = new Date().toISOString() + Math.random();
    const newIncome: Income = { ...income, id: newId };
    
    try {
        const incomeRef = doc(db, 'users', user.uid, 'incomes', newId);
        await setDoc(incomeRef, newIncome);
        setIncomes(prev => [newIncome, ...prev]);
        toast({
            title: "Success",
            description: "Income added successfully.",
        });
    } catch(error) {
        console.error("Error adding income: ", error);
        toast({
            title: "Error",
            description: "Could not save income.",
            variant: "destructive"
        });
    }

  };

  const updateGoal = async (newGoal: Goal) => {
    if (!user) return;
    try {
      const goalRef = doc(db, 'users', user.uid, 'settings', 'goal');
      await setDoc(goalRef, newGoal, { merge: true });
      setGoal(newGoal);
      toast({
          title: "Success",
          description: "Income goal updated.",
      });
    } catch(error) {
       console.error("Error updating goal: ", error);
       toast({
            title: "Error",
            description: "Could not update goal.",
            variant: "destructive"
       });
    }
  };

  const appContextValue = {
    incomes,
    goal,
    addIncome,
    setGoal: updateGoal,
    loading: loading || authLoading
  }

  return (
    <AppContext.Provider value={appContextValue}>
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
