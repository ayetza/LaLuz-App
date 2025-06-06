import Footer from '@/components/Footer';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

const { width } = Dimensions.get('window');

export default function Citas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [citasPendientes, setCitasPendientes] = useState(0);
  const [citasRealizadas, setCitasRealizadas] = useState(0);

  const cargarCitas = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setLoading(true);
      
      // Obtener citas pendientes
      const snapshotPendientes = await db.collection('citas')
        .where('profesorId', '==', user.uid)
        .where('estado', '==', 'pendiente')
        .get();

      // Obtener citas realizadas
      const snapshotRealizadas = await db.collection('citas')
        .where('profesorId', '==', user.uid)
        .where('estado', '==', 'realizada')
        .get();

      setCitasPendientes(snapshotPendientes.size);
      setCitasRealizadas(snapshotRealizadas.size);
      
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  return(
    <View style={styles.container}>
      <HeaderAuth />
      
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Gestión de Citas</Text>
          <Text style={styles.subtitle}>Administra tus reuniones con los tutores</Text>
        </View>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.agendadasButton]}
            onPress={() => router.push('/maestro/CitasAgendadas')}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.iconContainer, {backgroundColor: '#E6F0FA'}]}>
                <Ionicons name="list" size={24} color="#3A557C" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.buttonText}>Ver Todas las Citas</Text>
                <Text style={styles.buttonDescription}>Revisa tu historial completo de citas</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3A557C" />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/maestro/CitasAgendadas?estado=pendiente')}
            >
              <MaterialIcons name="pending-actions" size={24} color="#3A557C" />
              <Text style={styles.statNumber}>{citasPendientes}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/maestro/CitasAgendadas?estado=realizada')}
            >
              <MaterialIcons name="check-circle" size={24} color="#4C9C82" />
              <Text style={[styles.statNumber, {color: '#4C9C82'}]}>{citasRealizadas}</Text>
              <Text style={styles.statLabel}>Realizadas</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.menuButton, styles.horariosButton]}
          onPress={() => router.push('/maestro/Horarios')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <View style={[styles.iconContainer, {backgroundColor: '#E6F6EF'}]}>
              <Ionicons name="time" size={24} color="#4C9C82" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.buttonText}>Configurar Horarios</Text>
              <Text style={styles.buttonDescription}>Gestiona tu disponibilidad para citas</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/maestro/MaestroHome')}
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
    paddingTop: 60, // Aumentado para más espacio debajo del header
  },
  headerContainer: {
    marginBottom: 30, // Aumentado para más espacio después del título
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
  agendadasButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#3A557C',
  },
  horariosButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#4C9C82',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: width / 2 - 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3A557C',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
});