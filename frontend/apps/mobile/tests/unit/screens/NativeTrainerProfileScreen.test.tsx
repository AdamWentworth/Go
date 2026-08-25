import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeTrainerProfileScreen } from '../../../src/screens/NativeTrainerProfileScreen';
import type { NativeTrainerProfileModel } from '../../../src/features/social/nativeTrainerProfileModel';
import type { NativeCollectionRow } from '../../../src/features/collection/collectionModel';

const model: NativeTrainerProfileModel = {
  userId: 'user-1',
  username: 'AdamZilla',
  pokemonGoName: 'AdamGo',
  avatarLabel: 'A',
  team: 'mystic',
  teamLabel: 'Team Mystic',
  trainerLevel: 50,
  totalXpLabel: '123,456 XP',
  memberSinceLabel: 'Jan 2, 2026',
  startedLabel: 'Jul 6, 2016',
  locationLabel: 'Burnaby, British Columbia, Canada',
  trainerCodeLabel: '1234 5678 9012',
  titles: [{ id: 'shiny-hunter', label: 'Shiny Hunter', description: 'Hunting shiny Pokémon' }],
  highlights: [],
  stats: [
    { key: 'registered', label: 'Registered', value: 800 },
    { key: 'caught', label: 'Caught', value: 100 },
    { key: 'trade', label: 'For trade', value: 20 },
    { key: 'wanted', label: 'Wanted', value: 30 },
    { key: 'favorites', label: 'Favorites', value: 10 },
  ],
  relationship: 'self',
  friendshipId: null,
  canViewCollection: true,
};

const highlight: NativeCollectionRow = {
  id: 'highlight-1',
  pokemonId: 6,
  pokedexNumber: 6,
  name: 'Shiny Gigantamax Charizard',
  imageUri: 'https://pokegonexus.com/images/shiny_gigantamax/shiny_gigantamax_6.png',
  locationBackgroundUri: null,
  maxKind: 'gigantamax',
  purified: false,
  lucky: false,
  typeIconUris: [],
  status: 'caught',
  cp: 3000,
  favorite: true,
  mostWanted: false,
};

const renderScreen = (props: Partial<React.ComponentProps<typeof NativeTrainerProfileScreen>> = {}) => render(
  <SafeAreaProvider initialMetrics={{
    frame: { x: 0, y: 0, width: 412, height: 915 },
    insets: { top: 24, right: 0, bottom: 20, left: 0 },
  }}>
    <NativeTrainerProfileScreen
      assetBaseUrl="https://pokegonexus.com"
      highlights={[highlight]}
      isOwner
      model={model}
      onOpenCollection={jest.fn()}
      {...props}
    />
  </SafeAreaProvider>,
);

describe('NativeTrainerProfileScreen', () => {
  it('renders the canonical trainer card hierarchy and showcase', () => {
    const view = renderScreen();
    expect(view.getByText('YOUR TRAINER CARD')).toBeTruthy();
    expect(view.getByText('AdamGo')).toBeTruthy();
    expect(view.getByText('@AdamZilla')).toBeTruthy();
    expect(view.getByText('Shiny Gigantamax Charizard')).toBeTruthy();
    expect(view.getByText('Shiny Hunter')).toBeTruthy();
    expect(view.getByText('1234 5678 9012')).toBeTruthy();
  });

  it('opens the exact collection filter from a collection stat', () => {
    const onOpenCollection = jest.fn();
    const view = renderScreen({ onOpenCollection });
    fireEvent.press(view.getByText('For trade'));
    expect(onOpenCollection).toHaveBeenCalledWith('trade');
    fireEvent.press(view.getByRole('button', { name: 'View Pokémon' }));
    expect(onOpenCollection).toHaveBeenCalledWith();
  });

  it('opens Friends from the shared trainer workspace navigation', () => {
    const onOpenFriends = jest.fn();
    const view = renderScreen({ onOpenFriends });
    fireEvent.press(view.getByRole('tab', { name: 'Friends' }));
    expect(onOpenFriends).toHaveBeenCalledTimes(1);
  });

  it('surfaces loading and retryable error states above the workflow', () => {
    const retry = jest.fn();
    const loading = renderScreen({ isLoading: true });
    expect(loading.getByText('Loading trainer profile')).toBeTruthy();
    loading.unmount();

    const failed = renderScreen({ error: 'Profile is private.', model: null, onRetry: retry });
    expect(failed.getByText('Profile is private.')).toBeTruthy();
    fireEvent.press(failed.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });

  it('runs direct friend actions and confirms destructive relationship changes', () => {
    const onRelationshipAction = jest.fn();
    const view = renderScreen({
      isOwner: false,
      model: { ...model, relationship: 'none' },
      onRelationshipAction,
    });
    fireEvent.press(view.getByRole('button', { name: 'Add friend' }));
    expect(onRelationshipAction).toHaveBeenCalledWith('add');

    view.rerender(
      <SafeAreaProvider initialMetrics={{
        frame: { x: 0, y: 0, width: 412, height: 915 },
        insets: { top: 24, right: 0, bottom: 20, left: 0 },
      }}>
        <NativeTrainerProfileScreen
          assetBaseUrl="https://pokegonexus.com"
          highlights={[highlight]}
          isOwner={false}
          model={{ ...model, relationship: 'outgoing', friendshipId: 'friendship-1' }}
          onOpenCollection={jest.fn()}
          onRelationshipAction={onRelationshipAction}
        />
      </SafeAreaProvider>,
    );
    fireEvent.press(view.getByRole('button', { name: 'Request sent' }));
    expect(view.getByText('Cancel friend request?')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Cancel request' }));
    expect(onRelationshipAction).toHaveBeenCalledWith('cancel-request');
  });

  it('keeps command feedback visible and dismissible', () => {
    const onDismissFeedback = jest.fn();
    const view = renderScreen({
      feedback: { tone: 'error', text: 'Friend requests are disabled.' },
      onDismissFeedback,
    });
    expect(view.getByText('Friend requests are disabled.')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Dismiss message' }));
    expect(onDismissFeedback).toHaveBeenCalledTimes(1);
  });

  it('opens the owner editor, updates canonical fields, and saves explicitly', () => {
    const onBeginEdit = jest.fn();
    const onCancelEdit = jest.fn();
    const onChangeEditorDraft = jest.fn();
    const onSaveProfile = jest.fn();
    const editorDraft = {
      trainerTitles: ['shiny-hunter' as const],
      pokemonGoName: 'AdamGo',
      trainerCode: '123456789012',
      team: 'Mystic',
      trainerLevel: '50',
      totalXp: '123456',
      startedOn: '2016-07-06',
      location: 'Burnaby, BC',
      highlightInstanceIds: ['highlight-1'],
    };
    const closed = renderScreen({ onBeginEdit });
    fireEvent.press(closed.getByRole('button', { name: 'Edit profile' }));
    expect(onBeginEdit).toHaveBeenCalledTimes(1);
    closed.unmount();

    const view = renderScreen({
      editorDraft,
      onBeginEdit,
      onCancelEdit,
      onChangeEditorDraft,
      onSaveProfile,
    });
    expect(view.getByText('Your trainer details')).toBeTruthy();
    fireEvent.changeText(view.getByLabelText('Pokémon GO name'), 'UpdatedAdam');
    expect(onChangeEditorDraft).toHaveBeenCalledWith({
      ...editorDraft,
      pokemonGoName: 'UpdatedAdam',
    });
    fireEvent.press(view.getByRole('button', { name: 'Save profile' }));
    expect(onSaveProfile).toHaveBeenCalledTimes(1);
    fireEvent.press(view.getAllByRole('button', { name: 'Cancel' })[0]);
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it('edits and reorders the six-slot showcase from caught Pokémon only', () => {
    const onChangeEditorDraft = jest.fn();
    const editorDraft = {
      trainerTitles: [] as const,
      pokemonGoName: 'AdamGo',
      trainerCode: '',
      team: 'Mystic',
      trainerLevel: '50',
      totalXp: '',
      startedOn: '',
      location: '',
      highlightInstanceIds: ['highlight-1', 'highlight-2'],
    };
    const secondHighlight = {
      ...highlight,
      id: 'highlight-2',
      name: 'Shiny Suicune',
      pokedexNumber: 245,
      pokemonId: 245,
    };
    const replacement = {
      ...highlight,
      id: 'highlight-3',
      name: 'Shiny Metagross',
      pokedexNumber: 376,
      pokemonId: 376,
    };
    const view = renderScreen({
      editorDraft: { ...editorDraft, trainerTitles: [] },
      highlightCandidates: [highlight, secondHighlight, replacement],
      highlights: [highlight, secondHighlight],
      onBeginEdit: jest.fn(),
      onCancelEdit: jest.fn(),
      onChangeEditorDraft,
      onSaveProfile: jest.fn(),
    });

    fireEvent.press(view.getByRole('button', {
      name: 'Shiny Gigantamax Charizard, edit showcase slot 1',
    }));
    expect(view.getByText('Choose a caught Pokémon')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Shiny Metagross' }));
    expect(onChangeEditorDraft).toHaveBeenCalledWith({
      ...editorDraft,
      trainerTitles: [],
      highlightInstanceIds: ['highlight-3', 'highlight-2', '', '', '', ''],
    });

    fireEvent.press(view.getByRole('button', { name: 'Move showcase slot 1 right' }));
    expect(onChangeEditorDraft).toHaveBeenCalledWith({
      ...editorDraft,
      trainerTitles: [],
      highlightInstanceIds: ['highlight-2', 'highlight-1', '', '', '', ''],
    });
  });
});
