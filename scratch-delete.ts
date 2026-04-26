import { prisma } from './lib/prisma';

async function main() {
    try {
        await prisma.$executeRawUnsafe(`DELETE FROM "public"."item_pesanan";`);
        await prisma.$executeRawUnsafe(`DELETE FROM "public"."pesanan";`);
        console.log("Success deleting old orders.");
    } catch (e) {
        console.error(e);
    }
}
main();
