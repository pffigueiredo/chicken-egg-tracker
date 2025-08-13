import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable } from '../db/schema';
import { type CreateChickenInput } from '../schema';
import { createChicken } from '../handlers/create_chicken';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateChickenInput = {
  name: 'Henrietta',
  breed: 'Rhode Island Red'
};

describe('createChicken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chicken', async () => {
    const result = await createChicken(testInput);

    // Basic field validation
    expect(result.name).toEqual('Henrietta');
    expect(result.breed).toEqual('Rhode Island Red');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chicken to database', async () => {
    const result = await createChicken(testInput);

    // Query using proper drizzle syntax
    const chickens = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, result.id))
      .execute();

    expect(chickens).toHaveLength(1);
    expect(chickens[0].name).toEqual('Henrietta');
    expect(chickens[0].breed).toEqual('Rhode Island Red');
    expect(chickens[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple chickens with different names', async () => {
    const chicken1 = await createChicken({
      name: 'Clucky',
      breed: 'Leghorn'
    });

    const chicken2 = await createChicken({
      name: 'Feathers',
      breed: 'Buff Orpington'
    });

    // Verify both chickens were created with different IDs
    expect(chicken1.id).not.toEqual(chicken2.id);
    expect(chicken1.name).toEqual('Clucky');
    expect(chicken2.name).toEqual('Feathers');

    // Verify both are saved in database
    const allChickens = await db.select()
      .from(chickensTable)
      .execute();

    expect(allChickens).toHaveLength(2);
    expect(allChickens.map(c => c.name)).toContain('Clucky');
    expect(allChickens.map(c => c.name)).toContain('Feathers');
  });

  it('should handle chickens with same breed but different names', async () => {
    const chicken1 = await createChicken({
      name: 'First Rhode',
      breed: 'Rhode Island Red'
    });

    const chicken2 = await createChicken({
      name: 'Second Rhode',
      breed: 'Rhode Island Red'
    });

    expect(chicken1.breed).toEqual(chicken2.breed);
    expect(chicken1.name).not.toEqual(chicken2.name);
    expect(chicken1.id).not.toEqual(chicken2.id);

    // Both should be persisted correctly
    const sameBreedChickens = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.breed, 'Rhode Island Red'))
      .execute();

    expect(sameBreedChickens).toHaveLength(2);
  });

  it('should auto-generate created_at timestamp', async () => {
    const beforeCreation = new Date();
    
    const result = await createChicken(testInput);
    
    const afterCreation = new Date();

    // Verify created_at is within reasonable bounds
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});