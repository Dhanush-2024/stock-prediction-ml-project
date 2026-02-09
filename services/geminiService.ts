
import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateMarketingStrategies = async (product: Product, reason: string) => {
  const prompt = `
    You are a world-class retail analytics expert. 
    Provide 4 distinct, high-impact marketing strategies to maximize sales and minimize waste for this product.
    
    Context:
    - Product: ${product.name}
    - Category: ${product.category}
    - Price: $${product.sellingPrice}
    - Stock: ${product.currentStock} units
    - Current Situation: ${reason}
    
    Specific Strategic Requirements:
    1. SELL FAST STRATEGY: A plan focused purely on increasing transaction volume immediately (e.g. volume discounts, high-visibility positioning).
    2. WASTE PREVENTION STRATEGY: If close to expiry, suggest aggressive clearance or alternative usage (e.g. donation for tax credit, bundling with non-perishables).
    3. STRATEGIC BUNDLING: Suggest a specific pairing with another item in the store to increase basket size.
    4. LOYALTY ENGAGEMENT: A way to use this product to drive repeat store visits.
    
    Response Format: Return a raw JSON array of objects with keys "type" (one of DISCOUNT, BUNDLE, FLASH_SALE, LOYALTY, BOGO), "title", and "description".
    Ensure strategies are concrete and actionable. Do not use generic filler text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return [{
      type: 'DISCOUNT',
      title: 'Manual Clearance Push',
      description: 'System reached API limit. Recommended action: 25% shelf-edge discount applied immediately.'
    }];
  }
};
