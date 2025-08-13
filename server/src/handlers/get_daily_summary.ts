import { db } from '../db';
import { eggRecordsTable } from '../db/schema';
import { sql, desc, gte } from 'drizzle-orm';
import { type GetDailySummaryInput, type DailyEggSummary } from '../schema';

export async function getDailySummary(input: GetDailySummaryInput): Promise<DailyEggSummary> {
  try {
    // Parse the input date string to a Date object for SQL operations
    const targetDate = new Date(input.date);
    
    // Query to get total eggs and count of chickens that laid eggs for the specific date
    const result = await db
      .select({
        total_eggs: sql<number>`sum(${eggRecordsTable.quantity})::integer`,
        chickens_laid: sql<number>`count(distinct ${eggRecordsTable.chicken_id})::integer`
      })
      .from(eggRecordsTable)
      .where(sql`${eggRecordsTable.date} = ${input.date}`)
      .execute();

    // Handle case where no records exist for the date
    const summary = result[0];
    return {
      date: targetDate,
      total_eggs: summary.total_eggs || 0,
      chickens_laid: summary.chickens_laid || 0
    };
  } catch (error) {
    console.error('Failed to get daily summary:', error);
    throw error;
  }
}

export async function getRecentDailySummaries(days: number = 7): Promise<DailyEggSummary[]> {
  try {
    // Calculate the start date (N days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Query to get daily summaries for the recent days
    const results = await db
      .select({
        date: eggRecordsTable.date,
        total_eggs: sql<number>`sum(${eggRecordsTable.quantity})::integer`,
        chickens_laid: sql<number>`count(distinct ${eggRecordsTable.chicken_id})::integer`
      })
      .from(eggRecordsTable)
      .where(gte(eggRecordsTable.date, startDateStr))
      .groupBy(eggRecordsTable.date)
      .orderBy(desc(eggRecordsTable.date))
      .execute();

    // Convert results to proper format
    return results.map(result => ({
      date: new Date(result.date),
      total_eggs: result.total_eggs || 0,
      chickens_laid: result.chickens_laid || 0
    }));
  } catch (error) {
    console.error('Failed to get recent daily summaries:', error);
    throw error;
  }
}