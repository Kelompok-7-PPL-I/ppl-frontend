import prisma from './lib/prisma';
async function main() {
  const admin = await prisma.pengguna.findUnique({
    where: { email: 'panganesia.company@gmail.com' },
    select: { email: true, peran: true }
  });
  console.log("ADMIN USER DATA:", admin);
}
main().finally(() => prisma.$disconnect());
