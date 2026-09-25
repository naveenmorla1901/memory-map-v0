import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AuthStyles } from './AuthStyles';
import { authService } from '../../services/AuthService';
import { loginSchema } from '../../utils/validation';
import { ApiError } from '../../config/api';

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await authService.login(identifier.trim(), password);
      // Navigation to the main app is handled by AppNavigator, which listens
      // for auth state changes.
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Could not sign in. Please check your connection and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={AuthStyles.container} keyboardShouldPersistTaps="handled">
        <Text style={AuthStyles.title}>Memory Map</Text>
        <Text style={AuthStyles.subtitle}>Sign in to see your saved places</Text>

        <View style={AuthStyles.form}>
          {!!error && <Text style={AuthStyles.errorText}>{error}</Text>}

          <Text style={AuthStyles.label}>Username or Email</Text>
          <TextInput
            style={AuthStyles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={AuthStyles.label}>Password</Text>
          <TextInput
            style={AuthStyles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={AuthStyles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={AuthStyles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={AuthStyles.footer}>
            <Text style={AuthStyles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={AuthStyles.signUp}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
