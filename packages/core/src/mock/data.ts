/**
 * In-memory mock database. Realistic Egyptian data, Arabic and English.
 * Every shape here comes from @coachi/validation, so the Supabase swap changes nothing on screen.
 */
import type {
  AppSettings,
  AuditEntry,
  BodyMetric,
  Checkin,
  CheckinForm,
  Client,
  ClientDetails,
  CoachClient,
  CoachNote,
  CoachPackage,
  CoachProfile,
  CoachRequest,
  CoachResult,
  DailyClientStats,
  Exercise,
  Food,
  Invite,
  JourneyMessage,
  Meal,
  MealItem,
  MealLog,
  Milestone,
  NutritionPlan,
  Organization,
  OrgMember,
  Payment,
  Plan,
  PlanFeature,
  Profile,
  Program,
  ProgramDay,
  ProgramExercise,
  SetLog,
  Subscription,
  WorkoutLog,
} from "@coachi/validation";
import { dateOnly, daysAgo } from "./runtime";

/** Stable, valid v4 UUIDs so mock links survive reloads: uid("c", 1) → ...-c00000000001 */
export const uid = (kind: string, n: number) =>
  `00000000-0000-4000-8000-${kind.padEnd(2, "0").slice(0, 2)}${String(n).padStart(10, "0")}`
    .replace(/[^0-9a-f-]/g, "0");

const KIND = {
  profile: "a1",
  org: "b1",
  member: "b2",
  package: "d4",
  plan: "c1",
  feature: "c2",
  sub: "c3",
  payment: "c4",
  coach: "d1",
  result: "d2",
  request: "d3",
  client: "e1",
  link: "e2",
  details: "e3",
  note: "e4",
  invite: "e5",
  exercise: "f1",
  program: "f2",
  day: "f3",
  item: "f4",
  wlog: "f5",
  slog: "f6",
  food: "a2",
  nplan: "a3",
  meal: "a4",
  mitem: "a5",
  mlog: "a6",
  metric: "a7",
  form: "a8",
  checkin: "a9",
  milestone: "aa",
  jmsg: "ab",
  stat: "ac",
  audit: "ad",
} as const;

const created = (days: number) => ({
  created_at: daysAgo(days),
  updated_at: daysAgo(days),
  deleted_at: null,
});

// ---------------------------------------------------------------- people

type Person = { name: string; phone: string; language: "ar" | "en"; role: Profile["role"] };

const people: Person[] = [
  { name: "Jamal", phone: "+201000000001", language: "ar", role: "super_admin" }, // 1
  { name: "كوتش أحمد سمير", phone: "+201001112233", language: "ar", role: "coach" }, // 2 demo coach
  { name: "Coach Mariam Adel", phone: "+201002223344", language: "en", role: "coach" }, // 3
  { name: "كابتن محمود حسن", phone: "+201003334455", language: "ar", role: "coach" }, // 4
  { name: "Nour El-Sayed", phone: "+201004445566", language: "en", role: "coach" }, // 5
  { name: "كوتش ياسمين فاروق", phone: "+201005556677", language: "ar", role: "coach" }, // 6
  { name: "Karim Fawzy", phone: "+201006667788", language: "ar", role: "coach" }, // 7
  { name: "عمر خالد", phone: "+201111111101", language: "ar", role: "client" }, // 8 demo client
  { name: "سارة محمد", phone: "+201111111102", language: "ar", role: "client" }, // 9
  { name: "Youssef Tarek", phone: "+201111111103", language: "en", role: "client" }, // 10
  { name: "منة الله إبراهيم", phone: "+201111111104", language: "ar", role: "client" }, // 11
  { name: "مصطفى علي", phone: "+201111111105", language: "ar", role: "client" }, // 12
  { name: "Hana Mostafa", phone: "+201111111106", language: "en", role: "client" }, // 13
  { name: "أحمد رضا", phone: "+201111111107", language: "ar", role: "client" }, // 14
  { name: "ندى عادل", phone: "+201111111108", language: "ar", role: "client" }, // 15
  { name: "زياد شريف", phone: "+201111111109", language: "ar", role: "client" }, // 16 no coach yet
  { name: "كوتش هشام مجدي", phone: "+201007778899", language: "ar", role: "coach" }, // 17 Ahmed's head coach
  { name: "Coach Salma Nabil", phone: "+201008889900", language: "en", role: "coach" }, // 18 Ahmed's team coach
  { name: "مروة سعيد", phone: "+201009990011", language: "ar", role: "coach" }, // 19 Ahmed's assistant
];

export const profiles: Profile[] = people.map((p, i) => ({
  id: uid(KIND.profile, i + 1),
  role: p.role,
  name: p.name,
  phone: p.phone,
  email: null,
  avatar_url: null,
  language: p.language,
  time_zone: "Africa/Cairo",
  ...created(120 - i),
}));

export const DEMO = {
  adminProfileId: uid(KIND.profile, 1),
  coachProfileId: uid(KIND.profile, 2),
  coachId: uid(KIND.coach, 1),
  orgId: uid(KIND.org, 1),
  clientProfileId: uid(KIND.profile, 8),
  clientId: uid(KIND.client, 1),
  /** Client with no coach yet: sees the directory as home. */
  loneClientId: uid(KIND.client, 9),
  /** Ahmed's team, by role. The dev switcher signs in as one of them. */
  members: {
    owner: { memberId: uid(KIND.member, 1), profileId: uid(KIND.profile, 2) },
    head_coach: { memberId: uid(KIND.member, 7), profileId: uid(KIND.profile, 17) },
    coach: { memberId: uid(KIND.member, 8), profileId: uid(KIND.profile, 18) },
    assistant: { memberId: uid(KIND.member, 9), profileId: uid(KIND.profile, 19) },
  },
} as const;

// ---------------------------------------------------------------- orgs + billing

const coachPeople = [2, 3, 4, 5, 6, 7];

export const organizations: Organization[] = coachPeople.map((p, i) => ({
  id: uid(KIND.org, i + 1),
  name: people[p - 1]!.name,
  type: "solo",
  logo_url: null,
  city: ["Cairo", "Giza", "Alexandria", "Cairo", "Mansoura", "Cairo"][i]!,
  ...created(100 - i * 5),
}));

export const orgMembers: OrgMember[] = [
  ...coachPeople.map((p, i) => ({
    id: uid(KIND.member, i + 1),
    org_id: uid(KIND.org, i + 1),
    profile_id: uid(KIND.profile, p),
    role: "owner" as const,
    status: "active" as const,
    ...created(100 - i * 5),
  })),
  ...(["head_coach", "coach", "assistant"] as const).map((role, i) => ({
    id: DEMO.members[role].memberId,
    org_id: DEMO.orgId,
    profile_id: DEMO.members[role].profileId,
    role,
    status: "active" as const,
    ...created(60 - i * 15),
  })),
];

export const plans: Plan[] = [
  { id: uid(KIND.plan, 1), name: "Trial", price_piasters: 0, currency: "EGP", days: 14, ...created(150) },
  { id: uid(KIND.plan, 2), name: "Basic", price_piasters: 50000, currency: "EGP", days: 30, ...created(150) },
  { id: uid(KIND.plan, 3), name: "Pro", price_piasters: 90000, currency: "EGP", days: 30, ...created(150) },
];

const featureRows: [number, PlanFeature["key"], PlanFeature["value"]][] = [
  [1, "client_limit", 5],
  [1, "team_seats", 0],
  [1, "nutrition", true],
  [1, "directory_listing", false],
  [1, "ai_credits", 0],
  [1, "branded_app", false],
  [2, "client_limit", 20],
  [2, "team_seats", 1],
  [2, "nutrition", true],
  [2, "directory_listing", true],
  [2, "ai_credits", 0],
  [2, "branded_app", false],
  [3, "client_limit", null],
  [3, "team_seats", 5],
  [3, "nutrition", true],
  [3, "directory_listing", true],
  [3, "ai_credits", 0],
  [3, "branded_app", true],
];

export const planFeatures: PlanFeature[] = featureRows.map(([plan, key, value], i) => ({
  id: uid(KIND.feature, i + 1),
  plan_id: uid(KIND.plan, plan),
  key,
  value,
  ...created(150),
}));

const inDays = (days: number) => daysAgo(-days, 23);

const subRows: [number, Subscription["status"], string, string][] = [
  [3, "active", daysAgo(20), inDays(10)], // Ahmed: Pro
  [2, "ending_soon", daysAgo(25), inDays(5)], // Mariam
  [2, "active", daysAgo(3), inDays(27)], // Mahmoud
  [1, "trial", daysAgo(4), inDays(10)], // Nour
  [2, "expired", daysAgo(40), daysAgo(10)], // Yasmin
  [3, "active", daysAgo(12), inDays(18)], // Karim
];

export const subscriptions: Subscription[] = subRows.map(([plan, status, starts, ends], i) => ({
  id: uid(KIND.sub, i + 1),
  org_id: uid(KIND.org, i + 1),
  plan_id: uid(KIND.plan, plan),
  status,
  starts_at: starts,
  ends_at: ends,
  source: "manual",
  ...created(40),
}));

export const payments: Payment[] = [
  [1, 90000, "instapay", 20],
  [1, 90000, "instapay", 50],
  [2, 50000, "cash", 25],
  [3, 50000, "vodafone_cash", 3],
  [6, 90000, "bank", 12],
].map(([org, amount, method, ago], i) => ({
  id: uid(KIND.payment, i + 1),
  org_id: uid(KIND.org, org as number),
  amount_piasters: amount as number,
  currency: "EGP" as const,
  method: method as Payment["method"],
  paid_at: daysAgo(ago as number),
  note: null,
  receipt_path: null,
  ...created(ago as number),
}));

// ---------------------------------------------------------------- directory

type LandingSeed = Pick<CoachProfile, "slug" | "headline" | "page_published" | "show_team">;

const coachBios: Omit<
  CoachProfile,
  | "id"
  | "org_id"
  | "profile_id"
  | "name"
  | "photo_url"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | keyof LandingSeed
  | "cover_url"
>[] = [
  {
    bio: "كوتش أونلاين وفي الجيم من 8 سنين. متخصص في خسارة الدهون وبناء العضل من غير حرمان. خطط أكل مصرية تقدر تمشي عليها.",
    specialties: ["fat_loss", "muscle"],
    city: "Cairo",
    mode: "both",
    gym: "Gold's Gym Nasr City",
    languages: ["ar", "en"],
    years: 8,
    certificates: ["NASM-CPT", "Precision Nutrition L1"],
    price_min_piasters: 150000,
    price_max_piasters: 300000,
    instagram: "coach.ahmed.samir",
    whatsapp: "+201001112233",
    gender: "male",
    open_for_clients: true,
    listed: true,
    featured: true,
  },
  {
    bio: "Women's strength coach. I help busy women get strong, lose fat, and feel good in the gym. Online only.",
    specialties: ["womens_training", "strength", "fat_loss"],
    city: "Giza",
    mode: "online",
    gym: null,
    languages: ["en", "ar"],
    years: 5,
    certificates: ["ACE-CPT"],
    price_min_piasters: 120000,
    price_max_piasters: 200000,
    instagram: "mariam.lifts",
    whatsapp: "+201002223344",
    gender: "female",
    open_for_clients: true,
    listed: true,
    featured: false,
  },
  {
    bio: "باور ليفتنج وقوة. لو عايز ترفع أرقامك في السكوات والبنش والديدليفت، أنا معاك.",
    specialties: ["strength", "muscle"],
    city: "Alexandria",
    mode: "in_person",
    gym: "Smart Gym Smouha",
    languages: ["ar"],
    years: 11,
    certificates: ["IPF Coach L2"],
    price_min_piasters: 100000,
    price_max_piasters: 180000,
    instagram: null,
    whatsapp: "+201003334455",
    gender: "male",
    open_for_clients: true,
    listed: true,
    featured: false,
  },
  {
    bio: "Physio-trained coach for back pain, knee issues, and coming back after injury. Slow, safe, steady.",
    specialties: ["rehab", "sports"],
    city: "Cairo",
    mode: "both",
    gym: "Rehab Studio Maadi",
    languages: ["en", "ar"],
    years: 6,
    certificates: ["BSc Physical Therapy", "FRC Mobility Specialist"],
    price_min_piasters: 200000,
    price_max_piasters: 400000,
    instagram: "nour.moves",
    whatsapp: "+201004445566",
    gender: "female",
    open_for_clients: true,
    listed: false, // waiting for approval
    featured: false,
  },
  {
    bio: "تمارين للستات في البيت أو الجيم، وأكل صحي بميزانية معقولة.",
    specialties: ["womens_training", "fat_loss"],
    city: "Mansoura",
    mode: "online",
    gym: null,
    languages: ["ar"],
    years: 4,
    certificates: ["ISSA-CPT"],
    price_min_piasters: 80000,
    price_max_piasters: 150000,
    instagram: "yasmin.fit",
    whatsapp: "+201005556677",
    gender: "female",
    open_for_clients: false,
    listed: false, // expired subscription hides her
    featured: false,
  },
  {
    bio: "Football and sports performance. Speed, power, and staying injury-free all season.",
    specialties: ["sports", "strength"],
    city: "Cairo",
    mode: "in_person",
    gym: "Wadi Degla Club",
    languages: ["ar", "en"],
    years: 9,
    certificates: ["NSCA-CSCS"],
    price_min_piasters: 180000,
    price_max_piasters: 350000,
    instagram: "karim.performance",
    whatsapp: "+201006667788",
    gender: "male",
    open_for_clients: true,
    listed: true,
    featured: false,
  },
];

const landingSeeds: LandingSeed[] = [
  { slug: "ahmed-samir", headline: "خسارة دهون وبناء عضل بأكل مصري تقدر تكمل عليه", page_published: true, show_team: true },
  { slug: "mariam-lifts", headline: "Get strong. Lose fat. Feel at home in the gym.", page_published: true, show_team: false },
  { slug: "mahmoud-hassan", headline: "ارفع أرقامك في السكوات والبنش والديدليفت", page_published: true, show_team: false },
  { slug: "nour-moves", headline: "Move without pain again", page_published: false, show_team: false },
  { slug: "yasmin-fit", headline: null, page_published: true, show_team: false }, // expired: page not available
  { slug: "karim-performance", headline: "Faster, stronger, injury-free all season", page_published: true, show_team: false },
];

export const coachProfiles: CoachProfile[] = coachBios.map((bio, i) => ({
  id: uid(KIND.coach, i + 1),
  org_id: uid(KIND.org, i + 1),
  profile_id: uid(KIND.profile, coachPeople[i]!),
  name: people[coachPeople[i]! - 1]!.name,
  photo_url: null,
  cover_url: null,
  ...bio,
  ...landingSeeds[i]!,
  ...created(100 - i * 5),
}));

type PackageSeed = [coach: number, name: string, egp: number, weeks: number, includes: string[], highlighted?: boolean];

const packageSeeds: PackageSeed[] = [
  [1, "شهر أونلاين", 1500, 4, ["خطة تمرين", "خطة أكل مصري", "متابعة أسبوعية"]],
  [1, "3 شهور أونلاين", 4000, 12, ["خطة تمرين", "خطة أكل مصري", "متابعة أسبوعية", "تعديل الخطة كل شهر", "رد على واتساب"], true],
  [1, "3 شهور في الجيم", 7500, 12, ["3 حصص في الأسبوع في الجيم", "خطة أكل", "قياسات كل أسبوعين"]],
  [2, "Strong Start (1 month)", 1200, 4, ["Training plan", "Form check videos", "Weekly check-in"]],
  [2, "Full Glow-Up (3 months)", 3200, 12, ["Training plan", "Nutrition plan", "Weekly check-in", "WhatsApp support"], true],
  [6, "Season prep", 3500, 8, ["Speed and power program", "2 sessions a week", "Injury prevention"]],
];

export const coachPackages: CoachPackage[] = packageSeeds.map(([coach, name, egp, weeks, includes, highlighted], i) => ({
  id: uid(KIND.package, i + 1),
  org_id: uid(KIND.org, coach),
  coach_id: uid(KIND.coach, coach),
  name,
  price_piasters: egp * 100,
  weeks,
  includes,
  highlighted: highlighted ?? false,
  order: i,
  ...created(30),
}));

export const coachResults: CoachResult[] = [];

export const coachRequests: CoachRequest[] = [
  {
    id: uid(KIND.request, 1),
    client_id: DEMO.loneClientId,
    coach_id: DEMO.coachId,
    client_name: "زياد شريف",
    client_phone: "+201111111109",
    goal: "muscle",
    message: "عايز أبني عضل، بتمرن من سنة لوحدي ومش شايف نتيجة. متاح 4 أيام في الأسبوع.",
    contact_by: "whatsapp",
    status: "sent",
    reply: null,
    source: "directory",
    package_id: null,
    ...created(3),
  },
  {
    id: uid(KIND.request, 2),
    client_id: uid(KIND.client, 10),
    coach_id: DEMO.coachId,
    client_name: "Laila Hossam",
    client_phone: null,
    goal: "fat_loss",
    message: "Hi coach, I want to lose 8 kg before my wedding in March.",
    contact_by: "app",
    status: "sent",
    reply: null,
    source: "landing",
    package_id: uid(KIND.package, 2),
    ...created(0),
  },
];

// ---------------------------------------------------------------- clients

type ClientSeed = {
  profile: number;
  goal: Client["goal"];
  status: Client["status"];
  joinedDaysAgo: number;
  target?: number;
};

const clientSeeds: ClientSeed[] = [
  { profile: 8, goal: "fat_loss", status: "active", joinedDaysAgo: 46, target: 78 },
  { profile: 9, goal: "health", status: "active", joinedDaysAgo: 30 },
  { profile: 10, goal: "muscle", status: "active", joinedDaysAgo: 21, target: 80 },
  { profile: 11, goal: "fat_loss", status: "active", joinedDaysAgo: 60, target: 62 },
  { profile: 12, goal: "strength", status: "active", joinedDaysAgo: 14 },
  { profile: 13, goal: "fat_loss", status: "paused", joinedDaysAgo: 90, target: 58 },
  { profile: 14, goal: "muscle", status: "active", joinedDaysAgo: 8 },
  { profile: 15, goal: null, status: "invited", joinedDaysAgo: 1 },
  { profile: 16, goal: "muscle", status: "active", joinedDaysAgo: 5 }, // lone client, no coach
];

export const clients: Client[] = clientSeeds.map((c, i) => ({
  id: uid(KIND.client, i + 1),
  profile_id: uid(KIND.profile, c.profile),
  status: c.status,
  goal: c.goal,
  target_weight_kg: c.target ?? null,
  target_date: null,
  ...created(c.joinedDaysAgo),
}));

/** Which team member works with each of Ahmed's clients (by client number). */
const assignedTo: Record<number, string> = {
  1: DEMO.members.assistant.memberId,
  2: DEMO.members.assistant.memberId,
  3: DEMO.members.coach.memberId,
  4: DEMO.members.coach.memberId,
  5: DEMO.members.head_coach.memberId,
};

export const coachClients: CoachClient[] = clientSeeds.slice(0, 8).map((c, i) => ({
  id: uid(KIND.link, i + 1),
  org_id: DEMO.orgId,
  coach_id: DEMO.coachId,
  client_id: uid(KIND.client, i + 1),
  role: "trainer",
  status: c.status === "paused" ? "paused" : "active",
  started_at: daysAgo(c.joinedDaysAgo),
  ended_at: null,
  assigned_member_id: assignedTo[i + 1] ?? null,
  ...created(c.joinedDaysAgo),
}));

const emptyDetails = (clientId: string, n: number, days: number): ClientDetails => ({
  id: uid(KIND.details, n),
  client_id: clientId,
  age: null,
  gender: null,
  height_cm: null,
  start_weight_kg: null,
  job: null,
  activity: null,
  training_days: [],
  training_time: null,
  place: null,
  equipment: [],
  injuries: null,
  pain_areas: [],
  health_notes: null,
  medicines: null,
  past_training: null,
  sports: null,
  food_likes: null,
  food_dislikes: null,
  food_never: null,
  meals_per_day: null,
  budget: null,
  cooks_at_home: null,
  water_liters: null,
  supplements: null,
  intake_completed_at: null,
  ...created(days),
});

export const clientDetails: ClientDetails[] = [
  {
    ...emptyDetails(DEMO.clientId, 1, 46),
    age: 29,
    gender: "male",
    height_cm: 178,
    start_weight_kg: 92.4,
    job: "مهندس برمجيات",
    activity: "light",
    training_days: [0, 1, 2, 4, 5, 6],
    training_time: "19:00",
    place: "gym",
    equipment: ["barbell", "dumbbell", "machine", "cable"],
    injuries: "ألم خفيف في الكتف اليمين من سنة",
    pain_areas: ["right_shoulder"],
    health_notes: null,
    past_training: "اتمرن سنتين في الجامعة وبطّلت",
    sports: "كورة خماسي مرة في الأسبوع",
    food_likes: "فراخ، رز، فول، بيض",
    food_dislikes: "سمك",
    food_never: null,
    meals_per_day: 4,
    budget: "medium",
    cooks_at_home: true,
    water_liters: 2,
    supplements: "واي بروتين",
    intake_completed_at: daysAgo(45),
  },
  {
    ...emptyDetails(uid(KIND.client, 4), 2, 60),
    age: 34,
    gender: "female",
    height_cm: 163,
    start_weight_kg: 74,
    activity: "moderate",
    training_days: [0, 2, 4],
    place: "home",
    equipment: ["dumbbell", "band"],
    food_dislikes: "Spicy food",
    meals_per_day: 3,
    intake_completed_at: daysAgo(59),
  },
  emptyDetails(uid(KIND.client, 8), 3, 1), // invited, intake not filled
];

export const coachNotes: CoachNote[] = [
  {
    id: uid(KIND.note, 1),
    coach_id: DEMO.coachId,
    client_id: DEMO.clientId,
    author_id: DEMO.coachProfileId,
    text: "كتف يمين: بلاش ضغط كتف بالبار فوق الراس، استخدم دمبل بزاوية. راجع بعد 4 أسابيع.",
    tags: ["injury"],
    pinned: true,
    ...created(44),
  },
  {
    id: uid(KIND.note, 2),
    coach_id: DEMO.coachId,
    client_id: DEMO.clientId,
    author_id: DEMO.coachProfileId,
    text: "شغله بيزيد آخر الشهر، بيفوّت تمرين الخميس. خلي الخميس اختياري.",
    tags: ["work"],
    pinned: false,
    ...created(20),
  },
  {
    id: uid(KIND.note, 3),
    coach_id: DEMO.coachId,
    client_id: DEMO.clientId,
    author_id: DEMO.coachProfileId,
    text: "متحمس جدا بعد ما نزل أول 5 كيلو. شجعه على الصور.",
    tags: ["mindset"],
    pinned: false,
    ...created(6),
  },
];

export const invites: Invite[] = [
  {
    id: uid(KIND.invite, 1),
    org_id: DEMO.orgId,
    coach_id: DEMO.coachId,
    kind: "client",
    member_role: null,
    code: "AHMED-NADA-7Q",
    name: "ندى عادل",
    phone: "+201111111108",
    expires_at: inDays(6),
    used_by: null,
    ...created(1),
  },
];

// ---------------------------------------------------------------- training

type ExSeed = [string, string, Exercise["muscle"], Exercise["equipment"]];

const exerciseSeeds: ExSeed[] = [
  ["بنش بريس بالبار", "Barbell bench press", "chest", "barbell"],
  ["بنش عالي بالدمبل", "Incline dumbbell press", "chest", "dumbbell"],
  ["تفتيح كابل", "Cable fly", "chest", "cable"],
  ["ضغط", "Push-up", "chest", "bodyweight"],
  ["ضغط كتف بالدمبل", "Seated dumbbell shoulder press", "shoulders", "dumbbell"],
  ["رفرفة جانبي", "Lateral raise", "shoulders", "dumbbell"],
  ["ترايسبس بالكابل", "Triceps pushdown", "triceps", "cable"],
  ["ترايسبس فوق الراس", "Overhead triceps extension", "triceps", "cable"],
  ["عقلة", "Pull-up", "back", "bodyweight"],
  ["سحب أمامي", "Lat pulldown", "back", "cable"],
  ["تجديف بالبار", "Barbell row", "back", "barbell"],
  ["سحب أرضي", "Seated cable row", "back", "cable"],
  ["فيس بول", "Face pull", "shoulders", "cable"],
  ["باي بالبار", "Barbell curl", "biceps", "barbell"],
  ["هامر", "Hammer curl", "biceps", "dumbbell"],
  ["سكوات بالبار", "Back squat", "quads", "barbell"],
  ["رومانيان ديدليفت", "Romanian deadlift", "hamstrings", "barbell"],
  ["ديدليفت", "Deadlift", "back", "barbell"],
  ["ليج برس", "Leg press", "quads", "machine"],
  ["رفرفة أمامي", "Leg extension", "quads", "machine"],
  ["رفرفة خلفي", "Lying leg curl", "hamstrings", "machine"],
  ["طعن بالمشي", "Walking lunge", "glutes", "dumbbell"],
  ["هيب ثرست", "Hip thrust", "glutes", "barbell"],
  ["سمانة واقف", "Standing calf raise", "calves", "machine"],
  ["بلانك", "Plank", "core", "bodyweight"],
  ["بطن بالكابل", "Cable crunch", "core", "cable"],
  ["مشي على المشاية", "Treadmill incline walk", "cardio", "machine"],
];

export const exercises: Exercise[] = exerciseSeeds.map(([ar, en, muscle, equipment], i) => ({
  id: uid(KIND.exercise, i + 1),
  org_id: null,
  name_ar: ar,
  name_en: en,
  muscle,
  equipment,
  video_url: null,
  image_url: null,
  ...created(150),
}));

const ex = (enName: string) => {
  const found = exercises.find((e) => e.name_en === enName);
  if (!found) throw new Error(`Unknown exercise ${enName}`);
  return found.id;
};

/** [title, rest?, exercises: [name, sets, reps, rest_sec, target, group]] */
type DaySeed = [string, boolean, [string, number, string, number, string | null, string | null][]];

const pplWeek: DaySeed[] = [
  [
    "Push",
    false,
    [
      ["Barbell bench press", 4, "6-8", 150, "RPE 8", null],
      ["Incline dumbbell press", 3, "8-10", 120, null, null],
      ["Seated dumbbell shoulder press", 3, "8-10", 120, null, null],
      ["Lateral raise", 3, "12-15", 60, null, "A"],
      ["Triceps pushdown", 3, "10-12", 60, null, "A"],
    ],
  ],
  [
    "Pull",
    false,
    [
      ["Lat pulldown", 4, "8-10", 120, null, null],
      ["Barbell row", 3, "8", 120, "RPE 8", null],
      ["Seated cable row", 3, "10-12", 90, null, null],
      ["Face pull", 3, "15", 60, null, "A"],
      ["Hammer curl", 3, "10-12", 60, null, "A"],
    ],
  ],
  [
    "Legs",
    false,
    [
      ["Back squat", 4, "6-8", 180, "RPE 8", null],
      ["Romanian deadlift", 3, "8-10", 150, null, null],
      ["Leg press", 3, "10-12", 120, null, null],
      ["Lying leg curl", 3, "12", 60, null, "A"],
      ["Standing calf raise", 4, "12-15", 60, null, "A"],
    ],
  ],
  ["Rest", true, []],
  [
    "Push",
    false,
    [
      ["Incline dumbbell press", 4, "8-10", 120, null, null],
      ["Cable fly", 3, "12-15", 60, null, null],
      ["Lateral raise", 4, "12-15", 60, null, null],
      ["Overhead triceps extension", 3, "10-12", 60, null, null],
    ],
  ],
  [
    "Pull",
    false,
    [
      ["Pull-up", 4, "AMRAP", 120, null, null],
      ["Seated cable row", 3, "10-12", 90, null, null],
      ["Barbell curl", 3, "8-10", 60, null, "A"],
      ["Face pull", 3, "15", 60, null, "A"],
    ],
  ],
  [
    "Legs",
    false,
    [
      ["Hip thrust", 4, "8-10", 120, null, null],
      ["Walking lunge", 3, "12", 90, null, null],
      ["Leg extension", 3, "12-15", 60, null, null],
      ["Plank", 3, "45s", 45, null, null],
    ],
  ],
];

export const programs: Program[] = [];
export const programDays: ProgramDay[] = [];
export const programExercises: ProgramExercise[] = [];

function addProgram(n: number, name: string, clientId: string | null, weeks: number, startsAgo: number | null) {
  const programId = uid(KIND.program, n);
  programs.push({
    id: programId,
    org_id: DEMO.orgId,
    coach_id: DEMO.coachId,
    client_id: clientId,
    name,
    weeks,
    starts_on: startsAgo === null ? null : dateOnly(daysAgo(startsAgo)),
    version: 1,
    ...created(startsAgo ?? 90),
  });
  pplWeek.forEach(([title, rest, items], d) => {
    const dayId = uid(KIND.day, n * 100 + d + 1);
    programDays.push({
      id: dayId,
      program_id: programId,
      week: 1,
      day: d + 1,
      title,
      rest_day: rest,
      ...created(90),
    });
    items.forEach(([exName, sets, reps, restSec, target, group], order) => {
      programExercises.push({
        id: uid(KIND.item, n * 1000 + d * 10 + order + 1),
        program_day_id: dayId,
        exercise_id: ex(exName),
        order,
        sets,
        reps,
        rest_sec: restSec,
        target,
        tempo: null,
        note: null,
        group,
        ...created(90),
      });
    });
  });
}

addProgram(1, "Push Pull Legs", null, 8, null); // starter template
addProgram(2, "عمر — PPL تنشيف", DEMO.clientId, 8, 46);

export const workoutLogs: WorkoutLog[] = [];
export const setLogs: SetLog[] = [];

/** Omar's history: trained most planned days, weights creeping up. */
(function seedOmarLogs() {
  const omarDays = programDays.filter((d) => d.program_id === uid(KIND.program, 2));
  let logN = 0;
  let setN = 0;
  for (let ago = 45; ago >= 1; ago--) {
    const day = omarDays[(45 - ago) % 7]!;
    if (day.rest_day) continue;
    if (ago % 9 === 0) continue; // a missed day now and then
    logN++;
    const logId = uid(KIND.wlog, logN);
    workoutLogs.push({
      id: logId,
      client_id: DEMO.clientId,
      program_day_id: day.id,
      started_at: daysAgo(ago, 19),
      finished_at: daysAgo(ago, 20),
      note: null,
      client_uuid: logId,
      ...created(ago),
    });
    const progress = (45 - ago) / 45; // 0 → 1
    programExercises
      .filter((pe) => pe.program_day_id === day.id)
      .forEach((pe, i) => {
        const startWeight = [60, 22, 18, 8, 25][i % 5]!;
        for (let s = 1; s <= pe.sets; s++) {
          setN++;
          setLogs.push({
            id: uid(KIND.slog, setN),
            workout_log_id: logId,
            exercise_id: pe.exercise_id,
            set_no: s,
            weight_kg: Math.round((startWeight * (1 + progress * 0.2)) / 2.5) * 2.5,
            reps: 8,
            rpe: null,
            done: true,
            note: null,
            ...created(ago),
          });
        }
      });
  }
})();

// ---------------------------------------------------------------- nutrition

type FoodSeed = [string, string, string, number | null, number, number, number, number];

const foodSeeds: FoodSeed[] = [
  ["فول مدمس", "Foul medames", "1 cup", 200, 220, 14, 30, 5],
  ["طعمية", "Ta'meya (falafel)", "1 piece", 30, 100, 4, 9, 6],
  ["كشري", "Koshari", "1 plate", 350, 600, 18, 105, 12],
  ["عيش بلدي", "Baladi bread", "1 loaf", 90, 250, 9, 50, 1.5],
  ["رز أبيض مطبوخ", "White rice, cooked", "100 g", 100, 130, 2.7, 28, 0.3],
  ["صدور فراخ مشوية", "Grilled chicken breast", "100 g", 100, 165, 31, 0, 3.6],
  ["بيض", "Egg", "1 large", 50, 72, 6.3, 0.4, 4.8],
  ["شوفان", "Oats", "40 g", 40, 150, 5, 27, 3],
  ["زبادي", "Yogurt, plain", "1 cup", 170, 100, 6, 8, 5],
  ["جبنة قريش", "Cottage cheese (areesh)", "100 g", 100, 100, 13, 3, 4],
  ["جبنة بيضاء", "White cheese (feta)", "30 g", 30, 80, 4, 1, 6],
  ["تونة مصفاة", "Tuna in water, drained", "1 can", 120, 130, 29, 0, 1],
  ["موز", "Banana", "1 medium", 118, 105, 1.3, 27, 0.4],
  ["تفاح", "Apple", "1 medium", 182, 95, 0.5, 25, 0.3],
  ["شوربة عدس", "Lentil soup", "1 bowl", 250, 180, 11, 28, 3],
  ["ملوخية", "Molokhia", "1 bowl", 250, 120, 4, 8, 8],
  ["بطاطا مشوية", "Baked sweet potato", "100 g", 100, 90, 2, 21, 0.1],
  ["كفتة مشوية", "Grilled kofta", "100 g", 100, 250, 18, 3, 18],
  ["مكرونة مطبوخة", "Pasta, cooked", "100 g", 100, 158, 5.8, 31, 0.9],
  ["طحينة", "Tahini", "1 tbsp", 15, 90, 2.6, 3, 8],
  ["لبن خالي الدسم", "Low-fat milk", "1 cup", 240, 105, 8, 12, 2.5],
  ["بلح", "Dates", "3 pieces", 24, 70, 0.6, 18, 0],
  ["زبدة فول سوداني", "Peanut butter", "1 tbsp", 16, 95, 3.5, 3.5, 8],
  ["واي بروتين", "Whey protein", "1 scoop", 30, 120, 24, 3, 1.5],
  ["سلطة خضرا", "Green salad", "1 bowl", 150, 35, 1.5, 7, 0.3],
];

export const foods: Food[] = foodSeeds.map(([ar, en, serving, grams, kcal, p, c, f], i) => ({
  id: uid(KIND.food, i + 1),
  org_id: null,
  name_ar: ar,
  name_en: en,
  serving,
  serving_g: grams,
  kcal,
  protein: p,
  carbs: c,
  fat: f,
  ...created(150),
}));

const food = (enName: string) => {
  const found = foods.find((f) => f.name_en === enName);
  if (!found) throw new Error(`Unknown food ${enName}`);
  return found.id;
};

export const nutritionPlans: NutritionPlan[] = [];
export const meals: Meal[] = [];
export const mealItems: MealItem[] = [];

type MealSeed = [string, string | null, [string, number, string | null][]];

function addNutritionPlan(
  n: number,
  name: string,
  clientId: string | null,
  dayType: NutritionPlan["day_type"],
  targets: NutritionPlan["targets"],
  mealSeeds: MealSeed[],
  notes: string | null,
) {
  const planId = uid(KIND.nplan, n);
  nutritionPlans.push({
    id: planId,
    org_id: DEMO.orgId,
    coach_id: DEMO.coachId,
    client_id: clientId,
    name,
    targets,
    day_type: dayType,
    notes,
    version: 1,
    ...created(40),
  });
  mealSeeds.forEach(([mealName, note, items], order) => {
    const mealId = uid(KIND.meal, n * 100 + order + 1);
    meals.push({ id: mealId, nutrition_plan_id: planId, order, name: mealName, note, ...created(40) });
    items.forEach(([foodName, amount, swap], j) => {
      mealItems.push({
        id: uid(KIND.mitem, n * 1000 + order * 10 + j + 1),
        meal_id: mealId,
        food_id: food(foodName),
        amount,
        swap_group: swap,
        ...created(40),
      });
    });
  });
}

addNutritionPlan(
  1,
  "عمر — يوم تمرين",
  DEMO.clientId,
  "training",
  { kcal: 2100, protein: 170, carbs: 210, fat: 65, water_ml: 3000 },
  [
    ["فطار", "شاي من غير سكر", [["Egg", 3, null], ["Foul medames", 1, null], ["Baladi bread", 0.5, null]]],
    ["غدا", null, [["Grilled chicken breast", 2, "A"], ["Grilled kofta", 1.5, "A"], ["White rice, cooked", 2, null], ["Green salad", 1, null]]],
    ["سناك قبل التمرين", "قبل التمرين بساعة", [["Banana", 1, null], ["Oats", 1, null]]],
    ["عشا", "خلال ساعة بعد التمرين", [["Cottage cheese (areesh)", 2, "B"], ["Tuna in water, drained", 1, "B"], ["Baladi bread", 0.5, null], ["Whey protein", 1, null]]],
  ],
  "اشرب 3 لتر مية. ممنوع السكر في الشاي والقهوة.",
);

addNutritionPlan(
  2,
  "عمر — يوم راحة",
  DEMO.clientId,
  "rest",
  { kcal: 1850, protein: 170, carbs: 150, fat: 65, water_ml: 2500 },
  [
    ["فطار", null, [["Egg", 3, null], ["White cheese (feta)", 1, null], ["Baladi bread", 0.5, null]]],
    ["غدا", null, [["Grilled chicken breast", 2, null], ["Baked sweet potato", 2, null], ["Green salad", 1, null]]],
    ["عشا", null, [["Yogurt, plain", 1, null], ["Whey protein", 1, null], ["Dates", 1, null]]],
  ],
  null,
);

addNutritionPlan(
  3,
  "Fat loss — starter",
  null,
  "any",
  { kcal: 1800, protein: 140, carbs: 170, fat: 60, water_ml: 2500 },
  [
    ["Breakfast", null, [["Egg", 2, null], ["Foul medames", 1, null], ["Baladi bread", 0.5, null]]],
    ["Lunch", null, [["Grilled chicken breast", 1.5, null], ["White rice, cooked", 1.5, null], ["Green salad", 1, null]]],
    ["Dinner", null, [["Cottage cheese (areesh)", 1.5, null], ["Baladi bread", 0.5, null]]],
  ],
  null,
);

export const mealLogs: MealLog[] = [];

// ---------------------------------------------------------------- progress, check-ins, journey

/** Omar: 92.4 → ~86 kg over 46 days. */
export const bodyMetrics: BodyMetric[] = [46, 39, 32, 25, 18, 11, 4].map((ago, i) => ({
  id: uid(KIND.metric, i + 1),
  client_id: DEMO.clientId,
  date: dateOnly(daysAgo(ago)),
  weight_kg: [92.4, 91.1, 90.2, 89.0, 88.1, 86.9, 86.0][i]!,
  waist_cm: [98, 97, 96, 94.5, 93, 92, 91][i]!,
  photo_paths: [],
  ...created(ago),
}));

export const checkinForms: CheckinForm[] = [
  {
    id: uid(KIND.form, 1),
    org_id: DEMO.orgId,
    coach_id: DEMO.coachId,
    day_of_week: 5, // Friday
    questions: [
      { id: "q1", text: "How was your energy this week? (1–10)", kind: "scale" },
      { id: "q2", text: "How many hours did you sleep on average?", kind: "text" },
      { id: "q3", text: "Did you stick to the meal plan?", kind: "yes_no" },
      { id: "q4", text: "Any pain or injury?", kind: "text" },
      { id: "q5", text: "What was your biggest win this week?", kind: "text" },
    ],
    ...created(46),
  },
];

export const checkins: Checkin[] = [
  {
    id: uid(KIND.checkin, 1),
    client_id: DEMO.clientId,
    form_id: uid(KIND.form, 1),
    answers: [
      { question_id: "q1", value: 8 },
      { question_id: "q2", value: "7 ساعات" },
      { question_id: "q3", value: true },
      { question_id: "q4", value: "الكتف أحسن" },
      { question_id: "q5", value: "عديت 87 كيلو!" },
    ],
    weight_kg: 86.9,
    photo_paths: [],
    note: null,
    coach_reply: "شغل عالي يا عمر. كمّل كده 💪",
    read_at: daysAgo(10),
    ...created(11),
  },
  {
    id: uid(KIND.checkin, 2),
    client_id: DEMO.clientId,
    form_id: uid(KIND.form, 1),
    answers: [
      { question_id: "q1", value: 7 },
      { question_id: "q2", value: "6 ساعات" },
      { question_id: "q3", value: false },
      { question_id: "q4", value: "لا" },
      { question_id: "q5", value: "بنش 70 كيلو لأول مرة" },
    ],
    weight_kg: 86.0,
    photo_paths: [],
    note: "كان عندي فرح يوم الخميس وأكلت كتير",
    coach_reply: null,
    read_at: null,
    ...created(4),
  },
];

export const milestones: Milestone[] = [
  ["first_workout", null, 45],
  ["workouts_count", 10, 32],
  ["first_pb", null, 28],
  ["weight_change", -2, 32],
  ["weight_change", -4, 18],
  ["workouts_count", 25, 12],
  ["weight_change", -6, 4],
].map(([type, value, ago], i) => ({
  id: uid(KIND.milestone, i + 1),
  client_id: DEMO.clientId,
  type: type as Milestone["type"],
  value: value as number | null,
  reached_at: daysAgo(ago as number),
  ...created(ago as number),
}));

export const journeyMessages: JourneyMessage[] = [
  {
    id: uid(KIND.jmsg, 1),
    coach_id: DEMO.coachId,
    client_id: DEMO.clientId,
    text: "فخور بيك الشهر ده يا عمر. 6 كيلو في 6 أسابيع ومن غير ما تفوّت أسبوع.",
    pinned: true,
    ...created(3),
  },
];

export const dailyClientStats: DailyClientStats[] = [];

/** One row, as an array so the mock persistence saves it like every table. */
export const settings: AppSettings[] = [{ app_name: "Coachi", logo_url: null, support_whatsapp: "+201000000001" }];

export const auditLog: AuditEntry[] = [
  ["payment.record", "org:Ahmed Samir", 20],
  ["coach.approve", "coach:Mariam Adel", 24],
  ["support.start", "coach:Mahmoud Hassan", 6],
  ["support.end", "coach:Mahmoud Hassan", 6],
  ["payment.record", "org:Mahmoud Hassan", 3],
].map(([action, target, ago], i) => ({
  id: uid(KIND.audit, i + 1),
  actor_id: DEMO.adminProfileId,
  action: action as string,
  target: target as string,
  meta: {},
  support_mode: (action as string).startsWith("support"),
  created_at: daysAgo(ago as number),
}));
