import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoginResponse } from '@pokemongonexus/shared-contracts/auth';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../features/auth/AuthProvider';
import {
  deleteAccount,
  updateAuthAccount,
  updateSecondaryAccount,
} from '../services/accountService';

type AccountScreenProps = NativeStackScreenProps<RootStackParamList, 'Account'>;

export const AccountScreen = ({ navigation }: AccountScreenProps) => {
  const { user, updateUser, signOut } = useAuth();
  const [pokemonGoName, setPokemonGoName] = useState(user?.pokemonGoName ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [allowLocationInput, setAllowLocationInput] = useState(user?.allowLocation ? 'true' : 'false');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const saveAccount = async () => {
    if (!user?.user_id) {
      setError('Missing authenticated user.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const allowLocation = allowLocationInput.trim().toLowerCase() === 'true';
      await updateAuthAccount(user.user_id, {
        pokemonGoName: pokemonGoName.trim(),
        location: location.trim(),
        allowLocation,
      });

      await updateSecondaryAccount(user.user_id, {
        username: user.username,
        pokemonGoName: pokemonGoName.trim(),
        latitude: user.coordinates?.latitude,
        longitude: user.coordinates?.longitude,
      });

      const nextUser: LoginResponse = {
        ...user,
        pokemonGoName: pokemonGoName.trim(),
        location: location.trim(),
        allowLocation,
      };
      await updateUser(nextUser);
      setSuccess('Account updated successfully.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to update account.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!user?.user_id) return;
    Alert.alert('Delete Account', 'This action is permanent. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setLoading(true);
            setError(null);
            setSuccess(null);
            try {
              await deleteAccount(user.user_id);
              await signOut();
            } catch (nextError) {
              setError(nextError instanceof Error ? nextError.message : 'Failed to delete account.');
            } finally {
              setLoading(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Mobile baseline for account/profile updates</Text>

      <View style={styles.card}>
        <Text style={styles.caption}>Username: {user?.username ?? '-'}</Text>
        <Text style={styles.caption}>Email: {String(user?.email ?? '-')}</Text>
        <Text style={styles.caption}>Trainer code: {String(user?.trainerCode ?? '-')}</Text>
      </View>

      <TextInput
        placeholder="Pokemon GO name"
        value={pokemonGoName}
        onChangeText={setPokemonGoName}
        style={styles.input}
      />
      <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
      <TextInput
        placeholder="Allow location (true/false)"
        value={allowLocationInput}
        onChangeText={setAllowLocationInput}
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.actions}>
        <Button title={loading ? 'Saving...' : 'Save'} onPress={() => void saveAccount()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.dangerArea}>
        <Button color="#b00020" title="Delete Account" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  caption: {
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  actions: {
    gap: 8,
  },
  success: {
    color: '#047857',
  },
  error: {
    color: '#b00020',
  },
  dangerArea: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
});

