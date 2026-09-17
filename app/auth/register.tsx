import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Input from '@/components/Input';
import Button from '@/components/Button';
import LogoImage from '@/components/LogoImage';
import { useAuth } from '@/store/auth';
import { required, email, minLength, phone } from '@/utils/validation';

export default function RegisterScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [emailV, setEmailV] = useState('');
  const [phoneV, setPhoneV] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    const nameErr = required(name, 'Full name');
    if (nameErr) e.name = nameErr;
    const emailNameErr = required(emailV, 'Email');
    const emailErr = email(emailV);
    if (emailNameErr) e.email = emailNameErr;
    else if (emailErr) e.email = emailErr;
    if (phoneV) {
      const phoneErr = phone(phoneV);
      if (phoneErr) e.phone = phoneErr;
    }
    const passErr = required(password, 'Password');
    const lenErr = minLength(password, 6, 'Password');
    if (passErr) e.password = passErr;
    else if (lenErr) e.password = lenErr;
    if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const result = await signUp(emailV.trim().toLowerCase(), password, name.trim(), phoneV.trim() || undefined);
    setLoading(false);
    if (result.error) {
      setErrors({ form: result.error });
      return;
    }
    router.replace('/');
  };

  return (
    <Screen title="Create your account" subtitle="Start managing your shop in minutes">
      <View style={styles.logoWrap}>
        <LogoImage size={88} />
      </View>
      {errors.form ? <Text style={[styles.formError, { color: colors.danger, marginBottom: spacing.md }]}>{errors.form}</Text> : null}
      <View style={{ marginTop: spacing.lg }}>
        <Input label="Full name" value={name} onChangeText={setName} placeholder="Owner name" error={errors.name} />
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
          label="Phone (optional)"
          value={phoneV}
          onChangeText={setPhoneV}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          error={errors.password}
        />
        <Input
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repeat your password"
          secureTextEntry
          error={errors.confirm}
        />
        <Button title="Create account" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>Already have an account?</Text>
        <Text style={[styles.link, { color: colors.brand }]} onPress={() => router.push('/auth/login')}>
          Sign in
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