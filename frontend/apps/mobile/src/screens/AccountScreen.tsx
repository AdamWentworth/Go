import React, { useMemo, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoginResponse } from '@pokemongonexus/shared-contracts/auth';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../features/auth/AuthProvider';
import {
  getAccountFieldStates,
  parseAllowLocationInput,
  validateAccountForm,
} from '../features/auth/accountValidation';
import { mapAuthErrorMessage } from '../features/auth/serverErrorMessages';
import {
  deleteAccount,
  updateAuthAccount,
  updateSecondaryAccount,
} from '../services/accountService';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type AccountScreenProps = NativeStackScreenProps<RootStackParamList, 'Account'>;

export const AccountScreen = ({ navigation }: AccountScreenProps) => {
  const { user, updateUser, signOut } = useAuth();
  const [pokemonGoName, setPokemonGoName] = useState(user?.pokemonGoName ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [allowLocationInput, setAllowLocationInput] = useState(user?.allowLocation ? 'true' : 'false');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fieldStates = useMemo(
    () =>
      getAccountFieldStates({
        pokemonGoName,
        allowLocationInput,
      }),
    [pokemonGoName, allowLocationInput],
  );

  const saveAccount = async () => {
    if (!user?.user_id) {
      setError('Missing authenticated user.');
      return;
    }
    const validationError = validateAccountForm({
      pokemonGoName,
      allowLocationInput,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    const parsedAllowLocation = parseAllowLocationInput(allowLocationInput);
    if (parsedAllowLocation.value === null) {
      setError(parsedAllowLocation.error ?? 'Invalid allow location value.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const allowLocation = parsedAllowLocation.value;
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
      setError(mapAuthErrorMessage(nextError, 'account_update'));
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
              setError(mapAuthErrorMessage(nextError, 'account_delete'));
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
      <Text style={commonStyles.title}>Account</Text>
      <Text style={commonStyles.subtitle}>Mobile baseline for account/profile updates</Text>

      <View style={commonStyles.card}>
        <Text style={commonStyles.caption}>Username: {user?.username ?? '-'}</Text>
        <Text style={commonStyles.caption}>Email: {String(user?.email ?? '-')}</Text>
        <Text style={commonStyles.caption}>Trainer code: {String(user?.trainerCode ?? '-')}</Text>
      </View>

      <TextInput
        placeholder="Pokemon GO name"
        value={pokemonGoName}
        onChangeText={setPokemonGoName}
        style={commonStyles.input}
      />
      <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={commonStyles.input} />
      <TextInput
        placeholder="Allow location (true/false)"
        value={allowLocationInput}
        onChangeText={setAllowLocationInput}
        autoCapitalize="none"
        style={commonStyles.input}
      />
      <View style={commonStyles.card}>
        <Text style={commonStyles.caption}>Validation checklist</Text>
        {fieldStates.map((state) => (
          <Text key={state.key} style={state.valid ? styles.validHint : styles.invalidHint}>
            {state.valid ? 'PASS' : 'TODO'} {state.label}
          </Text>
        ))}
      </View>

      <View style={commonStyles.actions}>
        <Button title={loading ? 'Saving...' : 'Save'} onPress={() => void saveAccount()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {success ? <Text style={commonStyles.success}>{success}</Text> : null}
      {error ? <Text style={commonStyles.error}>{error}</Text> : null}

      <View style={styles.dangerArea}>
        <Button color="#b00020" title="Delete Account" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
  },
  dangerArea: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  validHint: {
    color: theme.colors.success,
    fontSize: theme.type.caption,
  },
  invalidHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption,
  },
});
