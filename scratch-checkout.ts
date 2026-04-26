import { prisma } from './lib/prisma';

async function main() {
    try {
        const orderId = `PANGAN-${Date.now()}`;

        // find a user first to get their ID
        const user = await prisma.pengguna.findFirst();
        if (!user) return console.log("No user found");
        
        // find a product
        const product = await prisma.produk.findFirst();
        if (!product) return console.log("No product found");

        const newOrder = await prisma.$transaction(async (tx) => {
            const pesanan = await tx.pesanan.create({
                data: {
                    order_id: orderId,
                    id_user: user.id,
                    total_harga: 241000,
                    status_pembayaran: "pending",
                    item_pesanan: {
                        create: [
                            {
                                id_produk: product.id_produk,
                                kuantitas: 2,
                                subtotal: 241000
                            }
                        ]
                    }
                }
            });
            return pesanan;
        });
        console.log("Success:", newOrder);
    } catch (e) {
        console.error("PRISMA ERROR:\n", e);
    }
}
main()
