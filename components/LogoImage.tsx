import React from 'react';
import { Image, ImageStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';

const LOGO = require('../assets/logo/logo.png');

interface LogoImageProps {
  size?: number;
  style?: ImageStyle;
}

export default function LogoImage({ size = 96, style }: LogoImageProps) {
  const { colors } = useTheme();
  return (
    <Image
      source={LOGO}
      style={[
        { width: size, height: size, borderRadius: Math.round(size * 0.22), backgroundColor: colors.surface2 },
        styles.logo,
        style,
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
});