import { useEffect, useState } from 'react';
import { networkMonitor } from '../services/network/networkMonitor';

export function useNetwork(): boolean {
  const [isConnected, setIsConnected] = useState<boolean>(networkMonitor.getIsConnected());

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe((connected) => {
      setIsConnected(connected);
    });
    return unsubscribe;
  }, []);

  return isConnected;
}
