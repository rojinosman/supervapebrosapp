export type FlavorOut = {
  id: string;
  product_id: string;
  name?: string | null;
  nicotine_mg?: number | null;
  color_hex?: string | null;
  stock: number;
};

export type ProductOut = {
  id: string;
  name?: string | null;
  category?: string | null;
  price?: number | null;
  description?: string | null;
  image_key?: string | null;
  flavors: FlavorOut[];
};

export type FlavorCreate = {
  name?: string | null;
  nicotine_mg?: number | null;
  color_hex?: string | null;
  stock?: number | null;
};

export type ProductCreate = {
  name?: string | null;
  category?: string | null;
  price?: number | null;
  description?: string | null;
  image_key?: string | null;
  flavors?: FlavorCreate[] | null;
};

export type ProductUpdate = {
  name?: string | null;
  category?: string | null;
  price?: number | null;
  description?: string | null;
  image_key?: string | null;
};

export type FlavorUpdate = {
  name?: string | null;
  nicotine_mg?: number | null;
  color_hex?: string | null;
  stock?: number | null;
};
