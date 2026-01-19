import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  RefreshControl,
  Text,
  ActivityIndicator,
  Alert,
  Pressable
} from "react-native";

import { colors, spacing } from "../theme/colors";
import { AddProduct } from "./AddProduct";
import { EditProduct } from "./EditProduct";
import { VapeCard } from "./VapeCard";
import type { VapeProduct } from "../data/products";
import type { FlavorCreate, ProductCreate, ProductUpdate } from "../api/types";
import { api } from "../api/client";
import { flavorOutToUi, productOutToUi } from "../api/mappers";

function isLowStockProduct(p: VapeProduct) {
  // Treat a product as "low" if any flavor is low/out (<=2).
  // Products with no flavors are considered "unknown" and stay in the normal section.
  if (!p.flavors?.length) return false;
  return p.flavors.some((f) => (Number.isFinite(f.stock) ? f.stock : 0) <= 2);
}

type TabDef = {
  key: string;
  label: string;
  matches: (category: string) => boolean;
};

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

const BASE_TABS: TabDef[] = [
  { key: "All", label: "All", matches: () => true },
  {
    key: "Disposable Vape",
    label: "Disposable Vape",
    matches: (c) => /disposable/i.test(c)
  },
  {
    key: "Vape Juice",
    label: "Vape Juice",
    matches: (c) => /(vape\s*juice|juice|e-?liquid|eliquid)/i.test(c)
  },
  {
    key: "Pod System",
    label: "Pod System",
    matches: (c) => /pod/i.test(c)
  },
  {
    key: "Box Mod",
    label: "Box Mod",
    matches: (c) => /(box|mod)/i.test(c)
  },
  {
    key: "Vape Pen",
    label: "Vape Pen",
    matches: (c) => /pen/i.test(c)
  },
  {
    key: "Tank System",
    label: "Tank System",
    matches: (c) => /tank/i.test(c)
  },
  {
    key: "Accessories",
    label: "Accessories",
    matches: (c) => /accessor/i.test(c)
  },
  {
    key: "Uncategorized",
    label: "Uncategorized",
    matches: (c) => !norm(c) || /uncategorized/i.test(c)
  }
];

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
  const [editingProduct, setEditingProduct] = useState<VapeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");

  const tabs: TabDef[] = useMemo(() => {
    const found = new Set<string>();
    const extras: TabDef[] = [];

    for (const p of products) {
      const c = (p.category ?? "").trim();
      if (!c) continue;
      const n = norm(c);
      if (found.has(n)) continue;
      found.add(n);

      const coveredByBase = BASE_TABS.some((t) => t.key !== "All" && t.matches(c));
      if (!coveredByBase) {
        extras.push({
          key: c,
          label: c,
          matches: (cat) => norm(cat) === n
        });
      }
    }

    // Stable extra ordering.
    extras.sort((a, b) => a.label.localeCompare(b.label));
    return [...BASE_TABS, ...extras];
  }, [products]);

  useEffect(() => {
    if (!tabs.some((t) => t.key === activeTab)) setActiveTab("All");
  }, [tabs, activeTab]);

  const filteredSortedProducts = useMemo(() => {
    const tab = tabs.find((t) => t.key === activeTab) ?? tabs[0];
    const filtered = products.filter((p) => tab.matches(p.category));

    // Keep low-stock products at the bottom (stable within each group).
    const ok: VapeProduct[] = [];
    const low: VapeProduct[] = [];
    for (const p of filtered) {
      (isLowStockProduct(p) ? low : ok).push(p);
    }
    return [...ok, ...low];
  }, [products, tabs, activeTab]);

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

  const onUpdateProduct = async (productId: string, payload: ProductUpdate) => {
    try {
      const updated = await api.updateProduct(productId, payload);
      setProducts((prev) => prev.map((p) => (p.id === productId ? productOutToUi(updated) : p)));
    } catch (e: any) {
      Alert.alert("Couldn't update product", String(e?.message ?? "Unknown error"));
      await load();
      throw e;
    }
  };

  const onRemoveProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setExpandedId((prev) => (prev === productId ? null : prev));
      setEditingProduct((prev) => (prev?.id === productId ? null : prev));
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

  const onDeleteFlavor = async (productId: string, flavorId: string) => {
    // optimistic
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, flavors: p.flavors.filter((f) => f.id !== flavorId) } : p)));
    try {
      await api.deleteFlavor(flavorId);
    } catch (e: any) {
      Alert.alert("Couldn't delete flavor", String(e?.message ?? "Unknown error"));
      await load();
    }
  };

  const onSetFlavorStock = async (productId: string, flavorId: string, nextStock: number) => {
    const safeNext = Number.isFinite(nextStock) && nextStock >= 0 ? Math.floor(nextStock) : 0;

    // optimistic UI
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, flavors: p.flavors.map((f) => (f.id === flavorId ? { ...f, stock: safeNext } : f)) }
          : p
      )
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
    <View style={styles.root}>
      <View style={styles.tabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {tabs.map((t) => {
            const active = t.key === activeTab;
            return (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={({ pressed }) => [styles.tab, active ? styles.tabActive : styles.tabInactive, pressed && { opacity: 0.9 }]}
              >
                <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

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
          {filteredSortedProducts.map((product) => (
            <View key={product.id} style={{ width: itemWidth, marginBottom: gap }}>
              <VapeCard
                product={product}
                expanded={expandedId === product.id}
                onToggle={() => setExpandedId((prev) => (prev === product.id ? null : product.id))}
                onEdit={() => setEditingProduct(product)}
                onSetFlavorStock={(flavorId, nextStock) => onSetFlavorStock(product.id, flavorId, nextStock)}
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

      <EditProduct
        product={editingProduct}
        visible={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onRemoveProduct}
        onDeleteFlavor={onDeleteFlavor}
        onAddFlavor={onAddFlavor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  tabsBar: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: spacing.page,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  tabsRow: {
    gap: 8
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabInactive: {
    backgroundColor: colors.secondary,
    borderColor: colors.border
  },
  tabText: {
    fontSize: 12,
    fontWeight: "900"
  },
  tabTextActive: {
    color: colors.primaryForeground
  },
  tabTextInactive: {
    color: colors.foreground
  },

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
