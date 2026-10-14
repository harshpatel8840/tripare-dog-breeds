import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { BreedImage } from '../../types/domain';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing, layout } from '../../theme/spacing';
import { AttributionCard } from './AttributionCard';
import { imageManager } from '../../services/images/imageManager';

interface Props {
  images?: BreedImage[];
  breedName: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = Math.min(SCREEN_WIDTH - spacing.lg * 2, 500);

export const GalleryViewer: React.FC<Props> = ({ images = [], breedName }) => {
  const { colors } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Register currently displayed image with ImageManager so it won't be LRU evicted
  const currentImage = images[selectedIndex];
  useEffect(() => {
    if (currentImage?.id) {
      imageManager.registerActiveImage(currentImage.id);
      return () => {
        imageManager.unregisterActiveImage(currentImage.id);
      };
    }
  }, [currentImage]);

  if (!images || images.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
        ]}
      >
        <Text style={styles.emptyIcon}>🖼️</Text>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No images available</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No official images have been provided for {breedName} yet.
        </Text>
      </View>
    );
  }

  const mediumUri = currentImage?.mediumUrl || currentImage?.thumbUrl || currentImage?.url;
  const largeUri = currentImage?.largeUrl || currentImage?.mediumUrl || currentImage?.url;

  return (
    <View style={styles.container}>
      {/* Main Preview Card */}
      <TouchableOpacity
        style={[styles.mainImageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setIsFullscreen(true)}
        activeOpacity={0.9}
        accessibilityRole="imagebutton"
        accessibilityLabel={`View full screen image ${selectedIndex + 1} of ${images.length} for ${breedName}`}
      >
        <Image
          source={{ uri: mediumUri }}
          style={styles.mainImage}
          contentFit="cover"
          transition={300}
          cachePolicy="disk"
          accessibilityLabel={`${breedName} image ${selectedIndex + 1}`}
        />
        <View style={styles.zoomHintBadge}>
          <Text style={styles.zoomHintText}>🔍 Tap to zoom</Text>
        </View>
      </TouchableOpacity>

      {/* Counter */}
      <Text style={[styles.counterText, { color: colors.textSecondary }]}>
        Image {selectedIndex + 1} of {images.length}
      </Text>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailStrip}
        >
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            const thumbSrc = img.thumbUrl || img.url;
            return (
              <TouchableOpacity
                key={img.id}
                onPress={() => setSelectedIndex(idx)}
                style={[
                  styles.thumbWrapper,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Select image ${idx + 1}`}
              >
                <Image
                  source={{ uri: thumbSrc }}
                  style={styles.thumbImage}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Attribution Card */}
      <AttributionCard attribution={currentImage?.attribution} />

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsFullscreen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close full screen viewer"
          >
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>

          <View style={styles.fullscreenImageContainer}>
            <Image
              source={{ uri: largeUri }}
              style={styles.fullscreenImage}
              contentFit="contain"
              transition={200}
              cachePolicy="disk"
              accessibilityLabel={`${breedName} full resolution image`}
            />
          </View>

          <View style={styles.fullscreenFooter}>
            <Text style={styles.fullscreenAttributionText}>
              {currentImage?.attribution?.author
                ? `Photo by ${currentImage.attribution.author}`
                : breedName}
            </Text>
            {currentImage?.attribution?.license && (
              <Text style={styles.fullscreenLicenseText}>{currentImage.attribution.license}</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  mainImageCard: {
    width: CAROUSEL_WIDTH,
    height: layout.galleryImageHeight,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'center',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.round,
  },
  zoomHintText: {
    ...typography.captionBold,
    color: '#FFFFFF',
  },
  counterText: {
    ...typography.captionBold,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  thumbnailStrip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    padding: spacing.xxl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.xxs,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 30,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginRight: spacing.xl,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.round,
  },
  closeButtonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  fullscreenFooter: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  fullscreenAttributionText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  fullscreenLicenseText: {
    ...typography.caption,
    color: '#CBD5E1',
    marginTop: spacing.xxs,
  },
});
