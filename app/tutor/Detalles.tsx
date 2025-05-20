// app/tutor/Detalles.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#3A557C',
  background: '#FFFFFF',
  text: '#1A1A1A',
  light: '#F3F4F6',
  border: '#E5E7EB',
  success: '#10B981',
};

export default function Detalles() {
  const router = useRouter();
  const {
    nombreAlumno,
    grado,
    dia,
    hora,
    motivo,
    importancia,
    requiereDirectora,
    profesorNombre,
  } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
      <Text style={styles.title}>¡Cita agendada con éxito!</Text>
      <Text style={styles.subtitle}>Aquí están los detalles de tu cita:</Text>

      <View style={styles.card}>
        <Text style={styles.item}><Text style={styles.label}>Alumno:</Text> {nombreAlumno}</Text>
        <Text style={styles.item}><Text style={styles.label}>Grado:</Text> {grado}</Text>
        <Text style={styles.item}><Text style={styles.label}>Profesor:</Text> {profesorNombre}</Text>
        <Text style={styles.item}><Text style={styles.label}>Día:</Text> {dia}</Text>
        <Text style={styles.item}><Text style={styles.label}>Hora:</Text> {hora}</Text>
        <Text style={styles.item}><Text style={styles.label}>Motivo:</Text> {motivo}</Text>
        <Text style={styles.item}><Text style={styles.label}>Prioridad:</Text> {importancia}</Text>
        <Text style={styles.item}><Text style={styles.label}>¿Con Directora?:</Text> {requiereDirectora === 'true' ? 'Sí' : 'No'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/tutor/TutorHome')}>
        <Ionicons name="home-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Volver al Menú Principal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginVertical: 10,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  item: {
    fontSize: 16,
    marginBottom: 10,
    color: COLORS.text,
  },
  label: {
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
