import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/constants/theme';
import { StaffMember } from '@/types';
import Card from './Card';

interface StaffCardProps {
  staff: StaffMember;
  onPress?: () => void;
}

const ROLE_COLORS = ['#f97316', '#fb923c', '#ea580c', '#fdba74', '#c2410c', '#d97706'];

export default function StaffCard({ staff, onPress }: StaffCardProps) {
  const { colors } = useTheme();
  const initials = staff.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const color = staff.color || ROLE_COLORS[(staff.name.length || 0) % ROLE_COLORS.length];

  return (
    <Card onPress={onPress} noPadding style={staff.status === 'active' ? undefined : { opacity: 0.55 }}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{staff.name}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {[staff.role, staff.specialty].filter(Boolean).join(' · ') || 'Staff member'}
          </Text>
          {staff.years_of_experience ? (
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {staff.years_of_experience}+ years experience
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: staff.status === 'active' ? colors.success : colors.textFaint },
          ]}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
});