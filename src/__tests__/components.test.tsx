import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Badge } from '../components/common/Badge';
import { ScaleBar } from '../components/common/ScaleBar';
import { EmptyState } from '../components/common/EmptyState';
import { AttributionCard } from '../components/gallery/AttributionCard';
import { BreedListItemComponent } from '../components/breeds/BreedListItemComponent';
import { TraitScaleCard } from '../components/traits/TraitScaleCard';
import { BreedListItem } from '../types/domain';

describe('UI Components', () => {
  describe('Badge', () => {
    it('renders label with appropriate capitalization', async () => {
      await render(<Badge label="Hypoallergenic" variant="success" />);
      expect(screen.getByText('Hypoallergenic')).toBeTruthy();
    });
  });

  describe('ScaleBar', () => {
    it('renders label, score, and interpretation correctly', async () => {
      await render(
        <ScaleBar label="Energy Level" value={4} maxScore={5} interpretation="High Energy" />,
      );

      expect(screen.getByText('Energy Level')).toBeTruthy();
      expect(screen.getByText('4 / 5')).toBeTruthy();
      expect(screen.getByText(' (High Energy)')).toBeTruthy();

      const progress = screen.getByRole('progressbar');
      expect(progress.props.accessibilityValue.now).toBe(4);
    });

    it('handles missing value with "Not provided" fallback', async () => {
      await render(<ScaleBar label="Barking" value={null} />);
      expect(screen.getByText('Not provided')).toBeTruthy();
    });

    it('renders custom units such as min/day for exercise', async () => {
      await render(<ScaleBar label="Daily Exercise" value={45} maxScore={120} unit="min/day" />);
      expect(screen.getByText('45 min/day')).toBeTruthy();
    });

    it('renders score of 0 correctly without treating it as missing', async () => {
      await render(
        <ScaleBar label="Barking Frequency" value={0} maxScore={5} interpretation="Quiet" />,
      );
      expect(screen.getByText('0 / 5')).toBeTruthy();
      expect(screen.getByText(' (Quiet)')).toBeTruthy();
      expect(screen.queryByText('Not provided')).toBeNull();
    });
  });

  describe('TraitScaleCard', () => {
    it('renders all 11 traits and interpretations', async () => {
      const traits = {
        energy: 5,
        barking: 1,
        drooling: 1,
        grooming: 2,
        shedding: 3,
        trainability: 5,
        goodWithDogs: 4,
        exerciseMinutes: 60,
        apartmentFriendly: 4,
        goodWithChildren: 5,
        goodWithStrangers: 4,
      };

      await render(<TraitScaleCard traits={traits} />);

      expect(screen.getByText('Energy Level')).toBeTruthy();
      expect(screen.getByText('Barking Frequency')).toBeTruthy();
      expect(screen.getByText('Drooling Amount')).toBeTruthy();
      expect(screen.getByText('Grooming Needs')).toBeTruthy();
      expect(screen.getByText('Shedding Level')).toBeTruthy();
      expect(screen.getByText('Trainability')).toBeTruthy();
      expect(screen.getByText('Good with Other Dogs')).toBeTruthy();
      expect(screen.getByText('Daily Exercise')).toBeTruthy();
      expect(screen.getByText('Apartment Friendly')).toBeTruthy();
      expect(screen.getByText('Good with Children')).toBeTruthy();
      expect(screen.getByText('Good with Strangers')).toBeTruthy();
      expect(screen.getByText('60 min/day')).toBeTruthy();
    });

    it('renders gracefully when traits are undefined or partially missing', async () => {
      await render(<TraitScaleCard traits={undefined} />);
      expect(screen.getByText('Behavioral & Physical Traits')).toBeTruthy();
      expect(screen.getAllByText('Not provided').length).toBe(11);
    });
  });

  describe('EmptyState', () => {
    it('renders icon, title, message, and responds to action button', async () => {
      const onActionMock = jest.fn();
      await render(
        <EmptyState
          icon="🔍"
          title="No breeds found"
          message="Try different search terms."
          actionLabel="Clear Filters"
          onAction={onActionMock}
        />,
      );

      expect(screen.getByText('🔍')).toBeTruthy();
      expect(screen.getByText('No breeds found')).toBeTruthy();
      expect(screen.getByText('Try different search terms.')).toBeTruthy();

      const button = screen.getByText('Clear Filters');
      fireEvent.press(button);
      expect(onActionMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('AttributionCard', () => {
    it('renders photographer, license, and source links', async () => {
      const attribution = {
        author: 'Jane Doe',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
        source: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org',
      };

      await render(<AttributionCard attribution={attribution} />);

      expect(screen.getByText('Jane Doe')).toBeTruthy();
      expect(screen.getByText('CC BY-SA 4.0 ↗')).toBeTruthy();
      expect(screen.getByText('Wikimedia Commons ↗')).toBeTruthy();
    });

    it('renders fallback when attribution is missing', async () => {
      await render(<AttributionCard attribution={undefined} />);
      expect(screen.getByText('No attribution information provided for this image.')).toBeTruthy();
    });
  });

  describe('BreedListItemComponent', () => {
    const mockItem: BreedListItem = {
      id: 'b-test',
      name: 'Beagle',
      groupId: 'g-hound',
      groupName: 'Hound Group',
      thumbUrl: 'https://images.dogapi.dog/beagle.jpg',
      hypoallergenic: false,
      sizeBand: 'medium',
      coatLength: 'short',
      lifeMin: 12,
      lifeMax: 15,
      weightMin: 9,
      weightMax: 11,
    };

    it('renders name, group, badges, and triggers onPress', async () => {
      const onPressMock = jest.fn();
      await render(<BreedListItemComponent item={mockItem} onPress={onPressMock} />);

      expect(screen.getByText('Beagle')).toBeTruthy();
      expect(screen.getByText('Hound Group')).toBeTruthy();
      expect(screen.getByText('medium')).toBeTruthy();
      expect(screen.getByText('short')).toBeTruthy();
      expect(screen.getByText('9–11 kg')).toBeTruthy();

      const button = screen.getByText('Beagle');
      fireEvent.press(button);
      expect(onPressMock).toHaveBeenCalledWith(mockItem);
    });
  });
});
