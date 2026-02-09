
export type Category = 
  | 'Food' | 'Beverages' | 'Home Essentials' | 'Furniture' 
  | 'Appliances' | 'Clothes' | 'Toys' | 'Electronics' 
  | 'Cosmetics' | 'Stationery';

export interface Product {
  id: string;
  name: string;
  category: Category;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  currentStock: number;
  avgDailySales: number;
  lastUpdated: string;
}

export interface AnalysisResult {
  productId: string;
  reorder: boolean;
  suggestedQuantity: number;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MarketingStrategy {
  type: 'DISCOUNT' | 'BUNDLE' | 'FLASH_SALE' | 'LOYALTY' | 'BOGO';
  title: string;
  description: string;
}
