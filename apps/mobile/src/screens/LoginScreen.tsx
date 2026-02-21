import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthProvider';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { commonStyles } from '../ui/commonStyles';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
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
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator />
        <Text style={commonStyles.caption}>Bootstrapping session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={commonStyles.title}>Pokemon Go Nexus</Text>
      <Text style={commonStyles.subtitle}>Mobile Auth Shell</Text>

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
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={commonStyles.input}
      />

      {error ? <Text style={commonStyles.error}>{error}</Text> : null}

      <Button
        title={submitting ? 'Signing in...' : 'Sign In'}
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
      />
      <Button title="Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
});
