import { NotificationItem, WorkProject, Activity } from '../types';

export const CURRENT_TAB_ID =
  'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

export type RealtimeEventData =
  | {
      type: 'NOTIFICATIONS_SYNC';
      notifications: NotificationItem[];
    }
  | {
      type: 'PROJECTS_SYNC';
      projects: WorkProject[];
      activities?: Activity[];
    }
  | {
      type: 'ACTIVITIES_SYNC';
      activities: Activity[];
    };

export type RealtimePayload = RealtimeEventData & {
  senderTabId: string;
  timestamp: number;
};

type Listener = (payload: RealtimePayload) => void;

class RealtimeChannelManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<Listener> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    try {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('vidzyra_crm_realtime_channel');
        this.channel.onmessage = (event: MessageEvent<RealtimePayload>) => {
          const payload = event.data;
          if (payload && payload.senderTabId !== CURRENT_TAB_ID) {
            this.notifyListeners(payload);
          }
        };
      }
    } catch (err) {
      console.warn('[RealtimeSync] BroadcastChannel unavailable, using fallback', err);
    }

    // In-window custom event listener (for intra-tab communication)
    window.addEventListener('vidzyra:realtime:event', ((e: CustomEvent<RealtimePayload>) => {
      const payload = e.detail;
      if (payload && payload.senderTabId !== CURRENT_TAB_ID) {
        this.notifyListeners(payload);
      }
    }) as EventListener);
  }

  private notifyListeners(payload: RealtimePayload) {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[RealtimeSync] Error in listener callback', err);
      }
    });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(data: RealtimeEventData) {
    const payload: RealtimePayload = {
      ...data,
      senderTabId: CURRENT_TAB_ID,
      timestamp: Date.now(),
    };

    // 1. Broadcast to other tabs/windows
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.error('[RealtimeSync] Error posting message to BroadcastChannel', err);
      }
    }

    // 2. Dispatch custom event in window for any listeners in the same window/frame
    try {
      window.dispatchEvent(
        new CustomEvent('vidzyra:realtime:event', { detail: payload })
      );
    } catch {
      // ignore
    }
  }

  public close() {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // ignore
      }
      this.channel = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const realtimeManager = new RealtimeChannelManager();
