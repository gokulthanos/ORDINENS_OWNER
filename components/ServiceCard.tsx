import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Service } from '@/types';
import { formatINR } from '@/utils/format';
import Card from './Card';

interface ServiceCardProps {
  service: Service;
  active?: boolean;
  onPress?: () => void;
}

export default function ServiceCard({ service, active = true, onPress }: ServiceCardProps) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} noPadding style={active ? undefined : { opacity: 0.55 }}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{service.name}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {service.duration_minutes ?? service.duration ?? 0} min
          </Text>
          {service.description ? (
            <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
              {service.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.priceWrap}>
          <Text style={[styles.price, { color: colors.brand }]}>
            {formatINR(Number(service.price) || 0)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  desc: {
    fontSize: 12,
    marginTop: 2,
  },
  priceWrap: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
});