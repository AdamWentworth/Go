import React, { useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../features/auth/AuthProvider';
import { registerUser } from '../services/authService';

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

  const canSubmit = useMemo(
    () =>
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      pokemonGoName.trim().length > 0 &&
      trainerCode.replace(/\s+/g, '').length === 12 &&
      !loading,
    [username, email, password, pokemonGoName, trainerCode, loading],
  );

  const handleRegister = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
        pokemonGoName: pokemonGoName.trim(),
        trainerCode: trainerCode.replace(/\s+/g, ''),
      });

      await signIn({ username: username.trim(), password });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Text style={styles.subtitle}>Create a new trainer account</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TextInput
        placeholder="Pokemon GO name"
        value={pokemonGoName}
        onChangeText={setPokemonGoName}
        style={styles.input}
      />
      <TextInput
        keyboardType="number-pad"
        placeholder="Trainer code (12 digits)"
        value={trainerCode}
        onChangeText={setTrainerCode}
        style={styles.input}
      />

      <View style={styles.actions}>
        <Button title={loading ? 'Registering...' : 'Register'} onPress={() => void handleRegister()} disabled={!canSubmit} />
        <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
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
  error: {
    color: '#b00020',
  },
});

