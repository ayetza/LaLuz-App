// app/tutor/CitasAnteriores.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightText: '#666666',
  border: '#E0E0E0',
  buttonBg: '#F5F7FA',
};

export default function CitasAnteriores() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarCitasPasadas = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snapshot = await db
        .collection('citas')
        .where('tutorId', '==', user.uid)
        .where('estado', 'in', ['realizada', 'cancelada'])
        .get();

      const citasData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let profesorNombre = 'Desconocido';

          if (data.profesorId) {
            try {
              const profSnap = await db.collection('users').doc(data.profesorId).get();
              if (profSnap.exists) {
                profesorNombre = profSnap.data()?.nombreCompleto || 'Sin nombre';
              }
            } catch (err) {
              console.warn('No se pudo cargar el profesor:', err);
            }
          }

          return {
            id: doc.id,
            ...data,
            profesorNombre,
          };
        })
      );

      setCitas(citasData);
    } catch (error) {
      console.error('Error al cargar citas anteriores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitasPasadas();
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
      <Text style={styles.info}><MaterialIcons name="person" size={16} color={COLORS.primary} /> Prof. {item.profesorNombre || 'Desconocido'}</Text>
      <Text style={styles.info}><MaterialIcons name="calendar-today" size={16} color={COLORS.primary} /> {formatDate(item.fecha)}</Text>
      <Text style={styles.info}><MaterialIcons name="access-time" size={16} color={COLORS.primary} /> {item.hora}</Text>
      
      <Text
        style={[
          styles.estado,
          item.estado === 'realizada' ? styles.estadoRealizada : styles.estadoCancelada
        ]}
      >
        Estado: {item.estado}
      </Text>

      {item.estado === 'realizada' && (
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => router.push({ pathname: '/tutor/Retroalimentacion', params: { citaId: item.id } })}
        >
          <MaterialIcons name="rate-review" size={18} color={COLORS.primary} />
          <Text style={styles.feedbackButtonText}>Dar retroalimentación</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.fullWidthHeader}>
        <HeaderAuth />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Citas Anteriores</Text>
          <Text style={styles.subtitle}>Historial de citas realizadas o canceladas</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : citas.length === 0 ? (
          <Text style={styles.emptyText}>No hay citas anteriores registradas.</Text>
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
          onPress={() => router.push('/tutor/TutorHome')}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fullWidthHeader: {
    width: '100%',
  },
  contentContainer: {
    flex: 1,
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
    color: 'green',
  },
  estadoCancelada: {
    color: 'red',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#EAF4F4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  feedbackButtonText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.buttonBg,
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
