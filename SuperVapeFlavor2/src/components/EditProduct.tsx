import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../theme/colors";
import type { VapeProduct } from "../data/products";
import { categories } from "../data/products";
import type { ProductUpdate } from "../api/types";

type Props = {
  product: VapeProduct | null;
  visible: boolean;
  onClose: () => void;
  onUpdateProduct: (productId: string, payload: ProductUpdate) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onDeleteFlavor: (productId: string, flavorId: string) => Promise<void>;
  onAddFlavor: (productId: string, flavor: { name: string; color: string; nicotine?: string; stock: number }) => Promise<void> | void;
};

const categoryOptions = categories.filter((c) => c !== "All") as string[];

function stockLabel(stock: number) {
  if (stock <= 0) return "Out";
  if (stock <= 2) return `Low (${stock})`;
  return `In (${stock})`;
}

export function EditProduct({
  product,
  visible,
  onClose,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteFlavor,
  onAddFlavor
}: Props) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: ""
  });

  const [newFlavor, setNewFlavor] = useState({
    name: "",
    color: "#3B82F6",
    nicotine: "",
    stock: ""
  });

  const productId = product?.id ?? "";

  useEffect(() => {
    if (!visible || !product) return;

    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      category: product.category === "Uncategorized" ? "" : (product.category ?? ""),
      price: product.price > 0 ? String(product.price) : ""
    });

    setNewFlavor({ name: "", color: "#3B82F6", nicotine: "", stock: "" });
  }, [visible, product?.id]);

  const title = useMemo(() => {
    if (!product) return "Edit Product";
    return product.name?.trim() ? `Edit: ${product.name}` : "Edit Product";
  }, [product]);

  const parseNicotineMg = (s: string) => {
    const digits = s.match(/\d+/)?.[0];
    if (!digits) return null;
    const n = Number.parseInt(digits, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const submit = async () => {
    if (!product) return;
    if (saving) return;

    setSaving(true);
    try {
      const name = form.name.trim();
      const category = form.category.trim();
      const description = form.description.trim();

      const priceRaw = form.price.trim();
      const priceNum = priceRaw ? Number(priceRaw) : null;
      const price = priceNum !== null && Number.isFinite(priceNum) && !Number.isNaN(priceNum) && priceNum >= 0 ? priceNum : null;

      const payload: ProductUpdate = {
        name: name ? name : null,
        category: category ? category : null,
        description: description ? description : null,
        price,
        // Keep images consistent across devices.
        image_key: null
      };

      await onUpdateProduct(product.id, payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = () => {
    if (!product) return;
    Alert.alert(
      "Delete product?",
      `This will permanently delete "${product.name}" from the backend (and every device).`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await onDeleteProduct(product.id);
              onClose();
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const addFlavor = async () => {
    if (!product) return;

    const name = newFlavor.name.trim();
    const nicotine = newFlavor.nicotine.trim();
    const color = newFlavor.color.trim() || "#3B82F6";

    // If the user leaves everything blank, don't add a flavor row.
    if (!name && !nicotine && !newFlavor.stock.trim()) return;

    const stockRaw = newFlavor.stock.trim();
    const parsed = stockRaw ? Number.parseInt(stockRaw, 10) : 10;
    const safeStock = Number.isFinite(parsed) && !Number.isNaN(parsed) && parsed >= 0 ? parsed : 10;

    await onAddFlavor(product.id, { name: name || "Flavor", nicotine, color, stock: safeStock });
    setNewFlavor({ name: "", color: "#3B82F6", nicotine: "", stock: "" });
  };

  const confirmDeleteFlavor = (flavorId: string, flavorName: string) => {
    if (!product) return;
    Alert.alert(
      "Delete flavor?",
      `Delete "${flavorName}" from "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await onDeleteFlavor(product.id, flavorId);
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Basic info */}
          <Text style={styles.label}>Product Name (optional)</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
            placeholder="e.g. Cloud Pro X"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price ($) (optional)</Text>
              <TextInput
                value={form.price}
                onChangeText={(v) => setForm((p) => ({ ...p, price: v.replace(/[^0-9.]/g, "") }))}
                placeholder="29.99"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Category (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {categoryOptions.map((c) => {
                  const active = form.category === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setForm((p) => ({ ...p, category: c }))}
                      style={({ pressed }) => [styles.chip, active ? styles.chipActive : styles.chipInactive, pressed && { opacity: 0.9 }]}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{c}</Text>
                    </Pressable>
                  );
                })}

                {/* quick "clear" chip */}
                {form.category ? (
                  <Pressable
                    onPress={() => setForm((p) => ({ ...p, category: "" }))}
                    style={({ pressed }) => [styles.chip, styles.chipInactive, pressed && { opacity: 0.9 }]}
                  >
                    <Text style={[styles.chipText, styles.chipTextInactive]}>Clear</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
            placeholder="Describe the product features..."
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.textarea]}
            multiline
          />

          {/* Flavors */}
          <Text style={styles.label}>Flavors + Inventory</Text>

          {product?.flavors?.length ? (
            <View style={styles.flavorChips}>
              {product.flavors.map((f) => (
                <View key={f.id} style={styles.flavorChip}>
                  <View style={[styles.dot, { backgroundColor: f.color }]} />
                  <Text style={styles.flavorChipText}>{f.name}</Text>
                  <Text style={styles.flavorChipSub}>• {stockLabel(f.stock)}</Text>
                  {f.nicotine ? <Text style={styles.flavorChipSub}>• {f.nicotine}</Text> : null}

                  <Pressable
                    onPress={() => confirmDeleteFlavor(f.id, f.name)}
                    style={({ pressed }) => [styles.flavorChipX, pressed && { opacity: 0.75 }]}
                    hitSlop={8}
                  >
                    <Feather name="trash-2" size={12} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.helper}>No flavors yet. Add one below.</Text>
          )}

          <Text style={[styles.label, { marginTop: 6 }]}>Add Flavor</Text>
          <View style={styles.flavorForm}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>Flavor Name</Text>
              <TextInput
                value={newFlavor.name}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, name: v }))}
                placeholder="Mango Ice"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 82 }}>
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

            <View style={{ width: 90 }}>
              <Text style={styles.smallLabel}>Color</Text>
              <TextInput
                value={newFlavor.color}
                onChangeText={(v) => setNewFlavor((p) => ({ ...p, color: v }))}
                placeholder="#3B82F6"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.inputSmall]}
              />
            </View>

            <View style={{ width: 90 }}>
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

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={saving}
              style={({ pressed }) => [styles.submitBtn, (saving || pressed) && { opacity: 0.85 }]}
            >
              <Text style={styles.submitBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </Pressable>
          </View>

          {/* Delete product */}
          <Pressable
            onPress={confirmDeleteProduct}
            disabled={saving}
            style={({ pressed }) => [styles.dangerBtn, (saving || pressed) && { opacity: 0.9 }]}
          >
            <Feather name="trash-2" size={14} color={"#FFFFFF"} />
            <Text style={styles.dangerBtnText}>Delete product</Text>
          </Pressable>

          {/* little spacer so the last button isn't hugged */}
          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.foreground,
    flex: 1,
    paddingRight: 10
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary
  },
  modalContent: {
    padding: spacing.page,
    paddingBottom: 28,
    gap: 12
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.foreground
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.mutedForeground
  },
  helper: {
    fontSize: 12,
    color: colors.mutedForeground
  },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.background
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  inputSmall: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12
  },

  twoCol: {
    flexDirection: "row",
    gap: 12
  },
  chipsRow: {
    gap: 8,
    paddingTop: 6
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipInactive: {
    backgroundColor: colors.secondary,
    borderColor: colors.border
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800"
  },
  chipTextActive: {
    color: colors.primaryForeground
  },
  chipTextInactive: {
    color: colors.foreground
  },

  flavorChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  flavorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  flavorChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.foreground
  },
  flavorChipSub: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedForeground
  },
  flavorChipX: {
    marginLeft: 2,
    padding: 2
  },

  flavorForm: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: "rgba(241, 245, 249, 0.6)"
  },

  smallBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12
  },
  smallBtnOutlineText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.foreground
  },

  actions: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "transparent"
  },
  cancelBtnText: {
    fontWeight: "900",
    color: colors.foreground
  },
  submitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary
  },
  submitBtnText: {
    fontWeight: "900",
    color: colors.primaryForeground
  },

  dangerBtn: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: colors.danger
  },
  dangerBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF"
  }
});
