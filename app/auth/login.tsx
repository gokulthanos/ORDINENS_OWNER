import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/store/auth';
import { required, email, minLength } from '@/utils/validation';

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();

  const [emailV, setEmailV] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    const nameErr = required(emailV, 'Email');
    const emailErr = email(emailV);
    if (nameErr) e.email = nameErr;
    else if (emailErr) e.email = emailErr;
    const passErr = required(password, 'Password');
    const lenErr = minLength(password, 6, 'Password');
    if (passErr) e.password = passErr;
    else if (lenErr) e.password = lenErr;
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const result = await signIn(emailV.trim().toLowerCase(), password);
    setLoading(false);
    if (result.error) {
      setErrors({ form: result.error });
      return;
    }
    router.replace('/');
  };

  return (
    <Screen title="Welcome back" subtitle="Sign in to manage your shop">
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