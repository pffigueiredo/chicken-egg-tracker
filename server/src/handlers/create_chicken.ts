import { db } from '../db';
import { chickensTable } from '../db/schema';
import { type CreateChickenInput, type Chicken } from '../schema';

export const createChicken = async (input: CreateChickenInput): Promise<Chicken> => {
  try {
    // Insert chicken record
    const result = await db.insert(chickensTable)
      .values({
        name: input.name,
        breed: input.breed
      })
      .returning()
      .execute();

    // Return the created chicken
    const chicken = result[0];
    return {
      id: chicken.id,
      name: chicken.name,
      breed: chicken.breed,
      created_at: chicken.created_at
    };
  } catch (error) {
    console.error('Chicken creation failed:', error);
    throw error;
  }
};