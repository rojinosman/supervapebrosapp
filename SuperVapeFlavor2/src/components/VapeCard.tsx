import React, { memo, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { VapeProduct } from "../data/products";
import { colors } from "../theme/colors";

type Props = {
  product: VapeProduct;
  expanded: boolean;
  onToggle: () => void;

  /** Open the edit modal for this product */
  onEdit: () => void;
  /** Update inventory (stock) for a flavor */
  onSetFlavorStock: (flavorId: string, nextStock: number) => void;

  /** Add a flavor to an existing product */
  onAddFlavor: (flavor: { name: string; color: string; nicotine?: string; stock: number }) => void;
};

function stockLabel(stock: number) {
  if (stock <= 0) return "Out";
  if (stock <= 2) return `Low (${stock})`;
  return `In (${stock})`;
}

export const VapeCard = memo(function VapeCard({ product, expanded, onToggle, onEdit, onSetFlavorStock, onAddFlavor }: Props) {
  const [newFlavor, setNewFlavor] = useState({ name: "", stock: "", color: "#3B82F6", nicotine: "" });

  const inStockCount = product.flavors.reduce((acc, f) => acc + (f.stock > 0 ? 1 : 0), 0);

  const addFlavor = () => {
    const name = newFlavor.name.trim();
    const nicotine = newFlavor.nicotine.trim();
    const color = newFlavor.color.trim() || "#3B82F6";
    const stockRaw = newFlavor.stock.trim();

    // Require at least something (name/nicotine/stock) so we don't accidentally add blank flavors.
    if (!name && !nicotine && !stockRaw) return;

    const parsed = stockRaw ? Number.parseInt(stockRaw, 10) : 10;
    const safeStock = Number.isFinite(parsed) && !Number.isNaN(parsed) && parsed >= 0 ? parsed : 10;

    onAddFlavor({ name: name || "Flavor", nicotine, color, stock: safeStock });
    setNewFlavor({ name: "", stock: "", color: "#3B82F6", nicotine: "" });
  };

  // Product deletion now happens in the Edit modal (pencil icon).

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.tap, pressed && { opacity: 0.95 }]}>
        <View style={styles.imageWrap}>
          <Image source={product.image} style={styles.image} resizeMode="cover" />
          <View style={styles.gradient} />
          <Pressable
            onPress={(e) => {
              // Prevent card expand/collapse when tapping the pencil.
              (e as any).stopPropagation?.();
              onEdit();
            }}
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
            hitSlop={10}
          >
            <Feather name="edit-2" size={16} color={colors.primaryForeground} />
          </Pressable>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.category}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.name} numberOfLines={1}>
                {product.name}
              </Text>
              {product.description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {product.description}
                </Text>
              ) : null}
            </View>
            {product.price > 0 ? <Text style={styles.price}>${product.price.toFixed(2)}</Text> : null}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.flavorMeta}>
              <Feather name="droplet" size={14} color={colors.mutedForeground} />
              <Text style={styles.metaText}>
                {product.flavors.length} flavors{product.flavors.length ? ` • ${inStockCount} in stock` : ""}
              </Text>
            </View>
            <Feather
              name="chevron-down"
              size={18}
              color={colors.mutedForeground}
              style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
            />
          </View>
        </View>
      </Pressable>

      {expanded && product.flavors.length > 0 && (
        <View style={styles.expanded}>
          <Text style={styles.sectionTitle}>Flavors & Inventory</Text>
          <View style={{ gap: 8 }}>
            {product.flavors.map((flavor) => (
              <View key={flavor.id} style={styles.flavorRow}>
                <View style={styles.flavorLeft}>
                  <View style={[styles.colorDot, { backgroundColor: flavor.color }]} />
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.flavorName} numberOfLines={1}>
                      {flavor.name}
                    </Text>
                    {flavor.nicotine ? <Text style={styles.nicotine}>{flavor.nicotine}</Text> : null}
                  </View>
                </View>

                <View style={styles.stockControls}>
                  <Pressable
                    onPress={() => onSetFlavorStock(flavor.id, Math.max(0, flavor.stock - 1))}
                    style={({ pressed }) => [styles.stockBtn, pressed && { opacity: 0.85 }]}
                    hitSlop={10}
                  >
                    <Feather name="minus" size={14} color={colors.foreground} />
                  </Pressable>

                  <View style={styles.stockPill}>
                    <Text style={styles.stockText}>{stockLabel(flavor.stock)}</Text>
                  </View>

                  <Pressable
                    onPress={() => onSetFlavorStock(flavor.id, flavor.stock + 1)}
                    style={({ pressed }) => [styles.stockBtn, pressed && { opacity: 0.85 }]}
                    hitSlop={10}
                  >
                    <Feather name="plus" size={14} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Add flavor to existing product */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Add Flavor</Text>
          <View style={styles.addFlavorBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>Name</Text>
              <TextInput
                value={newFlavor.name}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, name: v }))}
                placeholder="Mango Ice"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 76 }}>
              <Text style={styles.smallLabel}>Stock</Text>
              <TextInput
                value={newFlavor.stock}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, stock: v.replace(/[^0-9]/g, "") }))}
                placeholder="10"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 88 }}>
              <Text style={styles.smallLabel}>Color</Text>
              <TextInput
                value={newFlavor.color}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, color: v }))}
                placeholder="#3B82F6"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 92 }}>
              <Text style={styles.smallLabel}>Nicotine</Text>
              <TextInput
                value={newFlavor.nicotine}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, nicotine: v }))}
                placeholder="20mg"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <Pressable onPress={addFlavor} style={({ pressed }) => [styles.smallBtnOutline, pressed && { opacity: 0.85 }]}>
              <Feather name="plus" size={14} color={colors.foreground} />
              <Text style={styles.smallBtnOutlineText}>Add</Text>
            </Pressable>
          </View>

        </View>
      )}

      {expanded && product.flavors.length === 0 && (
        <View style={styles.expanded}>
          <Text style={styles.sectionTitle}>No flavors added</Text>

          {/* Add flavor even if product started with none */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Add Flavor</Text>
          <View style={styles.addFlavorBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>Name</Text>
              <TextInput
                value={newFlavor.name}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, name: v }))}
                placeholder="Mango Ice"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 76 }}>
              <Text style={styles.smallLabel}>Stock</Text>
              <TextInput
                value={newFlavor.stock}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, stock: v.replace(/[^0-9]/g, "") }))}
                placeholder="10"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 88 }}>
              <Text style={styles.smallLabel}>Color</Text>
              <TextInput
                value={newFlavor.color}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, color: v }))}
                placeholder="#3B82F6"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 92 }}>
              <Text style={styles.smallLabel}>Nicotine</Text>
              <TextInput
                value={newFlavor.nicotine}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, nicotine: v }))}
                placeholder="20mg"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <Pressable onPress={addFlavor} style={({ pressed }) => [styles.smallBtnOutline, pressed && { opacity: 0.85 }]}>
              <Feather name="plus" size={14} color={colors.foreground} />
              <Text style={styles.smallBtnOutlineText}>Add</Text>
            </Pressable>
          </View>

        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden"
  },
  cardExpanded: {
    borderColor: "rgba(14, 165, 233, 0.5)"
  },
  tap: {
    width: "100%"
  },
  imageWrap: {
    height: 150,
    backgroundColor: colors.secondary
  },
  image: {
    width: "100%",
    height: "100%"
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: "rgba(0,0,0,0.18)"
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  editBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.45)"
  },
  badgeText: {
    color: colors.accentForeground,
    fontSize: 11,
    fontWeight: "800"
  },
  body: {
    padding: 12
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  name: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.foreground
  },
  desc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedForeground
  },
  price: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.foreground
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  flavorMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  metaText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "600"
  },
  expanded: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    padding: 12,
    backgroundColor: "rgba(241, 245, 249, 0.6)"
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.foreground,
    marginBottom: 8
  },
  flavorRow: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  flavorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  flavorName: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.foreground
  },
  nicotine: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedForeground
  },
  stockControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  stockBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background
  },
  stockText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.foreground
  },

  smallLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.mutedForeground
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.foreground,
    backgroundColor: colors.background
  },
  inputSmall: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12
  },
  addFlavorBox: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)"
  },
  smallBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.background
  },
  smallBtnOutlineText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.foreground
  },
  removeBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: colors.danger
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF"
  }
});
