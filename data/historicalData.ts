
import { Product, Category } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Fresh Milk 1L', category: 'Food', costPrice: 1.2, sellingPrice: 2.5, expiryDate: '2025-05-15', currentStock: 45, avgDailySales: 12, lastUpdated: '2025-05-01' },
  { id: '2', name: 'Smart Toaster X1', category: 'Appliances', costPrice: 25, sellingPrice: 55, expiryDate: '2030-01-01', currentStock: 12, avgDailySales: 1, lastUpdated: '2025-05-01' },
  { id: '3', name: 'L-Shape Velvet Sofa', category: 'Furniture', costPrice: 450, sellingPrice: 899, expiryDate: '2040-01-01', currentStock: 3, avgDailySales: 0.1, lastUpdated: '2025-05-01' },
  { id: '4', name: 'Wireless Gaming Mouse', category: 'Electronics', costPrice: 15, sellingPrice: 45, expiryDate: '2030-01-01', currentStock: 25, avgDailySales: 3, lastUpdated: '2025-05-01' },
  { id: '5', name: 'Hydrating Moisturizer', category: 'Cosmetics', costPrice: 8, sellingPrice: 22, expiryDate: '2026-06-01', currentStock: 40, avgDailySales: 4, lastUpdated: '2025-05-01' },
  { id: '6', name: 'Hardcover Notebook', category: 'Stationery', costPrice: 1, sellingPrice: 3.5, expiryDate: '2030-01-01', currentStock: 100, avgDailySales: 10, lastUpdated: '2025-05-01' },
  { id: '7', name: 'Roasted Coffee Beans', category: 'Beverages', costPrice: 12, sellingPrice: 28, expiryDate: '2025-08-01', currentStock: 30, avgDailySales: 5, lastUpdated: '2025-05-01' },
  { id: '8', name: 'Premium Cotton Tee', category: 'Clothes', costPrice: 4, sellingPrice: 15, expiryDate: '2035-01-01', currentStock: 60, avgDailySales: 8, lastUpdated: '2025-05-01' },
  { id: '9', name: 'Super Hero Action Figure', category: 'Toys', costPrice: 5, sellingPrice: 18, expiryDate: '2035-01-01', currentStock: 20, avgDailySales: 2, lastUpdated: '2025-05-01' },
  { id: '10', name: 'Eco Laundry Pods', category: 'Home Essentials', costPrice: 6, sellingPrice: 14, expiryDate: '2026-01-01', currentStock: 50, avgDailySales: 15, lastUpdated: '2025-05-01' },
  { id: '11', name: 'Whole Wheat Bread', category: 'Food', costPrice: 0.8, sellingPrice: 1.5, expiryDate: '2025-05-10', currentStock: 30, avgDailySales: 20, lastUpdated: '2025-05-01' },
  { id: '12', name: 'Bluetooth Headphones', category: 'Electronics', costPrice: 35, sellingPrice: 79, expiryDate: '2028-12-01', currentStock: 15, avgDailySales: 2, lastUpdated: '2025-05-01' },
  { id: '13', name: 'Mineral Water 500ml', category: 'Beverages', costPrice: 0.2, sellingPrice: 1.0, expiryDate: '2026-01-01', currentStock: 200, avgDailySales: 50, lastUpdated: '2025-05-01' },
  { id: '14', name: 'Multivitamin Gummies', category: 'Cosmetics', costPrice: 10, sellingPrice: 25, expiryDate: '2025-11-15', currentStock: 25, avgDailySales: 3, lastUpdated: '2025-05-01' },
  { id: '15', name: 'Mechanical Pencil Set', category: 'Stationery', costPrice: 2, sellingPrice: 5.5, expiryDate: '2032-01-01', currentStock: 45, avgDailySales: 5, lastUpdated: '2025-05-01' }
];

export const CATEGORIES: Category[] = [
  'Food', 'Beverages', 'Home Essentials', 'Furniture', 
  'Appliances', 'Clothes', 'Toys', 'Electronics', 
  'Cosmetics', 'Stationery'
];
