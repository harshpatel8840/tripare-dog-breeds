import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ImageAttribution } from '../../types/domain';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface Props {
  attribution?: ImageAttribution;
}

export const AttributionCard: React.FC<Props> = ({ attribution }) => {
  const { colors } = useTheme();

  const handleOpenUrl = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.warn('Could not open link:', err);
      });
    }
  };

  if (!attribution || (!attribution.author && !attribution.source && !attribution.license)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceSubtle }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No attribution information provided for this image.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
      ]}
      accessibilityRole="text"
      accessibilityLabel="Image attribution details"
    >
      <Text style={[styles.header, { color: colors.textSecondary }]}>
        📷 Image Attribution & Licensing
      </Text>

      {/* Author */}
      {attribution.author && (
        <View style={styles.row}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Author:</Text>
          <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
            {attribution.author}
          </Text>
        </View>
      )}

      {/* License */}
      {attribution.license && (
        <View style={styles.row}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>License:</Text>
          {attribution.licenseUrl ? (
            <TouchableOpacity
              onPress={() => handleOpenUrl(attribution.licenseUrl)}
              accessibilityRole="link"
              accessibilityLabel={`License: ${attribution.license}. Opens external link.`}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {attribution.license} ↗
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
              {attribution.license}
            </Text>
          )}
        </View>
      )}

      {/* Source */}
      {attribution.source && (
        <View style={styles.row}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Source:</Text>
          {attribution.sourceUrl ? (
            <TouchableOpacity
              onPress={() => handleOpenUrl(attribution.sourceUrl)}
              accessibilityRole="link"
              accessibilityLabel={`Source: ${attribution.source}. Opens external link.`}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {attribution.source} ↗
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
              {attribution.source}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
  },
  header: {
    ...typography.captionBold,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxs,
  },
  fieldLabel: {
    ...typography.captionBold,
    width: 60,
  },
  fieldValue: {
    ...typography.caption,
    flex: 1,
  },
  linkText: {
    ...typography.captionBold,
    textDecorationLine: 'underline',
  },
});
