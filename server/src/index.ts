
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createProgramInputSchema, 
  updateProgramInputSchema, 
  createAssetInputSchema, 
  updateAssetInputSchema, 
  createTradeInputSchema, 
  updateTradeInputSchema,
  idInputSchema 
} from './schema';

// Import handlers
import { createProgram } from './handlers/create_program';
import { getPrograms } from './handlers/get_programs';
import { getProgram } from './handlers/get_program';
import { updateProgram } from './handlers/update_program';
import { deleteProgram } from './handlers/delete_program';

import { createAsset } from './handlers/create_asset';
import { getAssets } from './handlers/get_assets';
import { getAsset } from './handlers/get_asset';
import { updateAsset } from './handlers/update_asset';
import { deleteAsset } from './handlers/delete_asset';

import { createTrade } from './handlers/create_trade';
import { getTrades } from './handlers/get_trades';
import { getTrade } from './handlers/get_trade';
import { updateTrade } from './handlers/update_trade';
import { deleteTrade } from './handlers/delete_trade';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Program routes
  createProgram: publicProcedure
    .input(createProgramInputSchema)
    .mutation(({ input }) => createProgram(input)),
  getPrograms: publicProcedure
    .query(() => getPrograms()),
  getProgram: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getProgram(input)),
  updateProgram: publicProcedure
    .input(updateProgramInputSchema)
    .mutation(({ input }) => updateProgram(input)),
  deleteProgram: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteProgram(input)),

  // Asset routes
  createAsset: publicProcedure
    .input(createAssetInputSchema)
    .mutation(({ input }) => createAsset(input)),
  getAssets: publicProcedure
    .query(() => getAssets()),
  getAsset: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getAsset(input)),
  updateAsset: publicProcedure
    .input(updateAssetInputSchema)
    .mutation(({ input }) => updateAsset(input)),
  deleteAsset: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteAsset(input)),

  // Trade routes
  createTrade: publicProcedure
    .input(createTradeInputSchema)
    .mutation(({ input }) => createTrade(input)),
  getTrades: publicProcedure
    .query(() => getTrades()),
  getTrade: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getTrade(input)),
  updateTrade: publicProcedure
    .input(updateTradeInputSchema)
    .mutation(({ input }) => updateTrade(input)),
  deleteTrade: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteTrade(input)),
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
