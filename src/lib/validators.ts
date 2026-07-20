import { z } from "zod";

// ─── Бронювання столика ───────────────────────────────────
export const ReserveSchema = z.object({
  venueId: z.string().cuid(),
  tableId: z.string().cuid().optional(),
  name: z.string().min(1).max(80),
  phone: z.string().min(9).max(20),
  guests: z.number().int().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  hours: z.number().int().min(1).max(6).default(1),
  comment: z.string().max(400).optional(),
});
export type ReserveInput = z.infer<typeof ReserveSchema>;

// ─── Тіло запиту від /api/checkout ────────────────────────
export const CreateOrderSchema = z.object({
  venueId: z.string().cuid(),
  type: z.enum(["DELIVERY", "PICKUP", "DINE_IN"]),
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().min(9).max(20),
  address: z.string().max(200).optional(),
  tableCode: z.string().optional(),
  comment: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        dishId: z.string().cuid(),
        quantity: z.number().int().min(1).max(99),
        comment: z.string().max(200).optional(),
      })
    )
    .min(1)
    .max(50),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;