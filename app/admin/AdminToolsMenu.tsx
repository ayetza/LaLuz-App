import Footer from '@/components/Footer';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderAuth from '../../components/HeaderAuth';

const { width } = Dimensions.get('window');

export default function AdminCitas() {
  const router = useRouter();

  return(
    <View style={styles.container}>
      <HeaderAuth />
      
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Panel de Administración</Text>
          <Text style={styles.subtitle}>Herramientas de gestión rápida</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {/* Botón para Agendar Cita */}
          <TouchableOpacity
            style={[styles.menuButton, styles.agendarButton]}
            onPress={() => router.push('/admin/AgendarCita')}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.iconContainer, {backgroundColor: '#F0E6FA'}]}>
                <MaterialIcons name="event-available" size={24} color="#7C3A5C" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.buttonText}>Agendar Cita</Text>
                <Text style={styles.buttonDescription}>Programa una reunión entre usuarios</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {/* Botón para Contactar Usuario */}
          <TouchableOpacity
            style={[styles.menuButton, styles.contactarButton]}
            onPress={() => router.push('/admin/ContactarUsuario')}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.iconContainer, {backgroundColor: '#E6F0FA'}]}>
                <MaterialIcons name="contact-mail" size={24} color="#3A557C" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.buttonText}>Contactar Usuario</Text>
                <Text style={styles.buttonDescription}>Comunícate con estudiantes o profesores</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/admin/AdminHome')}
        >
          <Ionicons name="arrow-back" size={20} color="#3A557C" />
          <Text style={styles.backButtonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </View>
      
      <Footer />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#3A557C',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '80%',
  },
  menuContainer: {
    marginBottom: 16,
  },
  menuButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  agendarButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3A5C',
  },
  contactarButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#3A557C',
  },
  footerActions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  backButtonText: {
    color: '#3A557C',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});