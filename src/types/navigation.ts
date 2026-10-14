import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  BreedList: undefined;
  BreedDetails: { breedId: string; breedName: string };
  FilterModal: undefined;
};

export type BreedListScreenProps = NativeStackScreenProps<RootStackParamList, 'BreedList'>;
export type BreedDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'BreedDetails'>;
export type FilterModalScreenProps = NativeStackScreenProps<RootStackParamList, 'FilterModal'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
