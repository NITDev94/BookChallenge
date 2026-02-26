import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from '@react-native-firebase/auth';
import { createUserDocument } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

const getFirebaseErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/network-request-failed':
      return 'Problème de connexion réseau.';
    default:
      return 'Une erreur est survenue. Réessaie.';
  }
};

export const SignupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Remplis tous les champs.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      console.log('🔐 [Signup] Step 1: Creating Auth account...');
      // 1. Create the Firebase Auth account
      const credential = await createUserWithEmailAndPassword(
        getAuth(),
        email.trim(),
        password,
      );
      console.log('🔐 [Signup] Step 1 OK — uid:', credential.user.uid);

      // 2. Save the display name to the Auth profile
      console.log('🔐 [Signup] Step 2: Updating profile displayName...');
      await updateProfile(credential.user, { displayName: username.trim() });
      console.log('🔐 [Signup] Step 2 OK');

      // 3. Create the user document in Firestore
      console.log('🔐 [Signup] Step 3: Writing Firestore document...');
      await createUserDocument(
        credential.user.uid,
        email.trim(),
        username.trim(),
      );
      console.log('🔐 [Signup] Step 3 OK — all done!');
      // onAuthStateChanged in App.tsx will handle Redux update & navigation
    } catch (e: any) {
      console.error('🔐 [Signup] ERROR at step:', e.code, e.message, e);
      setError(getFirebaseErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => { }}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>Rejoins l'aventure de lecture</Text>
              </View>

              <TextInput
                label="Nom d'utilisateur"
                placeholder="Ton pseudo"
                value={username}
                onChangeText={text => { setUsername(text); setError(''); }}
                autoCapitalize="words"
              />
              <TextInput
                label="Email"
                placeholder="Ton adresse email"
                value={email}
                onChangeText={text => { setEmail(text); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <TextInput
                label="Mot de passe"
                placeholder="Crée un mot de passe (min. 6 car.)"
                value={password}
                onChangeText={text => { setPassword(text); setError(''); }}
                secureTextEntry
                autoComplete="new-password"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                title="S'inscrire"
                onPress={handleSignup}
                isLoading={loading}
                style={styles.primaryButton}
              />

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
              </View>

              <Button
                title="Se connecter avec réseaux"
                variant="secondary"
                onPress={() => { }}
                style={styles.socialButton}
              />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Déjà un compte ? </Text>
                <TouchableOpacity onPress={() => navigation.replace('Login')}>
                  <Text style={styles.footerLink}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: { marginBottom: 24 },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    marginTop: 4,
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  socialButton: { marginBottom: 20 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  footerLink: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
