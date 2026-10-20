import 'dotenv/config';
import prisma from '../lib/prisma';
import { vectorizeAllRecipes } from '../lib/recommendation/vectorizer';

async function main() {
  try {
    console.log('1. Checking database connection...');
    const totalRecipes = await prisma.resep.count();
    console.log(`Found ${totalRecipes} recipes in database.`);

    console.log('2. Vectorizing all recipes...');
    const results = await vectorizeAllRecipes();
    console.log(`Successfully vectorized ${results.length} recipes.`);

    console.log('3. Checking item_vector table...');
    const count = await prisma.itemVector.count({ where: { item_type: 'recipe' } });
    console.log(`Total recipe vectors in item_vector table: ${count}`);

    // Sample vector preview
    const sample = await prisma.itemVector.findFirst({ where: { item_type: 'recipe' } });
    console.log('Sample item vector:', {
      item_id: sample?.item_id,
      item_type: sample?.item_type,
      vector_length: Array.isArray(sample?.vector) ? sample.vector.length : 0,
      vector_preview: Array.isArray(sample?.vector) ? sample.vector.slice(0, 10) : sample?.vector
    });

  } catch (error: any) {
    console.error('Batch vectorization error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
