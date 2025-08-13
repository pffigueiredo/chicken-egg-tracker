import { db } from '../db';
import { chickensTable } from '../db/schema';
import { type UpdateChickenInput, type Chicken } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChicken = async (input: UpdateChickenInput): Promise<Chicken> => {
  try {
    // First, verify that the chicken exists
    const existingChicken = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, input.id))
      .execute();

    if (existingChicken.length === 0) {
      throw new Error(`Chicken with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: Partial<{ name: string; breed: string }> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.breed !== undefined) {
      updateData.breed = input.breed;
    }

    // If no fields to update, return existing chicken
    if (Object.keys(updateData).length === 0) {
      return existingChicken[0];
    }

    // Update the chicken record
    const result = await db.update(chickensTable)
      .set(updateData)
      .where(eq(chickensTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Chicken update failed:', error);
    throw error;
  }
};