import 'dotenv/config';
import prisma from '../lib/prisma';
import { initializeUserProfileVector, updateUserProfileVector, getUserProfileVector } from '../lib/recommendation/vectorizer';

async function main() {
  try {
    const user = await prisma.pengguna.findFirst();
    if (!user) {
      console.log('Tidak ada pengguna di database.');
      return;
    }

    console.log(`Testing User Profile Vector untuk user: ${user.nama || user.email} (${user.id})`);

    // 1. Test Inisialisasi Cold Start
    console.log('\n--- 1. Testing Cold Start Initial Vector ---');
    const initVec = await initializeUserProfileVector(user.id);
    console.log(`Cold start vector berhasil dibuat (panjang: ${initVec.length} dimensi).`);
    console.log('Sample nilai 10 dimensi pertama:', initVec.slice(0, 10));

    // 2. Test Dynamic Update berdasarkan Interaksi
    console.log('\n--- 2. Testing Dynamic Update saat Interaksi ---');
    // Simulasi interaksi "favorite" (weight = 3) pada resep id = 2
    const updated = await updateUserProfileVector(user.id, 2, 'recipe', 3);
    console.log('Update berhasil:');
    console.log({
      id_user: updated.id_user,
      interaction_count: updated.interaction_count,
      vector_preview: (updated.vector as number[]).slice(0, 10)
    });

    // 3. Test Get Profile Vector
    console.log('\n--- 3. Testing Get Profile Vector ---');
    const profile = await getUserProfileVector(user.id);
    console.log('Profile retrieved:', {
      id_user: profile?.id_user,
      interaction_count: profile?.interaction_count,
      updated_at: profile?.updated_at
    });

    console.log('\n✅ SEMUA TEST BERHASIL!');
  } catch (error: any) {
    console.error('Error saat testing user profile vector:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
