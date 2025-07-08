import { db } from "./db";
import { users, activities, recommendations } from "@shared/schema";

const sampleActivities = [
  {
    name: "Cozy Coffee Date",
    description: "A quiet morning coffee at a local café with intimate seating",
    category: "dining",
    location: "Downtown Coffee Co.",
    rating: 4.8,
    distance: "0.3 miles",
    personalityMatch: "Thoughtful Harmonizer",
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=300&fit=crop"
  },
  {
    name: "Art Gallery Visit",
    description: "Explore contemporary art and discuss your favorite pieces",
    category: "cultural",
    location: "Modern Art Gallery",
    rating: 4.6,
    distance: "1.2 miles",
    personalityMatch: "Emotional Connector",
    imageUrl: "https://images.unsplash.com/photo-1544967882-430d38c333ac?w=500&h=300&fit=crop"
  },
  {
    name: "Hiking Adventure",
    description: "Nature trail with beautiful views and fresh air",
    category: "outdoor",
    location: "Mountain Trail Park",
    rating: 4.9,
    distance: "5.4 miles",
    personalityMatch: "Adventure Seeker",
    imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&h=300&fit=crop"
  },
  {
    name: "Cooking Class",
    description: "Learn to make pasta together in a fun, interactive class",
    category: "active",
    location: "Culinary Institute",
    rating: 4.7,
    distance: "2.1 miles",
    personalityMatch: "Nurturing Caregiver",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=300&fit=crop"
  },
  {
    name: "Bookstore Browse",
    description: "Spend hours browsing books and sharing recommendations",
    category: "cultural",
    location: "Page Turner Books",
    rating: 4.5,
    distance: "0.8 miles",
    personalityMatch: "Quiet Confidant",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop"
  },
  {
    name: "Wine Tasting",
    description: "Sample local wines while learning about the winemaking process",
    category: "dining",
    location: "Valley Vineyards",
    rating: 4.8,
    distance: "8.3 miles",
    personalityMatch: "Social Butterfly",
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&h=300&fit=crop"
  }
];

export async function seedDatabase() {
  try {
    // Seed activities
    console.log("Seeding activities...");
    await db.insert(activities).values(sampleActivities);
    console.log("Activities seeded successfully!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log("Database seeding complete!");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}