// app/maestro/CitasAnteriores.tsx
import Footer from '@/components/Footer';
import HeaderAuth from '@/components/HeaderAuth';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightText: '#666666',
  border: '#E0E0E0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export default function CitasAnterioresMaestro() {
  const [activeTab, setActiveTab] = useState<'realizadas' | 'noRealizadas'>('realizadas');
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retroVisibleId, setRetroVisibleId] = useState<string | null>(null);
  const router = useRouter();

  const cargarCitas = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      setLoading(true);
      let estadoQuery = 'realizada';
      
      if (activeTab === 'noRealizadas') {
        estadoQuery = ['cancelada', 'no realizada'];
      }

      const snapshot = await db
        .collection('citas')
        .where('profesorId', '==', user.uid)
        .where('estado', activeTab === 'realizadas' ? '==' : 'in', estadoQuery)
        .get();

      const citasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitas(citasData);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, [activeTab]);

  const formatDate = (fecha: any) => {
    if (!fecha || typeof fecha.toDate !== 'function') return 'Fecha inválida';
    return fecha.toDate().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.nombre}>{item.nombreAlumno} ({item.grado})</Text>
      <Text style={styles.info}><MaterialIcons name="calendar-today" size={16} color={COLORS.primary} /> {formatDate(item.fecha)}</Text>
      <Text style={styles.info}><MaterialIcons name="access-time" size={16} color={COLORS.primary} /> {item.hora}</Text>
      <Text style={styles.info}><MaterialIcons name="info" size={16} color={COLORS.primary} /> Prioridad: {item.importancia}</Text>
      <Text style={styles.info}><MaterialIcons name="verified-user" size={16} color={COLORS.primary} /> Directora requerida: {item.requiereDirectora ? 'Sí' : 'No'}</Text>
      <Text style={[
        styles.estado, 
        item.estado === 'realizada' ? styles.estadoRealizada : 
        item.estado === 'cancelada' ? styles.estadoCancelada : 
        styles.estadoNoRealizada
      ]}>
        Estado: {item.estado}
      </Text>

      {item.estado === 'realizada' && (
        <>
          <TouchableOpacity 
            onPress={() => setRetroVisibleId(prev => prev === item.id ? null : item.id)} 
            style={styles.retroButton}
          >
            <MaterialIcons name="comment" size={16} color={COLORS.primary} />
            <Text style={styles.retroText}>
              {retroVisibleId === item.id ? 'Ocultar retroalimentación' : 'Ver retroalimentación'}
            </Text>
          </TouchableOpacity>

          {retroVisibleId === item.id && item.retroalimentacion && (
            <View style={styles.retroBox}>
              <Text style={styles.retroLabel}>Comentario:</Text>
              <Text style={styles.retroContent}>{item.retroalimentacion}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderAuth />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Citas Anteriores</Text>
          <Text style={styles.subtitle}>Historial de citas del maestro</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'realizadas' && styles.activeTab]} 
            onPress={() => setActiveTab('realizadas')}
          >
            <Text style={[styles.tabText, activeTab === 'realizadas' && styles.activeTabText]}>Realizadas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'noRealizadas' && styles.activeTab]} 
            onPress={() => setActiveTab('noRealizadas')}
          >
            <Text style={[styles.tabText, activeTab === 'noRealizadas' && styles.activeTabText]}>No Realizadas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : citas.length === 0 ? (
          <Text style={styles.emptyText}>
            {activeTab === 'realizadas' 
              ? 'No hay citas realizadas registradas.' 
              : 'No hay citas no realizadas registradas.'}
          </Text>
        ) : (
          <FlatList
            data={citas}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/maestro/MaestroHome')}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </View>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A557C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#3A557C',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 4,
    borderTopColor: '#3A557C',
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  info: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  estado: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  estadoRealizada: {
    color: '#10B981',
  },
  estadoNoRealizada: {
    color: '#F59E0B',
  },
  estadoCancelada: {
    color: '#EF4444',
  },
  retroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  retroText: {
    color: '#3A557C',
    marginLeft: 6,
    fontWeight: '600',
  },
  retroBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 10,
  },
  retroLabel: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  retroContent: {
    color: '#1A1A1A',
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
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