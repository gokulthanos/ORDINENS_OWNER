import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Input from '@/components/Input';
import Button from '@/components/Button';
import LogoImage from '@/components/LogoImage';
import { useAuth } from '@/store/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[^A-Za-z0-9]).{6,}$/;

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();

  const [emailV, setEmailV] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    // TEMPORARY PROTOTYPE AUTH
    // Accept valid email/password format only.
    // Replace with real backend authentication before production.
    const e: typeof errors = {};
    const trimmedEmail = emailV.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      e.email = 'Please enter a valid email address.';
    }

    if (password.length < 6) {
      e.password = 'Password must be at least 6 characters.';
    } else if (!PASSWORD_PATTERN.test(password)) {
      e.password = 'Password must contain at least 1 special character.';
    }

    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const result = await signIn(trimmedEmail.toLowerCase(), password);
    setLoading(false);
    if (result.error) {
      setErrors({ form: result.error });
      return;
    }
    router.replace('/welcome');
  };

  return (
    <Screen title="Welcome back" subtitle="Sign in to manage your shop">
      <View style={styles.logoWrap}>
        <LogoImage size={88} />
      </View>
      {errors.form ? <Text style={[styles.formError, { color: colors.danger, marginBottom: spacing.md }]}>{errors.form}</Text> : null}
      <View style={{ marginTop: spacing.lg }}>
        <Input
          label="Email"
          value={emailV}
          onChangeText={setEmailV}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          error={errors.password}
        />
        <Button title="Sign in" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>New to Ordinens Owner?</Text>
        <Text style={[styles.link, { color: colors.brand }]} onPress={() => router.push('/auth/register')}>
          Create an account
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
  formError: {
    fontSize: 13,
    fontWeight: '500',
  },
});