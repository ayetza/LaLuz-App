// Detalles.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';

const COLORS = {
  primary: '#3A557C',
  background: '#FFFFFF',
  light: '#E5E7EB',
  text: '#1A1A1A',
  secondaryText: '#4B5563',
  border: '#D1D5DB',
  purple: '#8B5CF6',
  gray: '#E5E7EB',
  success: '#10B981',
};

export default function Detalles() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const {
    nombreAlumno = 'Alumno',
    grado = 'Grado no especificado',
    motivo = 'Mensaje no especificado',
    tutorNombre = 'Tutor'
  } = params;

  const handleVolver = () => {
    router.push('/maestro/ContactarTutor');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HeaderAuth />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
            <Text style={styles.successTitle}>¡Mensaje enviado con éxito!</Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailTitle}>Detalles del mensaje</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Alumno:</Text>
              <Text style={styles.detailValue}>{nombreAlumno}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Grado:</Text>
              <Text style={styles.detailValue}>{grado}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tutor:</Text>
              <Text style={styles.detailValue}>{tutorNombre}</Text>
            </View>
            
            <View style={styles.messageContainer}>
              <Text style={styles.detailLabel}>Mensaje enviado:</Text>
              <Text style={styles.messageText}>{motivo}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleVolver}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>Volver a Contactar Tutores</Text>
          </TouchableOpacity>

          <Footer />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: { 
    flex: 1 
  },
  content: { 
    padding: 20 
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: 15,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.secondaryText,
    flexShrink: 1,
    marginLeft: 10,
    textAlign: 'right',
  },
  messageContainer: {
    marginTop: 20,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.secondaryText,
    marginTop: 10,
    padding: 15,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.gray,
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});