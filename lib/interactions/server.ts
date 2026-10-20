import prisma from "@/lib/prisma";
import { updateUserProfileVector } from "@/lib/recommendation/vectorizer";

// Bobot "purchase" sama dengan EVENT_WEIGHT di app/api/interactions/route.ts
const PURCHASE_WEIGHT = 5;

export const isPaidStatus = (status?: string | null) =>
  !!status && ["dibayar", "settlement", "capture"].includes(status.toLowerCase());

/**
 * Catat pembelian sebagai interaksi "purchase" (dari server, bukan dari browser, supaya tidak bisa dipalsukan)
 * lalu perbarui user profile vector. Gagal mencatat tidak boleh menggagalkan proses pembayaran.
 */
export async function recordPurchaseInteractions(userId: string, productIds: number[]) {
  const unique = [...new Set(productIds)];
  if (!unique.length) return;
  try {
    await prisma.userInteraction.createMany({
      data: unique.map((id) => ({ id_user: userId, item_id: id, item_type: "product", event: "purchase", weight: PURCHASE_WEIGHT })),
    });
  } catch (e) {
    console.error("Gagal mencatat interaksi purchase:", e);
    return;
  }
  for (const id of unique) {
    await updateUserProfileVector(userId, id, "product", PURCHASE_WEIGHT).catch((e) =>
      console.error("Gagal update user profile vector (purchase):", e)
    );
  }
}
