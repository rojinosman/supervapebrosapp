import type { ImageSourcePropType } from "react-native";
import type { FlavorOut, ProductOut } from "./types";
import type { VapeProduct, Flavor } from "../data/products";

const placeholder = require("../../assets/icon.png");

const imageByKey: Record<string, ImageSourcePropType> = {
  "vape-1": require("../../assets/images/vape-1.jpg"),
  "vape-2": require("../../assets/images/vape-2.jpg"),
  "vape-3": require("../../assets/images/vape-3.jpg"),
  "vape-4": require("../../assets/images/vape-4.jpg"),
  "vape-5": require("../../assets/images/vape-5.jpg"),
  "vape-6": require("../../assets/images/vape-6.jpg"),
  placeholder
};

function nicotineToLabel(nicotine_mg?: number | null): string {
  if (nicotine_mg === null || nicotine_mg === undefined) return "";
  if (!Number.isFinite(nicotine_mg)) return "";
  const n = Math.max(0, Math.floor(nicotine_mg));
  return n ? `${n}mg` : "";
}

export function flavorOutToUi(f: FlavorOut): Flavor {
  return {
    id: f.id,
    name: (f.name ?? "Flavor").trim() || "Flavor",
    color: (f.color_hex ?? "#3B82F6").trim() || "#3B82F6",
    nicotine: nicotineToLabel(f.nicotine_mg),
    stock: Number.isFinite(f.stock) ? Math.max(0, Math.floor(f.stock)) : 0
  };
}

export function productOutToUi(p: ProductOut): VapeProduct {
  const flavors: Flavor[] = (p.flavors ?? []).map(flavorOutToUi);

  return {
    id: p.id,
    name: (p.name ?? "Untitled Product").trim() || "Untitled Product",
    description: (p.description ?? "").trim(),
    category: (p.category ?? "Uncategorized").trim() || "Uncategorized",
    price: Number.isFinite(p.price) ? Math.max(0, Number(p.price)) : 0,
    image: p.image_key && imageByKey[p.image_key] ? imageByKey[p.image_key] : placeholder,
    flavors
  };
}
