import { supabase } from '@/lib/supabase';
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

export interface AppData {
  categories: Category[];
  products: Product[];
  tacoSizes: TacoSize[];
  tacoMeats: TacoMeat[];
  tacoSauces: TacoSauce[];
  tacoExtras: TacoExtra[];
  tacoIngredients: TacoIngredient[];
  tacoGratins: TacoGratin[];
  lastUpdated: number;
}

const CACHE_KEY = 'caisse_app_data';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (optimisé pour les rushs)

export class DataService {
  private static instance: DataService;
  private cache: AppData | null = null;
  private loading: Promise<AppData> | null = null;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async loadAllData(forceRefresh = false): Promise<AppData> {
    if (this.loading) {
      return this.loading;
    }

    if (!forceRefresh && this.cache && this.isCacheValid()) {
      return this.cache;
    }

    if (!forceRefresh) {
      const cachedData = this.loadFromLocalStorage();
      if (cachedData) {
        this.cache = cachedData;
        return cachedData;
      }
    }

    this.loading = this.fetchAllData();
    
    try {
      const data = await this.loading;
      this.cache = data;
      this.saveToLocalStorage(data);
      return data;
    } finally {
      this.loading = null;
    }
  }

  private async fetchAllData(): Promise<AppData> {
    const [
      categoriesRes,
      productsRes,
      sizesRes,
      meatsRes,
      saucesRes,
      extrasRes,
      ingredientsRes,
      gratinsRes,
    ] = await Promise.all([
      supabase.from('categories').select('id,nom,image_url,ordre,created_at').order('ordre', { ascending: true }),
      supabase.from('products').select('id,nom,prix,image_url,category_id,actif,is_customizable,created_at').eq('actif', true),
      supabase.from('taco_sizes').select('id,nom,prix,max_viandes,max_sauces,ordre').order('ordre'),
      supabase.from('taco_meats').select('id,nom,image_url,actif').eq('actif', true),
      supabase.from('taco_sauces').select('id,nom,image_url,actif').eq('actif', true),
      supabase.from('taco_extras').select('id,nom,prix,image_url,actif').eq('actif', true),
      supabase.from('taco_ingredients').select('id,nom,actif').eq('actif', true),
      supabase.from('taco_gratins').select('id,nom,prix,image_url,actif').eq('actif', true).order('prix'),
    ]);

    return {
      categories: categoriesRes.data || [],
      products: productsRes.data || [],
      tacoSizes: sizesRes.data || [],
      tacoMeats: meatsRes.data || [],
      tacoSauces: saucesRes.data || [],
      tacoExtras: extrasRes.data || [],
      tacoIngredients: ingredientsRes.data || [],
      tacoGratins: gratinsRes.data || [],
      lastUpdated: Date.now(),
    };
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.lastUpdated < CACHE_DURATION;
  }

  private loadFromLocalStorage(): AppData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored) as AppData;
      if (Date.now() - data.lastUpdated > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lecture cache localStorage:', error);
      return null;
    }
  }

  private saveToLocalStorage(data: AppData): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde cache localStorage:', error);
    }
  }

  clearCache(): void {
    this.cache = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  getCache(): AppData | null {
    return this.cache;
  }
}

export const dataService = DataService.getInstance();
