import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/constants/theme';
import Screen from './Screen';
import Button from './Button';

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueLoading?: boolean;
  continueDisabled?: boolean;
  footerExtra?: React.ReactNode;
  children: React.ReactNode;
}

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueLoading = false,
  continueDisabled = false,
  footerExtra,
  children,
}: OnboardingLayoutProps) {
  const { colors, spacing } = useTheme();
  const progress = step / totalSteps;

  return (
    <Screen subtitle="" scroll={false}>
      <View style={styles.progressRow}>
        <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
          Step {Math.min(step, totalSteps)} of {totalSteps}
        </Text>
        <Text style={[styles.stepLabel, { color: colors.textMuted }]}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%`, backgroundColor: colors.brand }]} />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>

      <View style={{ flex: 1 }}>{children}</View>

      <View style={styles.footer}>
        {footerExtra ? <View style={{ marginBottom: spacing.md }}>{footerExtra}</View> : null}
        <View style={styles.actions}>
          {onBack ? (
            <Button title="Back" variant="secondary" onPress={onBack} style={{ flex: 1 }} disabled={continueLoading} />
          ) : null}
          {onContinue ? (
            <Button
              title={continueLabel}
              onPress={onContinue}
              loading={continueLoading}
              disabled={continueDisabled}
              style={{ flex: onBack ? 2 : 1 }}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  footer: {
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});