
import { z } from 'zod';

// Program schemas
export const programSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  status: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Program = z.infer<typeof programSchema>;

export const createProgramInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  status: z.string().min(1),
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type CreateProgramInput = z.infer<typeof createProgramInputSchema>;

export const updateProgramInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().min(1).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type UpdateProgramInput = z.infer<typeof updateProgramInputSchema>;

// Asset schemas
export const assetSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  currency: z.string(),
  value: z.number(),
  date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Asset = z.infer<typeof assetSchema>;

export const createAssetInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  currency: z.string().min(1),
  value: z.number(),
  date: z.coerce.date()
});

export type CreateAssetInput = z.infer<typeof createAssetInputSchema>;

export const updateAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  currency: z.string().min(1).optional(),
  value: z.number().optional(),
  date: z.coerce.date().optional()
});

export type UpdateAssetInput = z.infer<typeof updateAssetInputSchema>;

// Trade schemas
export const tradeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  status: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  program_id: z.number(),
  created_at: z.coerce.date()
});

export type Trade = z.infer<typeof tradeSchema>;

export const createTradeInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  status: z.string().min(1),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  program_id: z.number(),
  asset_ids: z.array(z.number()).optional()
});

export type CreateTradeInput = z.infer<typeof createTradeInputSchema>;

export const updateTradeInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().min(1).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  program_id: z.number().optional(),
  asset_ids: z.array(z.number()).optional()
});

export type UpdateTradeInput = z.infer<typeof updateTradeInputSchema>;

// Trade with assets relationship
export const tradeWithAssetsSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  status: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  program_id: z.number(),
  created_at: z.coerce.date(),
  assets: z.array(assetSchema)
});

export type TradeWithAssets = z.infer<typeof tradeWithAssetsSchema>;

// Common input schemas
export const idInputSchema = z.object({
  id: z.number()
});

export type IdInput = z.infer<typeof idInputSchema>;
