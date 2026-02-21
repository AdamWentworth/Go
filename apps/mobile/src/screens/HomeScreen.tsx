import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthProvider';
import type { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.username}>{user?.username ?? 'Trainer'}</Text>
      <Text style={styles.caption}>Mobile parity workbench</Text>
      <Button title="Trainer Search" onPress={() => navigation.navigate('TrainerSearch')} />
      <Button title="Pokemon Catalog" onPress={() => navigation.navigate('PokemonCatalog')} />
      <Button title="My Collection" onPress={() => navigation.navigate('PokemonCollection')} />
      <Button title="Search" onPress={() => navigation.navigate('Search')} />
      <Button title="Trades" onPress={() => navigation.navigate('Trades')} />
      <Button title="Account" onPress={() => navigation.navigate('Account')} />
      <Button title="Sign Out" onPress={() => void signOut()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
  },
  caption: {
    color: '#666',
  },
});
