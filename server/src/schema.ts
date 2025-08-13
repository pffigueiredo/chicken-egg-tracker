import { z } from 'zod';

// Chicken schema
export const chickenSchema = z.object({
  id: z.number(),
  name: z.string(),
  breed: z.string(),
  created_at: z.coerce.date()
});

export type Chicken = z.infer<typeof chickenSchema>;

// Input schema for creating chickens
export const createChickenInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  breed: z.string().min(1, "Breed is required")
});

export type CreateChickenInput = z.infer<typeof createChickenInputSchema>;

// Input schema for updating chickens
export const updateChickenInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  breed: z.string().min(1).optional()
});

export type UpdateChickenInput = z.infer<typeof updateChickenInputSchema>;

// Egg record schema
export const eggRecordSchema = z.object({
  id: z.number(),
  chicken_id: z.number(),
  date: z.coerce.date(),
  quantity: z.number().int().min(0),
  created_at: z.coerce.date()
});

export type EggRecord = z.infer<typeof eggRecordSchema>;

// Input schema for creating egg records
export const createEggRecordInputSchema = z.object({
  chicken_id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  quantity: z.number().int().min(0, "Quantity must be non-negative")
});

export type CreateEggRecordInput = z.infer<typeof createEggRecordInputSchema>;

// Input schema for updating egg records
export const updateEggRecordInputSchema = z.object({
  id: z.number(),
  chicken_id: z.number().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  quantity: z.number().int().min(0).optional()
});

export type UpdateEggRecordInput = z.infer<typeof updateEggRecordInputSchema>;

// Daily egg summary schema
export const dailyEggSummarySchema = z.object({
  date: z.coerce.date(),
  total_eggs: z.number().int(),
  chickens_laid: z.number().int()
});

export type DailyEggSummary = z.infer<typeof dailyEggSummarySchema>;

// Input schema for getting eggs by date range
export const getEggsByDateRangeInputSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional()
});

export type GetEggsByDateRangeInput = z.infer<typeof getEggsByDateRangeInputSchema>;

// Input schema for getting daily summary by date
export const getDailySummaryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export type GetDailySummaryInput = z.infer<typeof getDailySummaryInputSchema>;