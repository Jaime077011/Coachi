import { z } from "zod";
import { base, goal, id, locale, orgScoped, piasters, url } from "./common";

export const specialty = z.enum(["fat_loss", "muscle", "womens_training", "sports", "rehab", "strength"]);
export const coachingMode = z.enum(["online", "in_person", "both"]);

/** The coach's landing page link: coachi.app/c/<slug>. Lowercase letters, numbers, and dashes. */
export const slug = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "slug");

/** What the coach sells, shown on his landing page. */
export const coachPackage = orgScoped.extend({
  coach_id: id,
  name: z.string().min(1).max(60),
  price_piasters: piasters,
  weeks: z.number().int().min(1).max(52),
  includes: z.array(z.string().min(1).max(80)).max(8),
  highlighted: z.boolean(),
  order: z.number().int().nonnegative(),
});
export type CoachPackage = z.infer<typeof coachPackage>;

/** The packages editor saves the whole list at once. */
export const packageInput = coachPackage.pick({ name: true, price_piasters: true, weeks: true, includes: true, highlighted: true }).extend({
  id: id.optional(),
});
export type PackageInput = z.infer<typeof packageInput>;
export const MAX_PACKAGES = 4;

/** Public coach profile, kept apart from private data. */
export const coachProfile = orgScoped.extend({
  profile_id: id,
  name: z.string().min(1).max(80),
  photo_url: url.nullable(),
  bio: z.string().max(600),
  specialties: z.array(specialty),
  city: z.string().min(1),
  mode: coachingMode,
  gym: z.string().nullable(),
  languages: z.array(locale).min(1),
  years: z.number().int().min(0).max(60),
  certificates: z.array(z.string().min(1)),
  price_min_piasters: z.number().int().nonnegative().nullable(),
  price_max_piasters: z.number().int().nonnegative().nullable(),
  instagram: z.string().nullable(),
  whatsapp: z.string().nullable(),
  gender: z.enum(["male", "female"]),
  open_for_clients: z.boolean(),
  listed: z.boolean(),
  featured: z.boolean(),
  // Landing page at /c/<slug>
  slug,
  headline: z.string().max(120).nullable(),
  cover_url: url.nullable(),
  page_published: z.boolean(),
  show_team: z.boolean(),
});
export type CoachProfile = z.infer<typeof coachProfile>;

/** What a client sees in the directory list. */
export const coachCard = coachProfile.pick({
  id: true,
  name: true,
  photo_url: true,
  specialties: true,
  city: true,
  mode: true,
  price_min_piasters: true,
  price_max_piasters: true,
  featured: true,
  gender: true,
  languages: true,
});
export type CoachCard = z.infer<typeof coachCard>;

export const coachResult = base.extend({
  coach_id: id,
  before_url: url,
  after_url: url,
  caption: z.string().max(200).nullable(),
  client_ok: z.literal(true),
});
export type CoachResult = z.infer<typeof coachResult>;

export const requestStatus = z.enum(["sent", "accepted", "declined"]);
export const requestSource = z.enum(["directory", "landing"]);

/** A request shares only name, goal, and a short message. The intake form comes after accept. */
export const coachRequest = base.extend({
  client_id: id,
  coach_id: id,
  client_name: z.string(),
  /** Shared only when the client chose WhatsApp as the way to contact them. */
  client_phone: z.string().nullable(),
  goal,
  message: z.string().max(300),
  contact_by: z.enum(["app", "whatsapp"]),
  status: requestStatus,
  reply: z.string().max(300).nullable(),
  source: requestSource,
  package_id: id.nullable(),
});
export type CoachRequest = z.infer<typeof coachRequest>;

export const sendRequest = z.object({
  coach_id: id,
  goal,
  message: z.string().max(300),
  contact_by: z.enum(["app", "whatsapp"]),
  source: requestSource.optional(),
  package_id: id.nullable().optional(),
});
export type SendRequest = z.infer<typeof sendRequest>;

export const directoryFilters = z.object({
  search: z.string().optional(),
  goal: goal.optional(),
  city: z.string().optional(),
  mode: coachingMode.optional(),
  women_coaches: z.boolean().optional(),
  max_price_piasters: piasters.optional(),
  language: locale.optional(),
});
export type DirectoryFilters = z.infer<typeof directoryFilters>;
