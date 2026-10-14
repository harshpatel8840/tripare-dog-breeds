import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from '../../utils/logger';

export type ConnectivityListener = (isConnected: boolean) => void;

export class NetworkMonitor {
  private isConnected = true;
  private listeners = new Set<ConnectivityListener>();
  private unsubscribeNetInfo: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      const changed = this.isConnected !== connected;
      this.isConnected = connected;

      if (changed) {
        logger.info(`[NetworkMonitor] Connectivity changed: ${connected ? 'ONLINE' : 'OFFLINE'}`);
        this.notifyListeners(connected);
      }
    });

    // Check initial state
    NetInfo.fetch()
      .then((state) => {
        this.isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      })
      .catch((err) => {
        logger.warn('[NetworkMonitor] Initial fetch failed:', err);
      });
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      return this.isConnected;
    } catch {
      return this.isConnected;
    }
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.isConnected);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(connected: boolean): void {
    this.listeners.forEach((fn) => {
      try {
        fn(connected);
      } catch (err) {
        logger.warn('[NetworkMonitor] Error in listener:', err);
      }
    });
  }

  public destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();
