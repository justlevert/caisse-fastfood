'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { dataService, AppData } from '@/lib/services/dataService';
import {
  Category,
  Product,
  TacoSize,
  TacoMeat,
  TacoSauce,
  TacoExtra,
  TacoIngredient,
  TacoGratin,
} from '@/types/database.types';

interface DataContextType {
  categories: Category[];
  products: Product[];
  tacoSizes: TacoSize[];
  tacoMeats: TacoMeat[];
  tacoSauces: TacoSauce[];
  tacoExtras: TacoExtra[];
  tacoIngredients: TacoIngredient[];
  tacoGratins: TacoGratin[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const appData = await dataService.loadAllData(forceRefresh);
      setData(appData);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = async () => {
    await loadData(true);
  };

  return (
    <DataContext.Provider
      value={{
        categories: data?.categories || [],
        products: data?.products || [],
        tacoSizes: data?.tacoSizes || [],
        tacoMeats: data?.tacoMeats || [],
        tacoSauces: data?.tacoSauces || [],
        tacoExtras: data?.tacoExtras || [],
        tacoIngredients: data?.tacoIngredients || [],
        tacoGratins: data?.tacoGratins || [],
        isLoading,
        error,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useAppData doit être utilisé dans un DataProvider');
  }
  return context;
}
