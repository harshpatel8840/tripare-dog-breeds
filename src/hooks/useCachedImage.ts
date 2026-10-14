import { useState, useEffect } from 'react';
import { imageManager, ImageVariant } from '../services/images/imageManager';

export function useCachedImage(
  imageId?: string,
  remoteUrl?: string | null,
  variant: ImageVariant = 'thumb',
): { uri: string; isCached: boolean } {
  const [uri, setUri] = useState<string>(remoteUrl || '');
  const [isCached, setIsCached] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!remoteUrl || !imageId) {
      setUri(remoteUrl || '');
      return;
    }

    // Register as actively displayed image so LRU eviction will protect it
    imageManager.registerActiveImage(imageId);

    imageManager
      .getCachedImageUrl(imageId, remoteUrl, variant)
      .then((cachedUri) => {
        if (isMounted) {
          setUri(cachedUri);
          setIsCached(cachedUri !== remoteUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUri(remoteUrl);
        }
      });

    return () => {
      isMounted = false;
      imageManager.unregisterActiveImage(imageId);
    };
  }, [imageId, remoteUrl, variant]);

  return { uri, isCached };
}
