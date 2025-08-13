import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable } from '../db/schema';
import { getChickens } from '../handlers/get_chickens';

describe('getChickens', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no chickens exist', async () => {
    const result = await getChickens();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all chickens from database', async () => {
    // Create test chickens
    const testChickens = [
      { name: 'Henrietta', breed: 'Rhode Island Red' },
      { name: 'Clucky', breed: 'Leghorn' },
      { name: 'Bertha', breed: 'Sussex' }
    ];

    // Insert test chickens into database
    await db.insert(chickensTable)
      .values(testChickens)
      .execute();

    const result = await getChickens();

    // Should return all 3 chickens
    expect(result).toHaveLength(3);
    
    // Verify all chickens are returned with correct structure
    result.forEach(chicken => {
      expect(chicken.id).toBeDefined();
      expect(typeof chicken.id).toBe('number');
      expect(chicken.name).toBeDefined();
      expect(typeof chicken.name).toBe('string');
      expect(chicken.breed).toBeDefined();
      expect(typeof chicken.breed).toBe('string');
      expect(chicken.created_at).toBeInstanceOf(Date);
    });

    // Check specific chickens are included
    const chickenNames = result.map(c => c.name);
    expect(chickenNames).toContain('Henrietta');
    expect(chickenNames).toContain('Clucky');
    expect(chickenNames).toContain('Bertha');

    const chickenBreeds = result.map(c => c.breed);
    expect(chickenBreeds).toContain('Rhode Island Red');
    expect(chickenBreeds).toContain('Leghorn');
    expect(chickenBreeds).toContain('Sussex');
  });

  it('should return chickens in correct order with proper timestamps', async () => {
    // Create chickens with slight delay to test ordering
    await db.insert(chickensTable)
      .values({ name: 'First Chicken', breed: 'Breed A' })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(chickensTable)
      .values({ name: 'Second Chicken', breed: 'Breed B' })
      .execute();

    const result = await getChickens();

    expect(result).toHaveLength(2);

    // Verify timestamps are valid dates
    result.forEach(chicken => {
      expect(chicken.created_at).toBeInstanceOf(Date);
      expect(chicken.created_at.getTime()).toBeLessThanOrEqual(Date.now());
    });

    // Verify data integrity
    const firstChicken = result.find(c => c.name === 'First Chicken');
    const secondChicken = result.find(c => c.name === 'Second Chicken');

    expect(firstChicken).toBeDefined();
    expect(firstChicken!.breed).toBe('Breed A');
    expect(secondChicken).toBeDefined();
    expect(secondChicken!.breed).toBe('Breed B');
  });

  it('should handle database with single chicken correctly', async () => {
    // Insert a single chicken
    const singleChicken = { name: 'Lonely Hen', breed: 'Bantam' };
    
    await db.insert(chickensTable)
      .values(singleChicken)
      .execute();

    const result = await getChickens();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Lonely Hen');
    expect(result[0].breed).toBe('Bantam');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});