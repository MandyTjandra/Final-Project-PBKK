import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rich specialty coffee database for BrewLab...');

  // 1. Clean existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.pourStep.deleteMany();
  await prisma.brewRecipe.deleteMany();
  await prisma.coffeeBean.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create Users (Multiple Roasteries & Baristas)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@brewlab.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const roaster1 = await prisma.user.create({
    data: {
      email: 'roaster@morningglory.com',
      password: hashedPassword,
      name: 'Morning Glory Coffee Roasters',
      role: 'ROASTER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const roaster2 = await prisma.user.create({
    data: {
      email: 'tanamera@specialty.id',
      password: hashedPassword,
      name: 'Tanamera Craft Roastery',
      role: 'ROASTER',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    },
  });

  const roaster3 = await prisma.user.create({
    data: {
      email: 'craft@smokingbarrels.com',
      password: hashedPassword,
      name: 'Smoking Barrels Coffee Roaster',
      role: 'ROASTER',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  });

  const brewer1 = await prisma.user.create({
    data: {
      email: 'barista.alex@brewlab.com',
      password: hashedPassword,
      name: 'Alex Barista (Q-Grader)',
      role: 'BREWER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const brewer2 = await prisma.user.create({
    data: {
      email: 'chloe.brew@gmail.com',
      password: hashedPassword,
      name: 'Chloe Lin (Cup Tasters Finalist)',
      role: 'BREWER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const brewer3 = await prisma.user.create({
    data: {
      email: 'rian.sensory@specialty.com',
      password: hashedPassword,
      name: 'Rian Putra',
      role: 'BREWER',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    },
  });

  console.log('✅ Created 7 Users (Admins, Multi-Roasteries, and Professional Baristas)');

  // 3. Create 10 World-Class Single-Origin Coffee Beans
  const beansData = [
    {
      roasterId: roaster1.id,
      name: 'Panama Boquete Geisha - Finca Deborah',
      origin: 'Boquete, Chiriqui, Panama',
      farmOrStation: 'Jamison Savage - Finca Deborah',
      varietal: 'Green Tip Geisha',
      process: 'EXPERIMENTAL',
      roastLevel: 'LIGHT',
      altitudeMasl: 1950,
      stockGrams: 3200,
      minStockThreshold: 500,
      price: 295000,
      bagSizeGrams: 100,
      imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600',
      description: 'Nitrogen macerated carbonic fermentation. Extremely delicate and ethereal notes of white jasmine blossoms, candied bergamot, lemongrass, and fresh white peach nectar.',
      tastingNotes: 'White Jasmine, Bergamot, White Peach, Lemongrass, Honeycomb',
    },
    {
      roasterId: roaster1.id,
      name: 'Aceh Gayo Pantan Musara - CM Natural',
      origin: 'Takengon, Central Aceh, Indonesia',
      farmOrStation: 'Pantan Musara Micro-mill',
      varietal: 'Ateng Super, Tim-Tim',
      process: 'ANAEROBIC',
      roastLevel: 'LIGHT_MEDIUM',
      altitudeMasl: 1650,
      stockGrams: 280, // LOW STOCK! Triggers alert
      minStockThreshold: 500,
      price: 155000,
      bagSizeGrams: 200,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
      description: 'Anaerobic Carbonic Maceration for 72 hours under temperature control. Dense aroma of ripe jackfruit, concord grape, dark rum, and Dutch cocoa nibs.',
      tastingNotes: 'Ripe Jackfruit, Concord Grape, Dark Rum, Cocoa Nibs',
    },
    {
      roasterId: roaster2.id,
      name: 'Ethiopia Yirgacheffe Banko Gotiti G1',
      origin: 'Gedeb, Yirgacheffe, Ethiopia',
      farmOrStation: 'Banko Gotiti Washing Station',
      varietal: 'Heirloom / Kurume',
      process: 'WASHED',
      roastLevel: 'LIGHT',
      altitudeMasl: 2100,
      stockGrams: 4500,
      minStockThreshold: 800,
      price: 185000,
      bagSizeGrams: 200,
      imageUrl: 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?w=600',
      description: 'Crisp, crystal-clean washed Yirgacheffe. Opens with intense Earl Grey tea aroma, Meyer lemon zest, and sweet floral honeysuckle finish.',
      tastingNotes: 'Earl Grey, Meyer Lemon, Honeysuckle, Apricot',
    },
    {
      roasterId: roaster2.id,
      name: 'Colombia Huila - Finca El Paraiso Lychee',
      origin: 'Piendamo, Cauca/Huila, Colombia',
      farmOrStation: 'Diego Bermudez - El Paraiso',
      varietal: 'Castillo',
      process: 'EXPERIMENTAL',
      roastLevel: 'LIGHT',
      altitudeMasl: 1930,
      stockGrams: 2100,
      minStockThreshold: 500,
      price: 245000,
      bagSizeGrams: 150,
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600',
      description: 'Thermal shock double anaerobic fermentation. Unmistakable blast of sweet lychee syrup, strawberry candy, bubblegum, and rosehip tea.',
      tastingNotes: 'Lychee, Strawberry Candy, Bubblegum, Rose Water',
    },
    {
      roasterId: roaster3.id,
      name: 'Java Ijen Raung - Anaerobic Natural',
      origin: 'Ijen Plateau, East Java, Indonesia',
      farmOrStation: 'Ijen Agro Farmer Cooperative',
      varietal: 'USDA 762, Kartika',
      process: 'NATURAL',
      roastLevel: 'LIGHT_MEDIUM',
      altitudeMasl: 1500,
      stockGrams: 5200,
      minStockThreshold: 1000,
      price: 135000,
      bagSizeGrams: 250,
      imageUrl: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?w=600',
      description: 'Cultivated in volcanic soil around the Ijen crater. Complex notes of crisp red apple, sweet dates, cinnamon spice, and dark muscovado sugar.',
      tastingNotes: 'Red Apple, Medjool Date, Cinnamon, Muscovado Sugar',
    },
    {
      roasterId: roaster3.id,
      name: 'Kenya Nyeri Hill Farm - SL28/SL34 Peaberry',
      origin: 'Nyeri County, Central Highlands, Kenya',
      farmOrStation: 'Nyeri Hill Estate',
      varietal: 'SL28, SL34 (Peaberry Selection)',
      process: 'WASHED',
      roastLevel: 'LIGHT',
      altitudeMasl: 1850,
      stockGrams: 1800,
      minStockThreshold: 500,
      price: 210000,
      bagSizeGrams: 200,
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600',
      description: 'Phosphoric acidity with massive syrupy body. Vibrant blackcurrant cordial, pink grapefruit, dried cranberry, and savory brown cane sugar.',
      tastingNotes: 'Blackcurrant, Pink Grapefruit, Cranberry, Brown Sugar',
    },
    {
      roasterId: roaster1.id,
      name: 'Bali Kintamani Ulian - Slow Dry Honey',
      origin: 'Kintamani, Bali, Indonesia',
      farmOrStation: 'Ulian Village Farmers Group',
      varietal: 'Kopyol, B1',
      process: 'HONEY',
      roastLevel: 'MEDIUM',
      altitudeMasl: 1350,
      stockGrams: 350, // LOW STOCK!
      minStockThreshold: 600,
      price: 125000,
      bagSizeGrams: 250,
      imageUrl: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600',
      description: 'Shaded under citrus and tangerine trees. Sweet balance of orange marmalade, raw clover honey, almond brittle, and smooth chocolate finish.',
      tastingNotes: 'Orange Marmalade, Clover Honey, Almond Brittle, Milk Chocolate',
    },
    {
      roasterId: roaster2.id,
      name: 'Costa Rica Tarrazu - Canet Musician Mozart',
      origin: 'Tarrazu Valley, Costa Rica',
      farmOrStation: 'Canet Mill',
      varietal: 'F1 / Caturra',
      process: 'HONEY',
      roastLevel: 'LIGHT',
      altitudeMasl: 1900,
      stockGrams: 2400,
      minStockThreshold: 500,
      price: 260000,
      bagSizeGrams: 200,
      imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600',
      description: 'Part of the famous Musician series. Macerated raisin honey processing that yields intense dried strawberry, red cherry liqueur, and Madagascar vanilla.',
      tastingNotes: 'Dried Strawberry, Red Cherry Liqueur, Vanilla Pod, Jasmine',
    },
    {
      roasterId: roaster3.id,
      name: 'Toraja Sapan Minanga - Fully Washed',
      origin: 'North Toraja, South Sulawesi, Indonesia',
      farmOrStation: 'Sapan Village Smallholders',
      varietal: 'S795, Typica',
      process: 'WASHED',
      roastLevel: 'MEDIUM',
      altitudeMasl: 1750,
      stockGrams: 4100,
      minStockThreshold: 800,
      price: 130000,
      bagSizeGrams: 250,
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
      description: 'Crisp herbal sweetness with sparkling lime acidity, cedar wood, lemongrass, and rich dark molasses finish.',
      tastingNotes: 'Key Lime, Lemongrass, Cedarwood, Dark Molasses',
    },
    {
      roasterId: roaster1.id,
      name: 'Java Preanger Gunung Halu - Honey Anaerobic',
      origin: 'Bandung Barat, West Java, Indonesia',
      farmOrStation: 'Gunung Halu Farmer Collective',
      varietal: 'Sigarar Utang',
      process: 'HONEY',
      roastLevel: 'LIGHT_MEDIUM',
      altitudeMasl: 1450,
      stockGrams: 3600,
      minStockThreshold: 700,
      price: 140000,
      bagSizeGrams: 250,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600',
      description: 'Dense syrupy mouthfeel with notes of golden honeycomb, ripe mango, sweet tobacco, and dried yellow plum.',
      tastingNotes: 'Golden Honeycomb, Ripe Mango, Sweet Tobacco, Yellow Plum',
    },
  ];

  const createdBeans: any[] = [];
  for (const b of beansData) {
    const bean = await prisma.coffeeBean.create({ data: b });
    createdBeans.push(bean);
  }
  console.log(`✅ Created ${createdBeans.length} Specialty Coffee Beans`);

  // 4. Create 7 Masterclass Brew Recipes with Detailed Nested Pour Steps
  const recipesData = [
    {
      userId: brewer1.id,
      coffeeBeanId: createdBeans[0].id, // Panama Geisha
      title: 'Tetsu Kasuya 4:6 Method (World Brewers Cup Champion)',
      method: 'V60',
      grindSize: 'Coarse (Comandante 28-30 Clicks)',
      coffeeDoseGrams: 20.0,
      targetRatio: 15.0,
      totalWaterMl: 300.0,
      waterTempCelsius: 92,
      totalBrewTimeSeconds: 210,
      difficulty: 'INTERMEDIATE',
      description: 'The world-famous 4:6 method divides water into two parts: first 40% (2 pours) dials in acidity and sweetness; the remaining 60% (3 pours) controls strength and extraction yield.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 50, instruction: 'First pour (50g) in gentle outward spiral. This adjusts higher sweetness balance.' },
        { stepOrder: 2, startTimeSeconds: 45, waterAmountMl: 70, instruction: 'Second pour (70g, total 120g). Let bed completely drain through before next pour.' },
        { stepOrder: 3, startTimeSeconds: 90, waterAmountMl: 60, instruction: 'Third pour (60g, total 180g) controls strength.' },
        { stepOrder: 4, startTimeSeconds: 135, waterAmountMl: 60, instruction: 'Fourth pour (60g, total 240g). Steady center pour.' },
        { stepOrder: 5, startTimeSeconds: 180, waterAmountMl: 60, instruction: 'Final pour (60g up to 300g). Allow full drawdown by 3:30.' },
      ],
    },
    {
      userId: brewer1.id,
      coffeeBeanId: createdBeans[2].id, // Ethiopia Yirgacheffe
      title: 'James Hoffmann Ultimate V60 Single Cup',
      method: 'V60',
      grindSize: 'Medium-Fine (Comandante 18 Clicks)',
      coffeeDoseGrams: 15.0,
      targetRatio: 16.67,
      totalWaterMl: 250.0,
      waterTempCelsius: 98,
      totalBrewTimeSeconds: 195,
      difficulty: 'BEGINNER',
      description: 'Extremely forgiving, high-extraction technique focused on creating a flat, uniform coffee bed and maximizing floral sweetness in washed coffees.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 50, instruction: 'Bloom 50g water (approx 3x dose). Swirl brewer vigorously to ensure no dry pockets.' },
        { stepOrder: 2, startTimeSeconds: 45, waterAmountMl: 100, instruction: 'Pour smoothly up to 150g by 1:15 in gentle concentric circles.' },
        { stepOrder: 3, startTimeSeconds: 75, waterAmountMl: 100, instruction: 'Pour remaining up to 250g by 1:45. Give one gentle swirl to flatten coffee bed.' },
      ],
    },
    {
      userId: brewer2.id,
      coffeeBeanId: createdBeans[3].id, // Colombia Lychee
      title: 'Lance Hedrick 1-2-1 High Agitation V60 Profile',
      method: 'V60',
      grindSize: 'Medium-Coarse (22 Clicks)',
      coffeeDoseGrams: 15.0,
      targetRatio: 16.0,
      totalWaterMl: 240.0,
      waterTempCelsius: 89,
      totalBrewTimeSeconds: 165,
      difficulty: 'ADVANCED',
      description: 'Designed specifically for thermal shock and heavily fermented anaerobic coffees to retain delicate volatile esters without introducing bitterness.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 50, instruction: 'Aggressive bloom pour with 50g. Heavy swirl and let rest until 1:00.' },
        { stepOrder: 2, startTimeSeconds: 60, waterAmountMl: 100, instruction: 'Center pour with high flow rate up to 150g.' },
        { stepOrder: 3, startTimeSeconds: 95, waterAmountMl: 90, instruction: 'Gentle low-height spiral pour up to 240g. Minimal agitation.' },
      ],
    },
    {
      userId: roaster2.id,
      coffeeBeanId: createdBeans[1].id, // Aceh Gayo
      title: 'Inverted AeroPress Championship Recipe',
      method: 'AEROPRESS',
      grindSize: 'Medium (20 Clicks)',
      coffeeDoseGrams: 18.0,
      targetRatio: 11.1,
      totalWaterMl: 200.0,
      waterTempCelsius: 85,
      totalBrewTimeSeconds: 120,
      difficulty: 'INTERMEDIATE',
      description: 'Championship inverted technique. Lower brewing temperature highlights ripe fruit sweetness and body while taming any roasty notes.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 100, instruction: 'Inverted position. Pour 100g water at 85°C and paddle stir 15 times.' },
        { stepOrder: 2, startTimeSeconds: 30, waterAmountMl: 100, instruction: 'Pour remaining up to 200g. Attach pre-rinsed paper cap, push out remaining air.' },
        { stepOrder: 3, startTimeSeconds: 80, waterAmountMl: 0, instruction: 'Carefully flip over server and press down smoothly for 35 seconds.' },
      ],
    },
    {
      userId: brewer3.id,
      coffeeBeanId: createdBeans[4].id, // Java Ijen
      title: 'Kalita Wave 155 Triple Pulse Sweetness',
      method: 'KALITA_WAVE',
      grindSize: 'Medium (21 Clicks)',
      coffeeDoseGrams: 15.0,
      targetRatio: 15.0,
      totalWaterMl: 225.0,
      waterTempCelsius: 93,
      totalBrewTimeSeconds: 180,
      difficulty: 'BEGINNER',
      description: 'Flat-bottom dripper profile creating maximum syrupy sweetness, round chocolate notes, and consistent extraction across the entire flat bed.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 45, instruction: 'Bloom 45g in center circles. Rest 40 seconds.' },
        { stepOrder: 2, startTimeSeconds: 40, waterAmountMl: 90, instruction: 'Second pulse up to 135g. Keep water level low.' },
        { stepOrder: 3, startTimeSeconds: 85, waterAmountMl: 90, instruction: 'Final pulse up to 225g. Allow water to draw down completely by 3:00.' },
      ],
    },
    {
      userId: roaster3.id,
      coffeeBeanId: createdBeans[8].id, // Toraja Sapan
      title: 'French Press Zero-Fines Clean Decant',
      method: 'FRENCH_PRESS',
      grindSize: 'Medium-Coarse',
      coffeeDoseGrams: 30.0,
      targetRatio: 16.67,
      totalWaterMl: 500.0,
      waterTempCelsius: 96,
      totalBrewTimeSeconds: 480,
      difficulty: 'BEGINNER',
      description: 'Full immersion technique that leaves virtually zero sediment in your cup. The grinds settle naturally without pushing the plunger to the bottom.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 500, instruction: 'Pour all 500g boiling water directly onto grinds. Do not stir yet. Let steep 4 mins.' },
        { stepOrder: 2, startTimeSeconds: 240, waterAmountMl: 0, instruction: 'At 4:00, gently stir crust on top. Most grinds will sink. Skim off remaining white foam.' },
        { stepOrder: 3, startTimeSeconds: 420, waterAmountMl: 0, instruction: 'At 7:00, insert plunger just beneath liquid level. Decant gently into cup.' },
      ],
    },
    {
      userId: brewer1.id,
      coffeeBeanId: createdBeans[6].id, // Bali Kintamani
      title: 'Kyoto-Style Toddy Cold Brew Concentrate',
      method: 'COLD_BREW',
      grindSize: 'Extra-Coarse (Sea Salt Texture)',
      coffeeDoseGrams: 100.0,
      targetRatio: 8.0,
      totalWaterMl: 800.0,
      waterTempCelsius: 22,
      totalBrewTimeSeconds: 50400, // 14 hours
      difficulty: 'BEGINNER',
      description: 'Slow room temperature immersion. Produces a velvety, low-acidity coffee concentrate with sweet citrus and dark cocoa finish.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 800, instruction: 'Combine 100g coarse coffee grinds with 800g cold filtered water in jar. Stir 20s.' },
        { stepOrder: 2, startTimeSeconds: 50400, waterAmountMl: 0, instruction: 'After 14 hours steep, decant through dual paper filters. Serve over ice with tonic.' },
      ],
    },
    {
      userId: brewer1.id,
      coffeeBeanId: createdBeans[9].id, // Java Preanger
      title: 'Classic Velvet Caffè Latte (Double Espresso Base)',
      method: 'CAFE_LATTE',
      grindSize: 'Fine (Espresso Setting - 8 Clicks)',
      coffeeDoseGrams: 18.0,
      targetRatio: 12.0,
      totalWaterMl: 216.0,
      waterTempCelsius: 65,
      totalBrewTimeSeconds: 60,
      difficulty: 'BEGINNER',
      description: 'The world benchmark espresso milk drink. Harmonious blend of rich double espresso and sweet, creamy steamed whole milk with a 1cm microfoam blanket.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 36, instruction: 'Extract 36g double espresso (18g in -> 36g out in 28s) into pre-warmed 220ml ceramic latte glass.' },
        { stepOrder: 2, startTimeSeconds: 30, waterAmountMl: 180, instruction: 'Steam 180g fresh whole milk to 60-65°C creating velvety, glossy wet microfoam (paint-like texture).' },
        { stepOrder: 3, startTimeSeconds: 50, waterAmountMl: 0, instruction: 'Integrate milk into espresso base and pour tulip or rosetta latte art with silky 1cm microfoam cap.' },
      ],
    },
    {
      userId: roaster1.id,
      coffeeBeanId: createdBeans[1].id, // Aceh Gayo
      title: 'Traditional Italian Cappuccino (Pillow Microfoam)',
      method: 'CAPPUCCINO',
      grindSize: 'Fine (Espresso Setting)',
      coffeeDoseGrams: 18.0,
      targetRatio: 8.5,
      totalWaterMl: 153.0,
      waterTempCelsius: 65,
      totalBrewTimeSeconds: 55,
      difficulty: 'INTERMEDIATE',
      description: 'Follows the classic 1:1:1 rule of espresso, hot milk, and deep aerated foam. Dense chocolatey espresso base crowned with a thick, velvety 2cm microfoam pillow.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 36, instruction: 'Extract 36g dense double espresso into traditional 180ml ceramic cappuccino cup.' },
        { stepOrder: 2, startTimeSeconds: 30, waterAmountMl: 117, instruction: 'Aerate 117g milk with deep rolling vortex to build 2cm thick, pillow-soft microfoam.' },
        { stepOrder: 3, startTimeSeconds: 45, waterAmountMl: 0, instruction: 'Pour steadily into center creating classic white foam circle ringed by dark golden crema.' },
      ],
    },
    {
      userId: brewer2.id,
      coffeeBeanId: createdBeans[6].id, // Bali Kintamani
      title: 'Melbourne Aussie Flat White (Double Ristretto)',
      method: 'FLAT_WHITE',
      grindSize: 'Fine (Espresso Setting)',
      coffeeDoseGrams: 19.0,
      targetRatio: 8.0,
      totalWaterMl: 152.0,
      waterTempCelsius: 62,
      totalBrewTimeSeconds: 50,
      difficulty: 'INTERMEDIATE',
      description: 'Originated in Australia & New Zealand. Uses a short double ristretto for intense sweet coffee core with barely 5mm of silky microfoam on top.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 34, instruction: 'Extract double ristretto (19g in -> 34g out in 22s) for sweeter, concentrated coffee core.' },
        { stepOrder: 2, startTimeSeconds: 25, waterAmountMl: 118, instruction: 'Steam 118g milk with ultra-silky microfoam (glossy finish with barely 5mm foam depth).' },
        { stepOrder: 3, startTimeSeconds: 40, waterAmountMl: 0, instruction: 'Pour flat, seamless surface allowing rich coffee intensity to dominate each sip.' },
      ],
    },
    {
      userId: brewer3.id,
      coffeeBeanId: createdBeans[2].id, // Ethiopia Yirgacheffe
      title: 'Classic Americano / Long Black (Crema Intact)',
      method: 'AMERICANO',
      grindSize: 'Fine (Espresso Setting)',
      coffeeDoseGrams: 18.0,
      targetRatio: 10.0,
      totalWaterMl: 180.0,
      waterTempCelsius: 85,
      totalBrewTimeSeconds: 45,
      difficulty: 'BEGINNER',
      description: 'Long Black Australian style: hot water poured first, then double espresso gently pulled over top to preserve the aromatic tiger-stripe crema.',
      isPublic: true,
      pourSteps: [
        { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 144, instruction: 'Pour 144ml hot filtered water at 85°C into cup first (Long Black style).' },
        { stepOrder: 2, startTimeSeconds: 15, waterAmountMl: 36, instruction: 'Extract 36g double espresso directly floating on top of hot water to preserve golden crema.' },
      ],
    },
  ];

  const createdRecipes: any[] = [];
  for (const r of recipesData) {
    const { pourSteps, ...recipeFields } = r;
    const recipe = await prisma.brewRecipe.create({
      data: {
        ...recipeFields,
        pourSteps: {
          create: pourSteps,
        },
      },
      include: { pourSteps: true },
    });
    createdRecipes.push(recipe);
  }
  console.log(`✅ Created ${createdRecipes.length} Masterclass Brew Recipes with Pour Steps`);

  // 5. Create Realistic Barista Community Reviews & Ratings
  const reviewsData = [
    {
      recipeId: createdRecipes[0].id,
      userId: brewer2.id,
      rating: 5,
      comment: 'The 4:6 ratio works wonders on Geisha! Crisp bergamot clarity with zero astringency.',
    },
    {
      recipeId: createdRecipes[0].id,
      userId: brewer3.id,
      rating: 5,
      comment: 'Super consistent method. First pour at 50g really dialed in the floral sweetness.',
    },
    {
      recipeId: createdRecipes[1].id,
      userId: brewer1.id,
      rating: 5,
      comment: 'My everyday standard recipe. The swirl during bloom guarantees zero channeling.',
    },
    {
      recipeId: createdRecipes[1].id,
      userId: roaster2.id,
      rating: 4,
      comment: 'Great cup clarity on washed Yirgacheffe. Recommend water temp at 96°C if grinding finer.',
    },
    {
      recipeId: createdRecipes[2].id,
      userId: brewer1.id,
      rating: 5,
      comment: 'Lance Hedrick technique really shines with thermal shock coffees. The lychee notes exploded!',
    },
    {
      recipeId: createdRecipes[3].id,
      userId: brewer3.id,
      rating: 5,
      comment: '85°C water temp for anaerobic Gayo is spot on. Juicy body without the heavy fermentation funk.',
    },
    {
      recipeId: createdRecipes[4].id,
      userId: roaster1.id,
      rating: 5,
      comment: 'The Kalita Wave flat bed provides such a rounded sweetness on Ijen beans. Highly recommended.',
    },
  ];

  for (const rev of reviewsData) {
    await prisma.review.create({ data: rev });
  }
  console.log(`✅ Created ${reviewsData.length} Community Reviews & Ratings`);

  console.log('🎉 Seeding completed successfully! Database is loaded with rich specialty coffee data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
