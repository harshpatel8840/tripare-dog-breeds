import { useFilterStore } from '../store/filterStore';

describe('useFilterStore', () => {
  beforeEach(() => {
    useFilterStore.getState().resetFilters();
  });

  it('initializes with default state', () => {
    const state = useFilterStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.groupIds).toEqual([]);
    expect(state.sizeBands).toEqual([]);
    expect(state.coatLengths).toEqual([]);
    expect(state.hypoallergenic).toBe('all');
    expect(state.minChildrenScore).toBeNull();
    expect(state.hasActiveFilters()).toBe(false);
    expect(state.getActiveFilterCount()).toBe(0);
  });

  it('updates search query', () => {
    useFilterStore.getState().setSearchQuery('poodle');
    expect(useFilterStore.getState().searchQuery).toBe('poodle');
  });

  it('toggles group ID', () => {
    const { toggleGroupId } = useFilterStore.getState();
    toggleGroupId('group-1');
    expect(useFilterStore.getState().groupIds).toEqual(['group-1']);
    expect(useFilterStore.getState().hasActiveFilters()).toBe(true);
    expect(useFilterStore.getState().getActiveFilterCount()).toBe(1);

    toggleGroupId('group-1');
    expect(useFilterStore.getState().groupIds).toEqual([]);
    expect(useFilterStore.getState().hasActiveFilters()).toBe(false);
  });

  it('toggles size band and coat length', () => {
    const { toggleSizeBand, toggleCoatLength } = useFilterStore.getState();
    toggleSizeBand('small');
    toggleCoatLength('wire');

    expect(useFilterStore.getState().sizeBands).toEqual(['small']);
    expect(useFilterStore.getState().coatLengths).toEqual(['wire']);
    expect(useFilterStore.getState().getActiveFilterCount()).toBe(2);
  });

  it('updates trait threshold scores', () => {
    const { setMinChildrenScore, setMinDogsScore, setMinStrangersScore } =
      useFilterStore.getState();
    setMinChildrenScore(3);
    setMinDogsScore(4);
    setMinStrangersScore(2);

    const s = useFilterStore.getState();
    expect(s.minChildrenScore).toBe(3);
    expect(s.minDogsScore).toBe(4);
    expect(s.minStrangersScore).toBe(2);
    expect(s.getActiveFilterCount()).toBe(3);
  });

  it('resets all filters to initial state', () => {
    const store = useFilterStore.getState();
    store.setSearchQuery('hound');
    store.toggleGroupId('group-1');
    store.toggleSizeBand('large');
    store.setHypoallergenic('yes');
    store.setMinChildrenScore(4);

    expect(useFilterStore.getState().hasActiveFilters()).toBe(true);

    useFilterStore.getState().resetFilters();

    const resetState = useFilterStore.getState();
    expect(resetState.searchQuery).toBe('');
    expect(resetState.groupIds).toEqual([]);
    expect(resetState.sizeBands).toEqual([]);
    expect(resetState.hypoallergenic).toBe('all');
    expect(resetState.minChildrenScore).toBeNull();
    expect(resetState.hasActiveFilters()).toBe(false);
  });
});
