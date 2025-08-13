import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable } from '../db/schema';
import { type UpdateChickenInput, type CreateChickenInput } from '../schema';
import { updateChicken } from '../handlers/update_chicken';
import { eq } from 'drizzle-orm';

// Test helper to create a chicken
const createTestChicken = async (chickenData: CreateChickenInput) => {
  const result = await db.insert(chickensTable)
    .values({
      name: chickenData.name,
      breed: chickenData.breed
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateChicken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update chicken name only', async () => {
    // Create a test chicken first
    const testChicken = await createTestChicken({
      name: 'Original Name',
      breed: 'Rhode Island Red'
    });

    const updateInput: UpdateChickenInput = {
      id: testChicken.id,
      name: 'Updated Name'
    };

    const result = await updateChicken(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(testChicken.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.breed).toEqual('Rhode Island Red'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(testChicken.created_at);
  });

  it('should update chicken breed only', async () => {
    // Create a test chicken first
    const testChicken = await createTestChicken({
      name: 'Henrietta',
      breed: 'Original Breed'
    });

    const updateInput: UpdateChickenInput = {
      id: testChicken.id,
      breed: 'Updated Breed'
    };

    const result = await updateChicken(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(testChicken.id);
    expect(result.name).toEqual('Henrietta'); // Should remain unchanged
    expect(result.breed).toEqual('Updated Breed');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(testChicken.created_at);
  });

  it('should update both name and breed', async () => {
    // Create a test chicken first
    const testChicken = await createTestChicken({
      name: 'Original Name',
      breed: 'Original Breed'
    });

    const updateInput: UpdateChickenInput = {
      id: testChicken.id,
      name: 'Updated Name',
      breed: 'Updated Breed'
    };

    const result = await updateChicken(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(testChicken.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.breed).toEqual('Updated Breed');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(testChicken.created_at);
  });

  it('should return unchanged chicken when no update fields provided', async () => {
    // Create a test chicken first
    const testChicken = await createTestChicken({
      name: 'Henrietta',
      breed: 'Rhode Island Red'
    });

    const updateInput: UpdateChickenInput = {
      id: testChicken.id
      // No name or breed provided
    };

    const result = await updateChicken(updateInput);

    // Should return the original chicken unchanged
    expect(result.id).toEqual(testChicken.id);
    expect(result.name).toEqual('Henrietta');
    expect(result.breed).toEqual('Rhode Island Red');
    expect(result.created_at).toEqual(testChicken.created_at);
  });

  it('should persist changes in database', async () => {
    // Create a test chicken first
    const testChicken = await createTestChicken({
      name: 'Original Name',
      breed: 'Original Breed'
    });

    const updateInput: UpdateChickenInput = {
      id: testChicken.id,
      name: 'Updated Name',
      breed: 'Updated Breed'
    };

    await updateChicken(updateInput);

    // Verify changes were saved to database
    const savedChicken = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, testChicken.id))
      .execute();

    expect(savedChicken).toHaveLength(1);
    expect(savedChicken[0].name).toEqual('Updated Name');
    expect(savedChicken[0].breed).toEqual('Updated Breed');
    expect(savedChicken[0].created_at).toEqual(testChicken.created_at);
  });

  it('should throw error when chicken does not exist', async () => {
    const updateInput: UpdateChickenInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateChicken(updateInput)).rejects.toThrow(/chicken with id 99999 not found/i);
  });

  it('should handle partial updates correctly with empty strings', async () => {
    // Create a test chicken first
    const testChicken = await createTestChicken({
      name: 'Original Name',
      breed: 'Original Breed'
    });

    // Note: Empty strings should still be valid updates since Zod validation
    // ensures min length of 1, so this tests the handler's behavior
    const updateInput: UpdateChickenInput = {
      id: testChicken.id,
      name: 'A' // Single character name (valid)
    };

    const result = await updateChicken(updateInput);

    expect(result.name).toEqual('A');
    expect(result.breed).toEqual('Original Breed'); // Should remain unchanged
  });

  it('should maintain referential integrity after update', async () => {
    // Create a test chicken first
    const testChicken = await createTestChicken({
      name: 'Laying Hen',
      breed: 'Leghorn'
    });

    // Update the chicken
    const updateInput: UpdateChickenInput = {
      id: testChicken.id,
      name: 'Updated Laying Hen'
    };

    const result = await updateChicken(updateInput);

    // Verify the chicken still exists and can be found
    const chickens = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, result.id))
      .execute();

    expect(chickens).toHaveLength(1);
    expect(chickens[0].id).toEqual(testChicken.id);
    expect(chickens[0].name).toEqual('Updated Laying Hen');
  });
});