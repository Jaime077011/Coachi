import { z } from "zod";

/**
 * Shared building blocks. Storage rules from the Full Spec ("Store data the boring, safe way"):
 * times in UTC (ISO strings), weight in kg, length in cm, money as whole piasters + currency,
 * soft delete via deleted_at.
 */

export const id = z.uuid();
export const timestamp = z.iso.datetime({ offset: true });
export const date = z.iso.date();

export const timestamps = {
  created_at: timestamp,
  updated_at: timestamp,
  deleted_at: timestamp.nullable(),
};

/** Every main table: id + timestamps. */
export const base = z.object({ id, ...timestamps });

/** Tables that belong to an organization. */
export const orgScoped = base.extend({ org_id: id });

export const locale = z.enum(["ar", "en"]);
export type Locale = z.infer<typeof locale>;

/** Same text in both languages (exercise and food names). */
export const bilingual = { name_ar: z.string().min(1), name_en: z.string().min(1) };

export const currency = z.enum(["EGP", "SAR", "AED"]);
export const piasters = z.number().int().nonnegative();

/** Egyptian mobile in E.164 form, e.g. +201001234567. Gulf numbers come later. */
export const phone = z.string().regex(/^\+\d{8,15}$/, "phone");
export const email = z.email();

export const weightKg = z.number().nonnegative().max(500);
export const lengthCm = z.number().nonnegative().max(300);

export const goal = z.enum(["fat_loss", "muscle", "strength", "health"]);
export type Goal = z.infer<typeof goal>;

export const gender = z.enum(["male", "female"]);

export const dayOfWeek = z.number().int().min(0).max(6); // 0 = Sunday

export const storagePath = z.string().min(1);
export const url = z.url();
