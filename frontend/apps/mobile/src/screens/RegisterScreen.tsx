import React, { useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../features/auth/AuthProvider';
import {
  getRegisterFieldStates,
  normalizeTrainerCode,
  validateRegisterForm,
} from '../features/auth/registerValidation';
import { mapAuthErrorMessage } from '../features/auth/serverErrorMessages';
import { registerUser } from '../services/authService';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pokemonGoName, setPokemonGoName] = useState('');
  const [trainerCode, setTrainerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldStates = useMemo(
    () =>
      getRegisterFieldStates({
        username,
        email,
        password,
        pokemonGoName,
        trainerCode,
      }),
    [username, email, password, pokemonGoName, trainerCode],
  );
  const validationError = useMemo(
    () =>
      validateRegisterForm({
        username,
        email,
        password,
        pokemonGoName,
        trainerCode,
      }),
    [username, email, password, pokemonGoName, trainerCode],
  );
  const canSubmit = !loading && validationError === null;

  const handleRegister = async () => {
    if (!canSubmit) {
      if (validationError) setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
        pokemonGoName: pokemonGoName.trim(),
        trainerCode: normalizeTrainerCode(trainerCode),
      });

      await signIn({ username: username.trim(), password });
    } catch (nextError) {
      setError(mapAuthErrorMessage(nextError, 'register'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Register</Text>
      <Text style={commonStyles.subtitle}>Create a new trainer account</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={commonStyles.input}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={commonStyles.input}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={commonStyles.input}
      />
      <TextInput
        placeholder="Pokemon GO name"
        value={pokemonGoName}
        onChangeText={setPokemonGoName}
        style={commonStyles.input}
      />
      <TextInput
        keyboardType="number-pad"
        placeholder="Trainer code (12 digits)"
        value={trainerCode}
        onChangeText={setTrainerCode}
        style={commonStyles.input}
      />
      <View style={styles.validationCard}>
        <Text style={commonStyles.caption}>Validation checklist</Text>
        {fieldStates.map((state) => (
          <Text key={state.key} style={state.valid ? styles.validHint : styles.invalidHint}>
            {state.valid ? 'PASS' : 'TODO'} {state.label}
          </Text>
        ))}
      </View>

      <View style={commonStyles.actions}>
        <Button title={loading ? 'Registering...' : 'Register'} onPress={() => void handleRegister()} disabled={!canSubmit} />
        <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
      </View>

      {error ? <Text style={commonStyles.error}>{error}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
    padding: 24,
  },
  validationCard: {
    ...commonStyles.card,
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
