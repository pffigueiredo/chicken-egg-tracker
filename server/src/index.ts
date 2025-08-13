import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createChickenInputSchema, 
  updateChickenInputSchema,
  createEggRecordInputSchema,
  updateEggRecordInputSchema,
  getEggsByDateRangeInputSchema,
  getDailySummaryInputSchema
} from './schema';

// Import handlers
import { createChicken } from './handlers/create_chicken';
import { getChickens } from './handlers/get_chickens';
import { updateChicken } from './handlers/update_chicken';
import { deleteChicken } from './handlers/delete_chicken';
import { createEggRecord } from './handlers/create_egg_record';
import { getEggRecords, getEggRecordsByChicken } from './handlers/get_egg_records';
import { updateEggRecord } from './handlers/update_egg_record';
import { deleteEggRecord } from './handlers/delete_egg_record';
import { getDailySummary, getRecentDailySummaries } from './handlers/get_daily_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Chicken management routes
  createChicken: publicProcedure
    .input(createChickenInputSchema)
    .mutation(({ input }) => createChicken(input)),
  
  getChickens: publicProcedure
    .query(() => getChickens()),
  
  updateChicken: publicProcedure
    .input(updateChickenInputSchema)
    .mutation(({ input }) => updateChicken(input)),
  
  deleteChicken: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteChicken(input.id)),

  // Egg record management routes
  createEggRecord: publicProcedure
    .input(createEggRecordInputSchema)
    .mutation(({ input }) => createEggRecord(input)),
  
  getEggRecords: publicProcedure
    .input(getEggsByDateRangeInputSchema.optional())
    .query(({ input }) => getEggRecords(input)),
  
  getEggRecordsByChicken: publicProcedure
    .input(z.object({ chickenId: z.number() }))
    .query(({ input }) => getEggRecordsByChicken(input.chickenId)),
  
  updateEggRecord: publicProcedure
    .input(updateEggRecordInputSchema)
    .mutation(({ input }) => updateEggRecord(input)),
  
  deleteEggRecord: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteEggRecord(input.id)),

  // Daily summary routes
  getDailySummary: publicProcedure
    .input(getDailySummaryInputSchema)
    .query(({ input }) => getDailySummary(input)),
  
  getRecentDailySummaries: publicProcedure
    .input(z.object({ days: z.number().int().min(1).max(30).optional() }))
    .query(({ input }) => getRecentDailySummaries(input?.days)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();