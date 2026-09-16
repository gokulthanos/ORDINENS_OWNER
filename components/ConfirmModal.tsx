import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/constants/theme';
import Button from './Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors, spacing } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onCancel} />
        <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} style={{ flex: 1 }} />
            <Button
              title={confirmLabel}
              variant={danger ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
});