/**
 * Shared behavior for every mock module: a small delay so loading states show, and a
 * "data state" the dev switcher can flip to test empty, error, and slow screens.
 */

export type MockDataState = "normal" | "empty" | "error" | "slow";

const STORAGE_KEY = "coachi.dev.dataState";
let dataState: MockDataState = readStoredState();

function readStoredState(): MockDataState {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (stored === "empty" || stored === "error" || stored === "slow") return stored;
  } catch {
    // Storage can be blocked (private mode); fall back to normal.
  }
  return "normal";
}

export function getMockDataState(): MockDataState {
  return dataState;
}

export function setMockDataState(next: MockDataState) {
  dataState = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore: the state still applies for this page view.
  }
}

export type MockRole = "client" | "coach" | "super_admin";

const ROLE_KEY = "coachi.dev.role";

export function getMockRole(): MockRole {
  try {
    const stored = globalThis.localStorage?.getItem(ROLE_KEY);
    if (stored === "client" || stored === "super_admin") return stored;
  } catch {
    // Fall through to the default.
  }
  return "coach";
}

export function setMockRole(role: MockRole) {
  try {
    globalThis.localStorage?.setItem(ROLE_KEY, role);
  } catch {
    // Ignore.
  }
}

export type MockMemberRole = "owner" | "head_coach" | "coach" | "assistant";

const MEMBER_KEY = "coachi.dev.memberRole";

/** Coach role only: which member of the demo coach's team is signed in. */
export function getMockMemberRole(): MockMemberRole {
  try {
    const stored = globalThis.localStorage?.getItem(MEMBER_KEY);
    if (stored === "head_coach" || stored === "coach" || stored === "assistant") return stored;
  } catch {
    // Fall through to the default.
  }
  return "owner";
}

export function setMockMemberRole(role: MockMemberRole) {
  try {
    globalThis.localStorage?.setItem(MEMBER_KEY, role);
  } catch {
    // Ignore.
  }
}

const SIGNED_OUT_KEY = "coachi.dev.signedOut";

/** Mock sign-out: getSession returns null until the next login (or a dev switcher role change). */
export function isMockSignedOut() {
  try {
    return globalThis.localStorage?.getItem(SIGNED_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMockSignedOut(signedOut: boolean) {
  try {
    if (signedOut) globalThis.localStorage?.setItem(SIGNED_OUT_KEY, "1");
    else globalThis.localStorage?.removeItem(SIGNED_OUT_KEY);
  } catch {
    // Ignore.
  }
}

const CLIENT_PROFILE_KEY = "coachi.dev.clientProfile";

/** Client role only: which client is signed in (a demo number or a new sign-up). null = the demo client. */
export function getMockClientProfile(): string | null {
  try {
    return globalThis.localStorage?.getItem(CLIENT_PROFILE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setMockClientProfile(profileId: string | null) {
  try {
    if (profileId) globalThis.localStorage?.setItem(CLIENT_PROFILE_KEY, profileId);
    else globalThis.localStorage?.removeItem(CLIENT_PROFILE_KEY);
  } catch {
    // Ignore.
  }
}

export class ApiError extends Error {
  constructor(
    /** inactive = the coach's subscription ended or is paused: read-only until renewed. */
    public code: "network" | "not_found" | "forbidden" | "limit_reached" | "invalid" | "inactive",
    message: string = code,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a mock read. `empty` is what the call returns when the dev switcher is on "Empty".
 * Writes pass `empty` as undefined so they still work in the empty state.
 */
export async function mockRead<T>(produce: () => T, empty?: T): Promise<T> {
  await sleep(dataState === "slow" ? 2500 : 250 + Math.random() * 250);
  if (dataState === "error") throw new ApiError("network");
  if (dataState === "empty" && empty !== undefined) return structuredClone(empty);
  return structuredClone(produce());
}

/** Auth reads ignore the dev data state: "error" and "empty" are for testing screens, not login. */
export async function mockAuthRead<T>(produce: () => T): Promise<T> {
  await sleep(150);
  return structuredClone(produce());
}

let afterWrite: (() => void) | null = null;
/** Lets the persistence layer save the mock database after every write. */
export function onMockWrite(fn: () => void) {
  afterWrite = fn;
}

export async function mockWrite<T>(produce: () => T): Promise<T> {
  await sleep(dataState === "slow" ? 2500 : 300);
  if (dataState === "error") throw new ApiError("network");
  // Like a real request: no connection, no write. Lets the offline set queue be tested in mock mode.
  if (globalThis.navigator?.onLine === false) throw new ApiError("network", "offline");
  const result = structuredClone(produce());
  afterWrite?.();
  return result;
}

export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

export const daysAgo = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const dateOnly = (iso: string) => iso.slice(0, 10);
