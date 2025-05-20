import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const COLORS = {
  text: '#666666',
  danger: '#E74C3C',
  border: '#f2f2f2',
  icon: '#3A557C',
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escuela La Luz © {year}</Text>

      <View style={styles.infoRow}>
        <Icon name="phone" size={14} color={COLORS.icon} />
        <Text style={styles.infoText}>+52 33 1234 5678</Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="map-pin" size={14} color={COLORS.icon} />
        <Text style={styles.infoText}>Guadalajara, Jalisco, México</Text>
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity onPress={() => Linking.openURL('https://facebook.com')}>
          <Icon name="facebook" size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com')}>
          <Icon name="instagram" size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:contacto@laluz.com')}>
          <Icon name="mail" size={20} color={COLORS.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 20,
    gap: 8,
  },
  title: {
    fontSize: 12,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
});
