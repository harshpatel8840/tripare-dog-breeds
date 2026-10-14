import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TraitScores } from '../../types/domain';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';
import { ScaleBar } from '../common/ScaleBar';

interface Props {
  traits?: TraitScores;
}

export const TraitScaleCard: React.FC<Props> = ({ traits }) => {
  const { colors } = useTheme();

  const getEnergyInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Calm';
    if (val === 3) return 'Moderate';
    return 'High Energy';
  };

  const getBarkingInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Quiet';
    if (val === 3) return 'Occasional';
    return 'Vocal';
  };

  const getDroolingInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 1) return 'Rare';
    if (val <= 3) return 'Moderate';
    return 'Frequent';
  };

  const getGroomingInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Low Maintenance';
    if (val === 3) return 'Moderate';
    return 'High Maintenance';
  };

  const getSheddingInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 1) return 'Minimal';
    if (val <= 3) return 'Moderate';
    return 'Heavy';
  };

  const getTrainabilityInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Independent';
    if (val === 3) return 'Moderate';
    return 'Eager to Please';
  };

  const getDogsInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Cautious';
    if (val === 3) return 'Friendly';
    return 'Highly Sociable';
  };

  const getExerciseInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 30) return 'Light Activity';
    if (val <= 60) return 'Moderate Activity';
    return 'Demanding Activity';
  };

  const getApartmentInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Not Ideal';
    if (val === 3) return 'Suitable';
    return 'Ideal';
  };

  const getChildrenInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Requires Supervision';
    if (val === 3) return 'Friendly';
    return 'Excellent Family Dog';
  };

  const getStrangersInterpretation = (val?: number) => {
    if (!val) return undefined;
    if (val <= 2) return 'Reserved / Aloof';
    if (val === 3) return 'Polite';
    return 'Very Welcoming';
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="traits-scale-card"
    >
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Behavioral & Physical Traits
      </Text>

      {/* 1. Energy */}
      <ScaleBar
        label="Energy Level"
        value={traits?.energy}
        interpretation={getEnergyInterpretation(traits?.energy)}
      />

      {/* 2. Barking */}
      <ScaleBar
        label="Barking Frequency"
        value={traits?.barking}
        interpretation={getBarkingInterpretation(traits?.barking)}
      />

      {/* 3. Drooling */}
      <ScaleBar
        label="Drooling Amount"
        value={traits?.drooling}
        interpretation={getDroolingInterpretation(traits?.drooling)}
      />

      {/* 4. Grooming */}
      <ScaleBar
        label="Grooming Needs"
        value={traits?.grooming}
        interpretation={getGroomingInterpretation(traits?.grooming)}
      />

      {/* 5. Shedding */}
      <ScaleBar
        label="Shedding Level"
        value={traits?.shedding}
        interpretation={getSheddingInterpretation(traits?.shedding)}
      />

      {/* 6. Trainability */}
      <ScaleBar
        label="Trainability"
        value={traits?.trainability}
        interpretation={getTrainabilityInterpretation(traits?.trainability)}
      />

      {/* 7. Good with dogs */}
      <ScaleBar
        label="Good with Other Dogs"
        value={traits?.goodWithDogs}
        interpretation={getDogsInterpretation(traits?.goodWithDogs)}
      />

      {/* 8. Exercise minutes */}
      <ScaleBar
        label="Daily Exercise"
        value={traits?.exerciseMinutes}
        maxScore={120}
        unit="min/day"
        interpretation={getExerciseInterpretation(traits?.exerciseMinutes)}
      />

      {/* 9. Apartment friendly */}
      <ScaleBar
        label="Apartment Friendly"
        value={traits?.apartmentFriendly}
        interpretation={getApartmentInterpretation(traits?.apartmentFriendly)}
      />

      {/* 10. Good with children */}
      <ScaleBar
        label="Good with Children"
        value={traits?.goodWithChildren}
        interpretation={getChildrenInterpretation(traits?.goodWithChildren)}
      />

      {/* 11. Good with strangers */}
      <ScaleBar
        label="Good with Strangers"
        value={traits?.goodWithStrangers}
        interpretation={getStrangersInterpretation(traits?.goodWithStrangers)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
});
