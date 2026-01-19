import type { ImageSourcePropType } from "react-native";

export interface Flavor {
  id: string;
  name: string;
  color: string; // hex
  nicotine: string;
  /**
   * Simple inventory tracking per flavor.
   * 0 = out of stock
   */
  stock: number;
}

export interface VapeProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  /**
   * Optional price (0 = not set).
   */
  price: number;
  image: ImageSourcePropType;
  flavors: Flavor[];
}

// Local images are bundled with Expo via `require`.
// User-added images use `{ uri: string }`, which is also compatible with ImageSourcePropType.
export const initialProducts: VapeProduct[] = [
  {
    id: "1",
    name: "Cloud Pro X",
    description: "Premium pod system with adjustable airflow and long-lasting battery life",
    category: "Pod System",
    price: 39.99,
    image: require("../../assets/images/vape-1.jpg"),
    flavors: [
      { id: "1a", name: "Mango Ice", color: "#FFA500", nicotine: "20mg", stock: 12 },
      { id: "1b", name: "Strawberry Blast", color: "#FF6B6B", nicotine: "20mg", stock: 0 },
      { id: "1c", name: "Cool Mint", color: "#98D8C8", nicotine: "20mg", stock: 4 },
      { id: "1d", name: "Grape Fusion", color: "#8B5CF6", nicotine: "35mg", stock: 2 }
    ]
  },
  {
    id: "2",
    name: "Vapor King Elite",
    description: "High-performance box mod with temperature control and OLED display",
    category: "Box Mod",
    price: 79.99,
    image: require("../../assets/images/vape-2.jpg"),
    flavors: [
      { id: "2a", name: "Tobacco Classic", color: "#8B4513", nicotine: "12mg", stock: 8 },
      { id: "2b", name: "Vanilla Cream", color: "#F5DEB3", nicotine: "6mg", stock: 1 },
      { id: "2c", name: "Coffee Mocha", color: "#6F4E37", nicotine: "12mg", stock: 6 }
    ]
  },
  {
    id: "3",
    name: "Slim Series V2",
    description: "Ultra-portable disposable vape with 5000 puffs capacity",
    category: "Disposable",
    price: 24.99,
    image: require("../../assets/images/vape-3.jpg"),
    flavors: [
      { id: "3a", name: "Watermelon", color: "#FF6B6B", nicotine: "50mg", stock: 0 },
      { id: "3b", name: "Blue Razz", color: "#3B82F6", nicotine: "50mg", stock: 10 },
      { id: "3c", name: "Lush Ice", color: "#10B981", nicotine: "50mg", stock: 3 },
      { id: "3d", name: "Peach Berry", color: "#FBBF24", nicotine: "35mg", stock: 2 },
      { id: "3e", name: "Mixed Berries", color: "#8B5CF6", nicotine: "35mg", stock: 7 }
    ]
  },
  {
    id: "4",
    name: "AeroMist Pro",
    description: "Sleek pen-style vape with ceramic coil technology",
    category: "Vape Pen",
    price: 34.99,
    image: require("../../assets/images/vape-4.jpg"),
    flavors: [
      { id: "4a", name: "Pineapple Express", color: "#FBBF24", nicotine: "25mg", stock: 5 },
      { id: "4b", name: "Cherry Cola", color: "#DC2626", nicotine: "25mg", stock: 0 },
      { id: "4c", name: "Menthol Freeze", color: "#06B6D4", nicotine: "25mg", stock: 9 }
    ]
  },
  {
    id: "5",
    name: "NebulaTank 3000",
    description: "Sub-ohm tank system for cloud chasers with mesh coil",
    category: "Tank System",
    price: 54.99,
    image: require("../../assets/images/vape-5.jpg"),
    flavors: [
      { id: "5a", name: "Tropical Mix", color: "#F97316", nicotine: "3mg", stock: 6 },
      { id: "5b", name: "Citrus Burst", color: "#EAB308", nicotine: "3mg", stock: 6 },
      { id: "5c", name: "Berry Lemonade", color: "#EC4899", nicotine: "6mg", stock: 1 },
      { id: "5d", name: "Apple Cinnamon", color: "#84CC16", nicotine: "6mg", stock: 0 }
    ]
  },
  {
    id: "6",
    name: "Stealth Mini",
    description: "Compact and discreet design perfect for on-the-go vaping",
    category: "Pod System",
    price: 29.99,
    image: require("../../assets/images/vape-6.jpg"),
    flavors: [
      { id: "6a", name: "Sweet Tobacco", color: "#92400E", nicotine: "35mg", stock: 4 },
      { id: "6b", name: "Fresh Spearmint", color: "#22C55E", nicotine: "35mg", stock: 2 },
      { id: "6c", name: "Honeydew Melon", color: "#A3E635", nicotine: "20mg", stock: 11 }
    ]
  }
];

export const categories = [
  "All",
  "Disposable Vape",
  "Vape Juice",
  "Pod System",
  "Box Mod",
  "Vape Pen",
  "Tank System",
  "Accessories"
] as const;

export type Category = (typeof categories)[number];
