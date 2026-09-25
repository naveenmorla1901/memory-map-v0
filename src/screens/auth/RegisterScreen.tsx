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
import { registerSchema } from '../../utils/validation';
import { ApiError } from '../../config/api';

const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    const result = registerSchema.safeParse({
      username,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username: username.trim(),
        email: email.trim(),
        password,
        password2: confirmPassword,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      // Navigation to the main app is handled by AppNavigator, which listens
      // for auth state changes.
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Could not create your account. Please check your connection and try again.';
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
        <Text style={AuthStyles.title}>Create Account</Text>
        <Text style={AuthStyles.subtitle}>Start saving the places you love</Text>

        <View style={AuthStyles.form}>
          {!!error && <Text style={AuthStyles.errorText}>{error}</Text>}

          <Text style={AuthStyles.label}>Username</Text>
          <TextInput
            style={AuthStyles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={AuthStyles.label}>First Name</Text>
          <TextInput
            style={AuthStyles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            editable={!loading}
          />

          <Text style={AuthStyles.label}>Last Name</Text>
          <TextInput
            style={AuthStyles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            editable={!loading}
          />

          <Text style={AuthStyles.label}>Email</Text>
          <TextInput
            style={AuthStyles.input}
            value={email}
            onChangeText={setEmail}
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
            placeholder="At least 8 characters"
            secureTextEntry
            editable={!loading}
          />

          <Text style={AuthStyles.label}>Confirm Password</Text>
          <TextInput
            style={AuthStyles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={AuthStyles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={AuthStyles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={AuthStyles.footer}>
            <Text style={AuthStyles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={AuthStyles.signUp}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
