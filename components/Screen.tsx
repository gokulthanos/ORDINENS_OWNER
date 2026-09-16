import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  padded?: boolean;
  scroll?: boolean;
  headerRight?: React.ReactNode;
  contentStyle?: ViewStyle;
}

export default function Screen({ children, title, subtitle, padded = true, scroll = true, headerRight, contentStyle }: ScreenProps) {
  const { colors, spacing } = useTheme();
  const inner = (
    <View style={[{ padding: padded ? spacing.lg : 0, flexGrow: 1 }, contentStyle]}>
      {title ? (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
          </View>
          {headerRight ? <View style={{ marginLeft: spacing.md }}>{headerRight}</View> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});