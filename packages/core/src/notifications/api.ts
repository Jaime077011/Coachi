import type { Notification, NotificationPref, PrefKey } from "@coachi/validation";

/** The signed-in person's notifications and reminder settings. Push delivery comes with the jobs worker. */
export interface NotificationsApi {
  /** Newest first. */
  list(): Promise<Notification[]>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(): Promise<void>;
  /** Every pref key, filled with the defaults he hasn't changed. */
  prefs(): Promise<NotificationPref[]>;
  savePref(type: PrefKey, input: { on: boolean; time: string | null }): Promise<NotificationPref>;
}
