'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Income, AppSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-provider';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, updateDoc } from 'firebase/firestore';

interface AppContextType {
  incomes: Income[];
  settings: AppSettings;
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    monthlyGoal: 2000,
    boltCommission: 20,
    fullName: '',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIncomes([]);
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const settingsRef = doc(db, 'users', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setSettings({
            monthlyGoal: data.monthlyGoal || defaultSettings.monthlyGoal,
            boltCommission: data.boltCommission || defaultSettings.boltCommission,
            fullName: data.fullName || user.displayName || defaultSettings.fullName,
          });
        } else {
             setSettings(prev => ({ ...prev, fullName: user.displayName || '' }));
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

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!user) return;
    try {
      const settingsRef = doc(db, 'users', user.uid);
      await updateDoc(settingsRef, newSettings);
      setSettings(prev => ({...prev, ...newSettings}));
      toast({
          title: "Success",
          description: "Your settings have been updated.",
      });
    } catch(error) {
       console.error("Error updating settings: ", error);
       toast({
            title: "Error",
            description: "Could not update your settings.",
            variant: "destructive"
       });
    }
  };

  const appContextValue = {
    incomes,
    settings,
    addIncome,
    updateSettings,
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
