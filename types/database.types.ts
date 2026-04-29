export type UserRole = 'utilisateur' | 'administrateur';

export interface User {
  id: string;
  pin: string;
  role: UserRole;
  nom: string;
  created_at: string;
}

export interface Category {
  id: string;
  nom: string;
  image_url?: string;
  ordre: number;
  created_at: string;
}

export interface Product {
  id: string;
  nom: string;
  prix: number;
  image_url?: string;
  category_id: string;
  actif: boolean;
  is_customizable?: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  mode: 'sur_place' | 'a_emporter';
  paiement: 'especes' | 'carte';
  buzzer?: number;
  statut: 'en_cours' | 'termine' | 'annule';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantite: number;
  prix_unitaire: number;
  customization?: any;
  created_at: string;
}

export interface TacoSize {
  id: string;
  nom: string;
  prix: number;
  max_viandes: number;
  max_sauces: number;
  ordre: number;
}

export interface TacoMeat {
  id: string;
  nom: string;
  image_url?: string;
  actif: boolean;
}

export interface TacoSauce {
  id: string;
  nom: string;
  image_url?: string;
  actif: boolean;
}

export interface TacoExtra {
  id: string;
  nom: string;
  prix: number;
  image_url?: string;
  actif: boolean;
}

export interface TacoIngredient {
  id: string;
  nom: string;
  actif: boolean;
}

export interface TacoGratin {
  id: string;
  nom: string;
  prix: number;
  image_url?: string;
  actif: boolean;
}

export interface TacoCustomization {
  taille: TacoSize;
  viandes: TacoMeat[];
  sauces: TacoSauce[];
  extras: TacoExtra[];
  retraits: TacoIngredient[];
  gratin?: TacoGratin;
}

export interface CartItem {
  product: Product;
  quantite: number;
  customization?: TacoCustomization;
}
