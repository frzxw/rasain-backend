import { createClient } from '../config/database';
import { logger } from '../utils/logger';
import { UserModel, RecipeModel, NotificationModel } from '../models';
import { v4 as uuidv4 } from 'uuid';

// Sample people. Their shared password comes from SEED_USER_PASSWORD at seed time.
const sampleUsers = [
  {
    email: 'user1@example.com',
    name: 'Sari Indah',
    phone: '+6281234567890'
  },
  {
    email: 'user2@example.com',
    name: 'Budi Santoso',
    phone: '+6281234567891'
  },
  {
    email: 'chef.maya@example.com',
    name: 'Chef Maya',
    phone: '+6281234567892'
  }
];

const sampleRecipes = [
  {
    name: 'Nasi Gudeg Yogyakarta',
    description: 'Hidangan khas Yogyakarta yang terbuat dari nangka muda yang dimasak dengan santan dan gula kelapa.',
    cookTime: '2 hours',
    prepTime: '30 minutes',
    servings: 4,
    difficultyLevel: 'medium' as const,
    ingredients: [
      { name: 'Nangka muda', amount: '500', unit: 'gram', notes: 'potong dadu' },
      { name: 'Santan kental', amount: '400', unit: 'ml' },
      { name: 'Gula kelapa', amount: '100', unit: 'gram' },
      { name: 'Lengkuas', amount: '2', unit: 'cm', notes: 'geprek' },
      { name: 'Daun salam', amount: '3', unit: 'lembar' },
      { name: 'Garam', amount: '1', unit: 'sdt' }
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Cuci bersih nangka muda, potong dadu sesuai selera.',
        estimatedTime: '10 minutes'
      },
      {
        stepNumber: 2,
        instruction: 'Rebus nangka muda hingga empuk, tiriskan.',
        estimatedTime: '20 minutes'
      },
      {
        stepNumber: 3,
        instruction: 'Masak santan dengan gula kelapa, lengkuas, dan daun salam hingga mengental.',
        estimatedTime: '30 minutes'
      },
      {
        stepNumber: 4,
        instruction: 'Masukkan nangka muda, masak dengan api kecil hingga bumbu meresap.',
        estimatedTime: '60 minutes'
      },
      {
        stepNumber: 5,
        instruction: 'Sajikan gudeg dengan nasi putih hangat.',
        estimatedTime: '5 minutes'
      }
    ]
  },
  {
    name: 'Rendang Daging Sapi',
    description: 'Masakan daging sapi yang dimasak dengan santan dan rempah-rempah khas Padang.',
    cookTime: '3 hours',
    prepTime: '45 minutes', 
    servings: 6,
    difficultyLevel: 'hard' as const,
    ingredients: [
      { name: 'Daging sapi', amount: '1', unit: 'kg', notes: 'potong kotak' },
      { name: 'Santan kental', amount: '1', unit: 'liter' },
      { name: 'Cabai merah keriting', amount: '20', unit: 'buah' },
      { name: 'Bawang merah', amount: '8', unit: 'siung' },
      { name: 'Bawang putih', amount: '6', unit: 'siung' },
      { name: 'Jahe', amount: '3', unit: 'cm' },
      { name: 'Lengkuas', amount: '4', unit: 'cm' },
      { name: 'Serai', amount: '3', unit: 'batang' },
      { name: 'Daun jeruk', amount: '5', unit: 'lembar' },
      { name: 'Garam', amount: '2', unit: 'sdt' }
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Haluskan cabai, bawang merah, bawang putih, jahe, dan lengkuas.',
        estimatedTime: '15 minutes'
      },
      {
        stepNumber: 2,
        instruction: 'Tumis bumbu halus hingga harum dan matang.',
        estimatedTime: '10 minutes'
      },
      {
        stepNumber: 3,
        instruction: 'Masukkan daging sapi, aduk hingga berubah warna.',
        estimatedTime: '15 minutes'
      },
      {
        stepNumber: 4,
        instruction: 'Tuang santan, tambahkan serai dan daun jeruk. Masak dengan api sedang.',
        estimatedTime: '30 minutes'
      },
      {
        stepNumber: 5,
        instruction: 'Kecilkan api, masak sambil diaduk sesekali hingga santan mengental dan daging empuk.',
        estimatedTime: '2.5 hours'
      },
      {
        stepNumber: 6,
        instruction: 'Rendang siap disajikan dengan nasi putih.',
        estimatedTime: '5 minutes'
      }
    ]
  },
  {
    name: 'Gado-Gado Jakarta',
    description: 'Salad sayuran Indonesia dengan bumbu kacang yang kaya rasa.',
    cookTime: '20 minutes',
    prepTime: '30 minutes',
    servings: 4,
    difficultyLevel: 'easy' as const,
    ingredients: [
      { name: 'Kacang tanah', amount: '200', unit: 'gram', notes: 'sangrai' },
      { name: 'Kangkung', amount: '1', unit: 'ikat', notes: 'rebus' },
      { name: 'Kol', amount: '200', unit: 'gram', notes: 'rebus' },
      { name: 'Tahu', amount: '5', unit: 'potong', notes: 'goreng' },
      { name: 'Tempe', amount: '5', unit: 'potong', notes: 'goreng' },
      { name: 'Telur', amount: '2', unit: 'butir', notes: 'rebus' },
      { name: 'Cabai rawit', amount: '5', unit: 'buah' },
      { name: 'Gula merah', amount: '2', unit: 'sdm' },
      { name: 'Garam', amount: '1', unit: 'sdt' }
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Sangrai kacang tanah hingga matang dan harum.',
        estimatedTime: '10 minutes'
      },
      {
        stepNumber: 2,
        instruction: 'Haluskan kacang tanah dengan cabai, gula merah, dan garam.',
        estimatedTime: '10 minutes'
      },
      {
        stepNumber: 3,
        instruction: 'Rebus kangkung dan kol hingga matang, tiriskan.',
        estimatedTime: '5 minutes'
      },
      {
        stepNumber: 4,
        instruction: 'Goreng tahu dan tempe hingga kecokelatan.',
        estimatedTime: '10 minutes'
      },
      {
        stepNumber: 5,
        instruction: 'Rebus telur, kupas dan potong menjadi dua.',
        estimatedTime: '10 minutes'
      },
      {
        stepNumber: 6,
        instruction: 'Tata semua bahan di piring, siram dengan bumbu kacang.',
        estimatedTime: '5 minutes'
      }
    ]
  }
];

const samplePantryItems = [
  { name: 'Beras', quantity: 5, unit: 'kg', category: 'Grains' },
  { name: 'Minyak goreng', quantity: 2, unit: 'liter', category: 'Oil' },
  { name: 'Gula pasir', quantity: 1, unit: 'kg', category: 'Sweetener' },
  { name: 'Garam', quantity: 500, unit: 'gram', category: 'Seasoning' },
  { name: 'Bawang merah', quantity: 1, unit: 'kg', category: 'Vegetables', expiryDate: '2025-07-01' },
  { name: 'Bawang putih', quantity: 500, unit: 'gram', category: 'Vegetables', expiryDate: '2025-07-01' },
  { name: 'Cabai merah', quantity: 300, unit: 'gram', category: 'Vegetables', expiryDate: '2025-06-20' },
  { name: 'Daging sapi', quantity: 2, unit: 'kg', category: 'Meat', expiryDate: '2025-06-15' },
  { name: 'Ayam', quantity: 1.5, unit: 'kg', category: 'Meat', expiryDate: '2025-06-18' },
  { name: 'Telur', quantity: 1, unit: 'kg', category: 'Dairy', expiryDate: '2025-06-25' }
];

async function seedDatabase(): Promise<void> {
  try {
    logger.info('🌱 Starting database seeding...');

    const supabase = createClient();

    // Check if data already exists
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: recipeCount } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    if ((userCount || 0) > 1 || (recipeCount || 0) > 0) {
      logger.info('⚠️  Database already contains data. Skipping seeding.');
      return;
    }

    const seedPassword = process.env.SEED_USER_PASSWORD;
    if (!seedPassword || seedPassword.length < 8) {
      throw new Error(
        'Set SEED_USER_PASSWORD (at least 8 characters) before seeding sample users. See .env.example.'
      );
    }

    // Seed users
    logger.info('👥 Seeding users...');
    const createdUsers = [];

    for (const userData of sampleUsers) {
      try {
        const { user, profile } = await UserModel.createUser({
          ...userData,
          password: seedPassword
        });
        createdUsers.push({ user, profile });
        logger.info(`✅ Created user: ${profile.name} (${user.email})`);
      } catch (error) {
        logger.error(`❌ Failed to create user ${userData.email}:`, error);
      }
    }

    if (createdUsers.length === 0) {
      logger.error('❌ No users were created. Cannot continue seeding.');
      return;
    }

    // Seed recipes
    logger.info('🍽️  Seeding recipes...');
    const createdRecipes = [];

    for (let i = 0; i < sampleRecipes.length; i++) {
      const recipeData = sampleRecipes[i];
      const creator = createdUsers[i % createdUsers.length];

      try {
        const recipe = await RecipeModel.createRecipe({
          ...recipeData,
          createdBy: creator.user.id
        });
        createdRecipes.push(recipe);
        logger.info(`✅ Created recipe: ${recipe.name}`);
      } catch (error) {
        logger.error(`❌ Failed to create recipe ${recipeData.name}:`, error);
      }
    }

    // Seed pantry items for first user
    if (createdUsers.length > 0) {
      logger.info('🥫 Seeding pantry items...');
      const firstUser = createdUsers[0];

      for (const itemData of samplePantryItems) {
        try {
          const { error } = await supabase
            .from('pantry_items')
            .insert({
              id: uuidv4(),
              user_id: firstUser.user.id,
              name: itemData.name,
              quantity: itemData.quantity,
              unit: itemData.unit,
              category: itemData.category,
              expiry_date: itemData.expiryDate || null
            });

          if (error) {
            throw error;
          }

          logger.info(`✅ Added pantry item: ${itemData.name}`);
        } catch (error) {
          logger.error(`❌ Failed to add pantry item ${itemData.name}:`, error);
        }
      }
    }

    // Create some sample community posts
    logger.info('📝 Seeding community posts...');
    const samplePosts = [
      {
        content: 'Just made some delicious Nasi Gudeg! The secret is in slow cooking with coconut milk. 🥥',
        type: 'text'
      },
      {
        content: 'Check out my latest Rendang recipe! Perfect for special occasions.',
        type: 'recipe_share',
        recipeId: createdRecipes[1]?.id
      },
      {
        content: 'Fresh from the kitchen - homemade Gado-Gado! Nothing beats traditional Indonesian flavors. 🥗',
        type: 'text'
      }
    ];

    for (let i = 0; i < samplePosts.length && i < createdUsers.length; i++) {
      const postData = samplePosts[i];
      const user = createdUsers[i];

      try {
        const { error } = await supabase
          .from('community_posts')
          .insert({
            id: uuidv4(),
            user_id: user.user.id,
            content: postData.content,
            type: postData.type,
            recipe_id: postData.recipeId || null,
            likes_count: Math.floor(Math.random() * 10),
            comments_count: Math.floor(Math.random() * 5),
            shares_count: Math.floor(Math.random() * 3)
          });

        if (error) {
          throw error;
        }

        logger.info(`✅ Created community post by ${user.profile.name}`);
      } catch (error) {
        logger.error(`❌ Failed to create community post:`, error);
      }
    }

    // Create welcome notifications for all users
    logger.info('🔔 Creating welcome notifications...');
    for (const { user } of createdUsers) {
      try {
        await NotificationModel.createNotification({
          userId: user.id,
          type: 'system',
          title: 'Welcome to Rasain!',
          message: 'Welcome to Rasain - your Indonesian recipe and cooking assistant! Start exploring delicious recipes and connect with fellow food lovers.',
          data: {
            welcomeMessage: true
          }
        });

        logger.info(`✅ Created welcome notification for ${user.email}`);
      } catch (error) {
        logger.error(`❌ Failed to create welcome notification for ${user.email}:`, error);
      }
    }

    logger.info('✅ Database seeding completed successfully!');
    logger.info(`📊 Summary:`);
    logger.info(`   - Users created: ${createdUsers.length}`);
    logger.info(`   - Recipes created: ${createdRecipes.length}`);
    logger.info(`   - Pantry items added: ${samplePantryItems.length}`);
    logger.info(`   - Community posts created: ${Math.min(samplePosts.length, createdUsers.length)}`);

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
}

async function clearData(): Promise<void> {
  try {
    logger.info('🧹 Clearing existing data...');

    const supabase = createClient();

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    let adminId: string | null = null;
    if (adminEmail) {
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', adminEmail)
        .maybeSingle();
      adminId = adminUser?.id ?? null;
    }

    // Delete in reverse order of dependencies
    const tables = [
      'post_comments',
      'post_likes', 
      'community_posts',
      'notifications',
      'pantry_items',
      'uploads',
      'recipe_steps',
      'ingredients',
      'recipe_ratings',
      'recipes',
      'user_profiles',
      'users'
    ];

    for (const table of tables) {
      try {
        // Keep the admin row when ADMIN_EMAIL is set. Profiles share that user id.
        if ((table === 'users' || table === 'user_profiles') && adminId) {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', adminId);
          
          if (error) {
            logger.warn(`⚠️  Could not clear table ${table}:`, error.message);
          } else {
            logger.info(`✅ Cleared table: ${table} (kept admin)`);
          }
        } else {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', ''); // Delete all rows
          
          if (error) {
            logger.warn(`⚠️  Could not clear table ${table}:`, error.message);
          } else {
            logger.info(`✅ Cleared table: ${table}`);
          }
        }
      } catch (error) {
        logger.warn(`⚠️  Error clearing table ${table}:`, error);
      }
    }

    logger.info('✅ Data clearing completed!');

  } catch (error) {
    logger.error('❌ Data clearing failed:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'clear') {
    clearData()
      .then(() => {
        logger.info('🎉 Data clearing completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Data clearing failed:', error);
        process.exit(1);
      });
  } else {
    seedDatabase()
      .then(() => {
        logger.info('🎉 Database seeding completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Database seeding failed:', error);
        process.exit(1);
      });
  }
}

export { seedDatabase, clearData };
