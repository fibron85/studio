'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Income, AppSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-provider';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface AppContextType {
  incomes: Income[];
  settings: AppSettings;
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateSettings: (settings: Partial<Pick<AppSettings, 'monthlyGoal' | 'boltCommission' | 'fullName' | 'fuelCostPerKm'>>) => void;
  addCustomPlatform: (platform: string) => void;
  removeCustomPlatform: (platform: string) => void;
  addCustomPickupLocation: (location: string) => void;
  removeCustomPickupLocation: (location: string) => void;
  markAsPaidToCashier: (incomeId: string) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    monthlyGoal: 13000,
    boltCommission: 20,
    fullName: '',
    customPlatforms: [],
    customPickupLocations: [],
    fuelCostPerKm: 0.29,
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
            boltCommission: data.boltCommission ?? defaultSettings.boltCommission, // Allow 0
            fullName: data.fullName || user.displayName || defaultSettings.fullName,
            customPlatforms: data.customPlatforms || [],
            customPickupLocations: data.customPickupLocations || [],
            fuelCostPerKm: data.fuelCostPerKm ?? defaultSettings.fuelCostPerKm,
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
    const newIncome: Income = { 
        ...income, 
        id: newId,
        pickupLocation: income.pickupLocation || null,
        paymentMethod: income.paymentMethod || null,
    };
    
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

  const updateSettings = async (newSettings: Partial<Pick<AppSettings, 'monthlyGoal' | 'boltCommission' | 'fullName' | 'fuelCostPerKm'>>) => {
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

  const addCustomPlatform = async (platform: string) => {
    if (!user || !platform) return;
    try {
      const settingsRef = doc(db, 'users', user.uid);
      await updateDoc(settingsRef, { customPlatforms: arrayUnion(platform) });
      setSettings(prev => ({...prev, customPlatforms: [...prev.customPlatforms, platform]}));
      toast({ title: "Success", description: "Platform added." });
    } catch (error) {
      console.error("Error adding platform: ", error);
      toast({ title: "Error", description: "Could not add platform.", variant: "destructive" });
    }
  };

  const removeCustomPlatform = async (platform: string) => {
    if (!user || !platform) return;
    try {
      const settingsRef = doc(db, 'users', user.uid);
      await updateDoc(settingsRef, { customPlatforms: arrayRemove(platform) });
      setSettings(prev => ({...prev, customPlatforms: prev.customPlatforms.filter(p => p !== platform)}));
      toast({ title: "Success", description: "Platform removed." });
    } catch (error) {
      console.error("Error removing platform: ", error);
      toast({ title: "Error", description: "Could not remove platform.", variant: "destructive" });
    }
  };

  const addCustomPickupLocation = async (location: string) => {
     if (!user || !location) return;
    try {
      const settingsRef = doc(db, 'users', user.uid);
      await updateDoc(settingsRef, { customPickupLocations: arrayUnion(location) });
      setSettings(prev => ({...prev, customPickupLocations: [...prev.customPickupLocations, location]}));
      toast({ title: "Success", description: "Pickup location added." });
    } catch (error) {
      console.error("Error adding pickup location: ", error);
      toast({ title: "Error", description: "Could not add pickup location.", variant: "destructive" });
    }
  };

  const removeCustomPickupLocation = async (location: string) => {
    if (!user || !location) return;
    try {
      const settingsRef = doc(db, 'users', user.uid);
      await updateDoc(settingsRef, { customPickupLocations: arrayRemove(location) });
      setSettings(prev => ({...prev, customPickupLocations: prev.customPickupLocations.filter(l => l !== location)}));
      toast({ title: "Success", description: "Pickup location removed." });
    } catch (error) {
      console.error("Error removing pickup location: ", error);
      toast({ title: "Error", description: "Could not remove pickup location.", variant: "destructive" });
    }
  };

  const markAsPaidToCashier = async (incomeId: string) => {
    if (!user) return;
    try {
      const incomeRef = doc(db, 'users', user.uid, 'incomes', incomeId);
      await updateDoc(incomeRef, { paidToCashier: true });
      setIncomes(prev => prev.map(inc => 
        inc.id === incomeId ? { ...inc, paidToCashier: true } : inc
      ));
      toast({ title: "Success", description: "Ride marked as paid." });
    } catch (error) {
      console.error("Error marking as paid: ", error);
      toast({ title: "Error", description: "Could not update ride status.", variant: "destructive" });
    }
  };


  const appContextValue = {
    incomes,
    settings,
    addIncome,
    updateSettings,
    addCustomPlatform,
    removeCustomPlatform,
    addCustomPickupLocation,
    removeCustomPickupLocation,
    markAsPaidToCashier,
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
