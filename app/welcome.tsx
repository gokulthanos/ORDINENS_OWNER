import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import LogoImage from '@/components/LogoImage';
import { useAuth } from '@/store/auth';

/*
 * Welcome Owner animation shown right after a successful login.
 *
 * Flow:
 *   Login Success → Logo animates in → "Welcome, Owner"
 *   → "Welcome, <Name>" → Owner Dashboard
 *
 * Short (~1.9s), smooth and mobile friendly.
 */
export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { session, loading } = useAuth();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.7);
  const line1Opacity = useSharedValue(0);
  const line2Opacity = useSharedValue(0);

  const firstName = session
    ? (session.name || session.email.split('@')[0] || 'Owner').trim()
    : 'Owner';
  const prettyName = firstName.split(' ')[0].charAt(0).toUpperCase() + firstName.split(' ')[0].slice(1);

  useEffect(() => {
    if (loading || !session) return;

    logoOpacity.value = withTiming(1, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.back(1.4)),
    });
    line1Opacity.value = withDelay(500, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    line2Opacity.value = withDelay(900, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));

    const t = setTimeout(() => {
      router.replace('/(tabs)/dashboard');
    }, 1950);

    return () => clearTimeout(t);
  }, [loading, session, router, logoOpacity, logoScale, line1Opacity, line2Opacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const line1Style = useAnimatedStyle(() => ({ opacity: line1Opacity.value }));
  const line2Style = useAnimatedStyle(() => ({ opacity: line2Opacity.value }));

  if (loading) return null;
  if (!session) return <Redirect href="/auth/login" />;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <LogoImage size={120} style={{ borderWidth: 0 }} />
      </Animated.View>

      <Animated.View style={[styles.lineWrap, line1Style]}>
        <Text style={[styles.line1, { color: colors.textMuted }]}>Welcome, Owner</Text>
      </Animated.View>

      <Animated.View style={[styles.lineWrap, line2Style]}>
        <Text style={[styles.line2, { color: colors.brand }]}>Welcome, {prettyName}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    alignItems: 'center',
  },
  lineWrap: {
    alignItems: 'center',
  },
  line1: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 26,
  },
  line2: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
});