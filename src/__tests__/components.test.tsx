import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Badge } from '../components/common/Badge';
import { ScaleBar } from '../components/common/ScaleBar';
import { EmptyState } from '../components/common/EmptyState';
import { AttributionCard } from '../components/gallery/AttributionCard';
import { BreedListItemComponent } from '../components/breeds/BreedListItemComponent';
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
