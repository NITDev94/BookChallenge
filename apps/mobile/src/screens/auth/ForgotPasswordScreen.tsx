import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Entre ton adresse email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(getAuth(), email.trim());
      setSuccess(true);
    } catch (e: any) {
      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          setError('Aucun compte trouvé avec cet email.');
          break;
        case 'auth/network-request-failed':
          setError('Problème de connexion réseau.');
          break;
        default:
          setError('Une erreur est survenue. Réessaie.');
      }
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
                <Text style={styles.title}>Mot de passe oublié ?</Text>
                <Text style={styles.subtitle}>
                  Entre ton email pour recevoir un lien de réinitialisation.
                </Text>
              </View>

              {success ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>
                    ✅ Email envoyé ! Vérifie ta boîte mail et suis les instructions.
                  </Text>
                  <Button
                    title="Retour à la connexion"
                    onPress={() => navigation.goBack()}
                    style={styles.resetButton}
                  />
                </View>
              ) : (
                <>
                  <TextInput
                    label="Email"
                    placeholder="Ton adresse email"
                    value={email}
                    onChangeText={text => { setEmail(text); setError(''); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <Button
                    title="Réinitialiser le mot de passe"
                    onPress={handleReset}
                    isLoading={loading}
                    style={styles.resetButton}
                  />
                </>
              )}
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
    lineHeight: 22,
  },
  errorText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    marginTop: 4,
    marginBottom: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  resetButton: { marginTop: 8 },
});
