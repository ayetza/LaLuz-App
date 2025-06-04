// app/admin/CitasAnterioresDirectora.tsx
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
  danger: '#EF4444',
};

export default function CitasAnterioresDirectora() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retroVisibleId, setRetroVisibleId] = useState<string | null>(null);
  const router = useRouter();

  const cargarCitas = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      // Consulta modificada para directora:
      // 1. Solo citas que requirieron directora
      // 2. Solo citas finalizadas (realizadas/canceladas)
      const snapshot = await db
        .collection('citas')
        .where('requiereDirectora', '==', true)
        .where('estado', 'in', ['realizada', 'cancelada'])
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
  }, []);

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
      <Text style={styles.info}><MaterialIcons name="person" size={16} color={COLORS.primary} /> Profesor: {item.nombreProfesor}</Text>
      <Text style={[styles.estado, item.estado === 'realizada' ? styles.estadoRealizada : styles.estadoCancelada]}>
        Estado: {item.estado}
      </Text>

      <TouchableOpacity 
        onPress={() => setRetroVisibleId(prev => prev === item.id ? null : item.id)} 
        style={styles.retroButton}
      >
        <MaterialIcons name="comment" size={16} color={COLORS.primary} />
        <Text style={styles.retroText}>Ver retroalimentación</Text>
      </TouchableOpacity>

      {retroVisibleId === item.id && item.retroalimentacion && (
        <View style={styles.retroBox}>
          <Text style={styles.retroLabel}>Comentario:</Text>
          <Text style={styles.retroContent}>{item.retroalimentacion}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Citas con Directora</Text>
        <Text style={styles.subtitle}>Historial de citas que requirieron directora</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : citas.length === 0 ? (
        <Text style={styles.emptyText}>No hay citas anteriores que requirieran directora.</Text>
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
        onPress={() => router.push('/admin/AdminHome')} // Ruta modificada
      >
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Volver al Menú Principal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.lightText,
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
    borderTopColor: COLORS.primary,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  info: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  estado: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  estadoRealizada: {
    color: COLORS.success,
  },
  estadoCancelada: {
    color: COLORS.danger,
  },
  retroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  retroText: {
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '600',
  },
  retroBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  retroLabel: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  retroContent: {
    color: COLORS.text,
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});