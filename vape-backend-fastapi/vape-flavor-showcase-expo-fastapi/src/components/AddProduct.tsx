import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../theme/colors";
import type { Flavor } from "../data/products";
import { categories } from "../data/products";
import type { ProductCreate } from "../api/types";

type Props = {
  onCreateProduct: (payload: ProductCreate) => Promise<void>;
};

const categoryOptions = categories.filter((c) => c !== "All") as string[];
const placeholder = require("../../assets/icon.png");

function stockLabel(stock: number) {
  if (stock <= 0) return "Out";
  if (stock <= 2) return `Low (${stock})`;
  return `In (${stock})`;
}

export function AddProduct({ onCreateProduct }: Props) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: ""
  });

  const [flavors, setFlavors] = useState<Array<Omit<Flavor, "id">>>([]);
  const [newFlavor, setNewFlavor] = useState({
    name: "",
    color: "#3B82F6",
    nicotine: "",
    stock: ""
  });

  // No required fields.
  const canSubmit = true;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri ?? null);
    }
  };

  const addFlavor = () => {
    const name = newFlavor.name.trim();
    const nicotine = newFlavor.nicotine.trim();
    const color = newFlavor.color.trim() || "#3B82F6";

    // If the user leaves everything blank, don't add a flavor row.
    if (!name && !nicotine && !newFlavor.stock.trim()) return;

    const stockRaw = newFlavor.stock.trim();
    const parsed = stockRaw ? Number.parseInt(stockRaw, 10) : 10;
    const safeStock = Number.isFinite(parsed) && !Number.isNaN(parsed) && parsed >= 0 ? parsed : 10;

    setFlavors((prev) => [
      ...prev,
      {
        name: name || "Flavor",
        nicotine,
        color,
        stock: safeStock
      }
    ]);

    setNewFlavor({ name: "", color: "#3B82F6", nicotine: "", stock: "" });
  };

  const removeFlavor = (index: number) => {
    setFlavors((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setForm({ name: "", description: "", category: "", price: "" });
    setImageUri(null);
    setFlavors([]);
    setNewFlavor({ name: "", color: "#3B82F6", nicotine: "", stock: "" });
  };

  const parseNicotineMg = (s: string) => {
    const digits = s.match(/\d+/)?.[0];
    if (!digits) return null;
    const n = Number.parseInt(digits, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const name = form.name.trim();
      const category = form.category.trim();
      const description = form.description.trim();

      const priceRaw = form.price.trim();
      const priceNum = priceRaw ? Number(priceRaw) : null;
      const price = priceNum !== null && Number.isFinite(priceNum) && !Number.isNaN(priceNum) && priceNum >= 0 ? priceNum : null;

      const flavorPayload = flavors
        .map((f) => ({
          name: f.name?.trim() || null,
          color_hex: f.color?.trim() || null,
          nicotine_mg: f.nicotine ? parseNicotineMg(f.nicotine) : null,
          stock: Number.isFinite(f.stock) && f.stock >= 0 ? Math.floor(f.stock) : null
        }))
        .filter((f) => f.name || f.color_hex || f.nicotine_mg !== null || f.stock !== null);

      const payload: ProductCreate = {
        name: name ? name : null,
        category: category ? category : null,
        description: description ? description : null,
        price,
        // Note: local "file://" images won't work across devices without uploading.
        // We keep this as null so all devices show the same placeholder.
        image_key: null,
        flavors: flavorPayload.length ? flavorPayload : null
      };

      await onCreateProduct(payload);

      reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}>
        <View style={styles.tileIconWrap}>
          <Feather name="plus" size={26} color={colors.mutedForeground} />
        </View>
        <Text style={styles.tileText}>Add New Product</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <Pressable onPress={() => setOpen(false)} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Image */}
            <Text style={styles.label}>Product Image (optional)</Text>
            <View style={styles.imageRow}>
              <Pressable onPress={pickImage} style={({ pressed }) => [styles.imagePicker, pressed && { opacity: 0.9 }]}>
                <Image source={imageUri ? { uri: imageUri } : placeholder} style={styles.imagePreview} />
                <View style={styles.imageOverlay}>
                  <Feather name="upload" size={16} color={colors.primaryForeground} />
                  <Text style={styles.imageOverlayText}>{imageUri ? "Change" : "Pick"}</Text>
                </View>
              </Pressable>

              {imageUri ? (
                <Pressable onPress={() => setImageUri(null)} style={({ pressed }) => [styles.smallBtnOutline, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.smallBtnOutlineText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>

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
            <Text style={styles.label}>Flavors + Inventory (optional)</Text>

            {flavors.length > 0 ? (
              <View style={styles.flavorChips}>
                {flavors.map((f, idx) => (
                  <View key={`${f.name}-${idx}`} style={styles.flavorChip}>
                    <View style={[styles.dot, { backgroundColor: f.color }]} />
                    <Text style={styles.flavorChipText}>{f.name}</Text>
                    <Text style={styles.flavorChipSub}>• {stockLabel(f.stock)}</Text>
                    {f.nicotine ? <Text style={styles.flavorChipSub}>• {f.nicotine}</Text> : null}
                    <Pressable onPress={() => removeFlavor(idx)} style={styles.flavorChipX}>
                      <Feather name="x" size={12} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.helper}>Add flavors if you want (optional). You can edit inventory later.</Text>
            )}

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
                onPress={() => {
                  reset();
                  setOpen(false);
                }}
                disabled={saving}
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={!canSubmit || saving}
                style={({ pressed }) => [styles.submitBtn, (!canSubmit || saving || pressed) && { opacity: 0.85 }]}
              >
                <Text style={styles.submitBtnText}>{saving ? "Saving..." : "Add Product"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 210,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: "rgba(241, 245, 249, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12
  },
  tileIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary
  },
  tileText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.mutedForeground
  },

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
    color: colors.foreground
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
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.secondary
  },
  imagePreview: {
    width: "100%",
    height: "100%"
  },
  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.65)"
  },
  imageOverlayText: {
    color: colors.primaryForeground,
    fontWeight: "800",
    fontSize: 12
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
  }
});
