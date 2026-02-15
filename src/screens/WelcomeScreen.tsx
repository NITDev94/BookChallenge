import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';

export const WelcomeScreen = () => {
  const dispatch = useDispatch();

  const handleLogin = () => {
    // Simulating a login
    dispatch(loginSuccess({
      user: { name: 'Test User', email: 'test@example.com' },
      token: 'fake-token-123'
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Book Challenge</Text>
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
