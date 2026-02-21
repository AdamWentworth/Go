import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../features/auth/AuthProvider';

export const HomeScreen = () => {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.username}>{user?.username ?? 'Trainer'}</Text>
      <Text style={styles.caption}>P2.2 navigation + auth shell is wired.</Text>
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
