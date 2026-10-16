import { defaultPrefs, prefKey } from "@coachi/validation";
import type { NotificationsApi } from "./api";
import { notificationPrefs, notifications } from "../mock/data";
import { mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { mockSession } from "../mock/session";

const me = () => mockSession().profile.id;

const filled = (profileId: string) =>
  prefKey.options.map((type) => {
    const saved = notificationPrefs.find((p) => p.profile_id === profileId && p.type === type);
    if (saved) return saved;
    const stamp = nowIso();
    return { id: newId(), profile_id: profileId, channel: "push" as const, type, ...defaultPrefs[type], created_at: stamp, updated_at: stamp, deleted_at: null };
  });

export const mockNotifications: NotificationsApi = {
  list: () =>
    mockRead(
      () =>
        notifications
          .filter((n) => n.profile_id === me() && !n.deleted_at)
          .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      [],
    ),

  markRead: (notificationId) =>
    mockWrite(() => {
      const n = notifications.find((x) => x.id === notificationId && x.profile_id === me());
      if (n) n.read_at ??= nowIso();
    }),

  markAllRead: () =>
    mockWrite(() => {
      const now = nowIso();
      for (const n of notifications) if (n.profile_id === me() && !n.read_at) n.read_at = now;
    }),

  prefs: () => mockRead(() => filled(me())),

  savePref: (type, input) =>
    mockWrite(() => {
      const profileId = me();
      const existing = notificationPrefs.find((p) => p.profile_id === profileId && p.type === type);
      if (existing) {
        Object.assign(existing, input, { updated_at: nowIso() });
        return existing;
      }
      const pref = { ...filled(profileId).find((p) => p.type === type)!, ...input };
      notificationPrefs.push(pref);
      return pref;
    }),
};
