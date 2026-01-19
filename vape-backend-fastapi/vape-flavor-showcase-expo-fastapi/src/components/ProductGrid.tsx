import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, useWindowDimensions, ScrollView, RefreshControl, Text, ActivityIndicator, Alert } from "react-native";
import { colors, spacing } from "../theme/colors";
import { AddProduct } from "./AddProduct";
import { VapeCard } from "./VapeCard";
import type { VapeProduct } from "../data/products";
import type { FlavorCreate, ProductCreate } from "../api/types";
import { api } from "../api/client";
import { flavorOutToUi, productOutToUi } from "../api/mappers";

function isLowStockProduct(p: VapeProduct) {
  // Treat a product as "low" if any flavor is low/out (<=2).
  // Products with no flavors are considered "unknown" and stay in the normal section.
  if (!p.flavors?.length) return false;
  return p.flavors.some((f) => (Number.isFinite(f.stock) ? f.stock : 0) <= 2);
}

export function ProductGrid() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const gap = 12;

  const itemWidth = useMemo(() => {
    const contentW = width - spacing.page * 2;
    const totalGaps = gap * (columns - 1);
    return (contentW - totalGaps) / columns;
  }, [columns, width]);

  const [products, setProducts] = useState<VapeProduct[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Keep low-stock products at the bottom (stable within each group).
  const sortedProducts = useMemo(() => {
    const ok: VapeProduct[] = [];
    const low: VapeProduct[] = [];
    for (const p of products) {
      (isLowStockProduct(p) ? low : ok).push(p);
    }
    return [...ok, ...low];
  }, [products]);

  const load = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.map(productOutToUi));
    } catch (e: any) {
      Alert.alert(
        "Can't reach backend",
        "Make sure your FastAPI server is running and EXPO_PUBLIC_API_BASE_URL points to it.\n\nTip: on a real phone, use your computer's LAN IP instead of localhost."
      );
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onCreateProduct = async (payload: ProductCreate) => {
    try {
      const created = await api.createProduct(payload);
      setProducts((prev) => [...prev, productOutToUi(created)]);
    } catch (e: any) {
      Alert.alert("Couldn't save product", String(e?.message ?? "Unknown error"));
      throw e;
    }
  };

  const onRemoveProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setExpandedId((prev) => (prev === productId ? null : prev));
    } catch (e: any) {
      Alert.alert("Couldn't remove product", String(e?.message ?? "Unknown error"));
      await load();
    }
  };

  const onAddFlavor = async (
    productId: string,
    flavor: { name: string; color: string; nicotine?: string; stock: number }
  ) => {
    const safeStock = Number.isFinite(flavor.stock) && flavor.stock >= 0 ? Math.floor(flavor.stock) : 0;
    const safeName = flavor.name?.trim() ? flavor.name.trim() : "Flavor";
    const safeColor = flavor.color?.trim() ? flavor.color.trim() : "#3B82F6";

    // Parse nicotine like "20mg" -> 20
    const nicRaw = (flavor.nicotine ?? "").trim();
    const nicDigits = nicRaw.match(/\d+/)?.[0];
    const nicotine_mg = nicDigits ? Number.parseInt(nicDigits, 10) : null;

    const payload: FlavorCreate = {
      name: safeName,
      color_hex: safeColor,
      nicotine_mg: nicotine_mg && Number.isFinite(nicotine_mg) ? nicotine_mg : null,
      stock: safeStock
    };

    try {
      const created = await api.addFlavor(productId, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, flavors: [...(p.flavors ?? []), flavorOutToUi(created)] } : p))
      );
    } catch (e: any) {
      Alert.alert("Couldn't add flavor", String(e?.message ?? "Unknown error"));
      await load();
    }
  };

  const onSetFlavorStock = async (productId: string, flavorId: string, nextStock: number) => {
    const safeNext = Number.isFinite(nextStock) && nextStock >= 0 ? Math.floor(nextStock) : 0;

    // optimistic UI
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, flavors: p.flavors.map((f) => (f.id === flavorId ? { ...f, stock: safeNext } : f)) } : p))
    );

    try {
      const updated = await api.updateFlavor(flavorId, { stock: safeNext });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, flavors: p.flavors.map((f) => (f.id === flavorId ? { ...f, stock: updated.stock } : f)) }
            : p
        )
      );
    } catch (e) {
      // On failure, refetch to avoid drift.
      await load();
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.section}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {sortedProducts.map((product) => (
          <View key={product.id} style={{ width: itemWidth, marginBottom: gap }}>
            <VapeCard
              product={product}
              expanded={expandedId === product.id}
              onToggle={() => setExpandedId((prev) => (prev === product.id ? null : product.id))}
              onSetFlavorStock={(flavorId, nextStock) => onSetFlavorStock(product.id, flavorId, nextStock)}
              onRemove={() => onRemoveProduct(product.id)}
              onAddFlavor={(flavor) => onAddFlavor(product.id, flavor)}
            />
          </View>
        ))}

        {/* Add tile */}
        <View style={{ width: itemWidth, marginBottom: gap }}>
          <AddProduct onCreateProduct={onCreateProduct} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.background
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10
  },
  loadingText: {
    color: colors.mutedForeground,
    fontWeight: "700"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  }
});
