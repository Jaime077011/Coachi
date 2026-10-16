import { z } from "zod";
import { base, id, weightKg } from "./common";

/**
 * What a gym can have. The client ticks what his gym has; each exercise lists the items it
 * needs, so the coach's builder knows which exercises fit that gym.
 */
export const gymItem = z.enum([
  // Free weights
  "barbell",
  "ez_bar",
  "dumbbells",
  "kettlebells",
  "bands",
  // Racks and benches
  "squat_rack",
  "flat_bench",
  "adjustable_bench",
  "pull_up_bar",
  "dip_station",
  "smith_machine",
  // Cables
  "cable_crossover",
  "lat_pulldown",
  "seated_row",
  // Machines
  "chest_press",
  "pec_deck",
  "shoulder_press_machine",
  "leg_press",
  "hack_squat",
  "leg_extension",
  "leg_curl",
  "hip_thrust_machine",
  "hip_abductor",
  "calf_raise_machine",
  "assisted_pull_up",
  // Cardio
  "treadmill",
  "bike",
  "elliptical",
  "rower",
  "stair_climber",
]);
export type GymItem = z.infer<typeof gymItem>;

export const gymGroup = z.enum(["free_weights", "racks", "cables", "machines", "cardio"]);
export type GymGroup = z.infer<typeof gymGroup>;

/** How the gym list is shown: grouped like a gym floor. */
export const gymItemGroups: Record<GymGroup, GymItem[]> = {
  free_weights: ["barbell", "ez_bar", "dumbbells", "kettlebells", "bands"],
  racks: ["squat_rack", "flat_bench", "adjustable_bench", "pull_up_bar", "dip_station", "smith_machine"],
  cables: ["cable_crossover", "lat_pulldown", "seated_row"],
  machines: [
    "chest_press",
    "pec_deck",
    "shoulder_press_machine",
    "leg_press",
    "hack_squat",
    "leg_extension",
    "leg_curl",
    "hip_thrust_machine",
    "hip_abductor",
    "calf_raise_machine",
    "assisted_pull_up",
  ],
  cardio: ["treadmill", "bike", "elliptical", "rower", "stair_climber"],
};

/** The client's own gym: filled by the client, read (and fixable) by his coach. One per client. */
export const clientGym = base.extend({
  client_id: id,
  gym_name: z.string().max(80).nullable(),
  items: z.array(gymItem),
  /** Machines that aren't on the list, in his own words ("T-bar row"). */
  custom_items: z.array(z.string().min(1).max(60)).max(30),
  /** Heaviest dumbbell, so the coach doesn't plan 40 kg in a gym that stops at 25. */
  dumbbells_max_kg: weightKg.nullable(),
  note: z.string().max(500).nullable(),
});
export type ClientGym = z.infer<typeof clientGym>;

export const gymInput = clientGym.pick({ gym_name: true, items: true, custom_items: true, dumbbells_max_kg: true, note: true });
export type GymInput = z.infer<typeof gymInput>;

/** True when the gym has everything the exercise needs. No gym listed yet = don't filter. */
export function fitsGym(exercise: { gym_items: GymItem[] }, gym: Pick<ClientGym, "items"> | null | undefined) {
  if (!gym) return true;
  return exercise.gym_items.every((item) => gym.items.includes(item));
}
