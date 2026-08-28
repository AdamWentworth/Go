import { Redirect } from 'expo-router';
import { Animated, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeRouteActionMenu } from '../../components/NativeRouteActionMenu';
import type { NativeFriendsOverviewModel } from '../../features/social/nativeFriendsModel';
import {
  NativeFriendsScreen,
  type NativeFriendsScreenCommand,
  type NativeFriendsView,
} from '../../screens/NativeFriendsScreen';

const baseFriend = {
  userId: 'user-misty',
  friendshipId: 'friendship-misty',
  username: 'Misty',
  pokemonGoName: 'CeruleanLeader',
  avatarLabel: 'M',
  team: 'mystic' as const,
  teamLabel: 'Team Mystic',
  trainerLevel: 50,
};

const INITIAL_OVERVIEW: NativeFriendsOverviewModel = {
  friends: [baseFriend],
  incoming: [{
    ...baseFriend,
    userId: 'user-brock',
    friendshipId: 'friendship-brock',
    username: 'Brock',
    pokemonGoName: 'PewterLeader',
    avatarLabel: 'B',
    team: 'valor',
    teamLabel: 'Team Valor',
  }, {
    ...baseFriend,
    userId: 'user-erika',
    friendshipId: 'friendship-erika',
    username: 'Erika',
    pokemonGoName: 'CeladonLeader',
    avatarLabel: 'E',
    team: 'instinct',
    teamLabel: 'Team Instinct',
  }],
  outgoing: [{
    ...baseFriend,
    userId: 'user-blue',
    friendshipId: 'friendship-blue',
    username: 'Blue',
    pokemonGoName: null,
    avatarLabel: 'B',
  }],
  blocked: [{
    ...baseFriend,
    userId: 'user-rocket',
    friendshipId: 'friendship-rocket',
    username: 'Rocket',
    pokemonGoName: null,
    avatarLabel: 'R',
    team: 'neutral',
    teamLabel: null,
  }],
};

export default function DeviceSmokeFriendsRoute() {
  const [activeView, setActiveView] = useState<NativeFriendsView>('friends');
  const [overview, setOverview] = useState(INITIAL_OVERVIEW);
  const [query, setQuery] = useState('gary');
  const [feedback, setFeedback] = useState<{ tone: 'success'; text: string } | null>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  const command = (action: NativeFriendsScreenCommand) => {
    if (action.action === 'accept') {
      const accepted = overview.incoming.find((row) => row.friendshipId === action.friendshipId);
      setOverview((current) => ({
        ...current,
        friends: accepted ? [...current.friends, accepted] : current.friends,
        incoming: current.incoming.filter((row) => row.friendshipId !== action.friendshipId),
      }));
      setFeedback({ tone: 'success', text: 'Friend request accepted.' });
      return;
    }
    if (action.action === 'unblock') {
      setOverview((current) => ({
        ...current,
        blocked: current.blocked.filter((row) => row.userId !== action.userId),
      }));
      setFeedback({ tone: 'success', text: 'Trainer unblocked.' });
      return;
    }
    if (action.action === 'delete-request') {
      setOverview((current) => ({
        ...current,
        incoming: current.incoming.filter((row) => row.friendshipId !== action.friendshipId),
        outgoing: current.outgoing.filter((row) => row.friendshipId !== action.friendshipId),
      }));
      setFeedback({ tone: 'success', text: action.message });
      return;
    }
    if (action.action === 'remove-friend') {
      setOverview((current) => ({
        ...current,
        friends: current.friends.filter((row) => row.userId !== action.userId),
      }));
      setFeedback({ tone: 'success', text: 'Friend removed.' });
      return;
    }
    setOverview((current) => ({
      ...current,
      outgoing: [...current.outgoing, {
        ...baseFriend,
        userId: 'user-gary',
        friendshipId: 'friendship-gary',
        username: action.username,
        pokemonGoName: 'PalletRival',
        avatarLabel: 'G',
        team: 'instinct',
        teamLabel: 'Team Instinct',
        trainerLevel: 47,
      }],
    }));
    setFeedback({ tone: 'success', text: 'Friend request sent.' });
  };

  return (
    <View style={styles.screen}>
      <NativeFriendsScreen
        activeView={activeView}
        feedback={feedback}
        onBack={() => undefined}
        onCommand={command}
        onDismissFeedback={() => setFeedback(null)}
        onOpenProfile={() => undefined}
        onOpenProfileHome={() => undefined}
        onQueryChange={setQuery}
        onRunSearch={() => undefined}
        onViewChange={setActiveView}
        overview={overview}
        query={query}
        scrollX={scrollX}
        searchResults={[{
          username: 'GaryOak',
          pokemonGoName: 'PalletRival',
          avatarLabel: 'G',
          team: 'instinct',
          teamLabel: 'Team Instinct',
          trainerLevel: 47,
        }]}
      />
      <NativeRouteActionMenu currentPath="/profile/friends" signedIn />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
