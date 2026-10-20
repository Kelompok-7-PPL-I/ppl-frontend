// Verifikasi pembayaran ke Midtrans dari server (Core API: GET /v2/{order_id}/status).
// Environment mengikuti MIDTRANS_IS_PRODUCTION; pastikan sama dengan Snap di app/api/checkout/route.ts.

const baseUrl = () =>
  process.env.MIDTRANS_IS_PRODUCTION === "true" ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";

/**
 * `true` = lunas (settlement, atau capture yang tidak ditolak fraud check),
 * `false` = belum lunas / transaksi tidak ditemukan,
 * `null` = tidak bisa menghubungi Midtrans (jangan dianggap lunas).
 */
export async function isMidtransPaid(orderId: string): Promise<boolean | null> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) return null;

  try {
    const res = await fetch(`${baseUrl()}/v2/${encodeURIComponent(orderId)}/status`, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!data) return null;
    if (data.status_code === "404") return false;

    const status = data.transaction_status;
    if (status === "settlement") return true;
    if (status === "capture") return data.fraud_status !== "deny" && data.fraud_status !== "challenge";
    return false;
  } catch {
    return null;
  }
}
