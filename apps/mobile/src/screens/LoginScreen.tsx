import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../features/auth/AuthProvider';

export const LoginScreen = () => {
  const { signIn, error, clearError, status } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.trim().length > 0 && !submitting,
    [username, password, submitting],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    clearError();
    setSubmitting(true);
    try {
      await signIn({ username: username.trim(), password });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'bootstrapping') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.caption}>Bootstrapping session…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pokemon Go Nexus</Text>
      <Text style={styles.subtitle}>Mobile Auth Shell</Text>

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
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title={submitting ? 'Signing in…' : 'Sign In'} onPress={handleSubmit} disabled={!canSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: '#b00020',
    marginBottom: 4,
  },
  caption: {
    color: '#666',
  },
});
