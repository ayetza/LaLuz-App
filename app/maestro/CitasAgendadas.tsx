// app/tutor/CitasAgendadas.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  secondary: '#8FC027',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightText: '#666666',
  border: '#E0E0E0',
  danger: '#D9534F',
  warning: '#F0AD4E',
  success: '#5CB85C',
  info: '#5BC0DE',
};

type Cita = {
  id: string;
  nombreAlumno: string;
  grado: string;
  horaInicio: string;
  horaFin: string;
  fecha: any;
  motivo: string;
  importancia: string;
  estado: string;
  horarioId: string;
  profesorNombre?: string;
  directoraPresente?: boolean;
  profesorId?: string;
};

export default function CitasAgendadas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarCitas = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    setLoading(true);
    try {
      const snapshot = await db
        .collection('citas')
        .where('tutorId', '==', user.uid)
        .where('estado', '==', 'pendiente')
        .get();
  
      const citasData = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
  
        // Obtener el horario completo
        let horarioData = null;
        if (data.horarioId) {
          const horarioSnap = await db.collection('horarios_disponibles').doc(data.horarioId).get();
          if (horarioSnap.exists) {
            horarioData = horarioSnap.data();
          }
        }
  
        let profesorNombre = 'Desconocido';
        if (data.profesorId) {
          const profSnap = await db.collection('users').doc(data.profesorId).get();
          if (profSnap.exists) {
            const profData = profSnap.data();
            profesorNombre = profData?.nombreCompleto || 'Sin nombre';
          }
        }
  
        return {
          id: doc.id,
          nombreAlumno: data.nombreAlumno,
          grado: data.grado,
          hora: data.hora, 
          horaInicio: horarioData?.horaInicio || data.hora || 'No definida',
          horaFin: horarioData?.horaFin || 'No definida',
          fecha: data.fecha,
          motivo: data.motivo,
          importancia: data.importancia,
          estado: data.estado,
          horarioId: data.horarioId,
          profesorNombre,
          directoraPresente: data.requiereDirectora || false,
          profesorId: data.profesorId
        };
      }));
  
      setCitas(citasData);
    } catch (error) {
      console.error('Error al obtener citas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const sePuedeModificarOCancelar = (fecha: any): boolean => {
    if (!fecha || typeof fecha.toDate !== 'function') return false;
    const ahora = new Date();
    const citaDate = fecha.toDate();
    const diff = citaDate.getTime() - ahora.getTime();
    return diff >= 24 * 60 * 60 * 1000;
  };

  const getImportanciaColor = (importancia: string) => {
    switch(importancia.toLowerCase()) {
      case 'alta': return COLORS.danger;
      case 'media': return COLORS.warning;
      case 'baja': return COLORS.success;
      default: return COLORS.lightText;
    }
  };

  const getImportanciaIcon = (importancia: string) => {
    switch(importancia.toLowerCase()) {
      case 'alta': return 'warning';
      case 'media': return 'error-outline';
      case 'baja': return 'check-circle-outline';
      default: return 'info-outline';
    }
  };

  const formatDate = (fecha: any) => {
    if (!fecha || typeof fecha.toDate !== 'function') return 'Fecha no definida';
    const date = fecha.toDate();
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const cancelarCita = async (id: string, fecha: any) => {
    Alert.alert(
      '¿Cancelar cita?',
      'Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.collection('citas').doc(id).update({ estado: 'cancelada' });
              cargarCitas();
            } catch (error) {
              console.error('Error al cancelar cita:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: Cita }) => {
    const puedeModificarOCancelar = sePuedeModificarOCancelar(item.fecha);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.nombre}>{item.nombreAlumno}</Text>
          <View style={[styles.gradoBadge, {backgroundColor: COLORS.primary}]}>
            <Text style={styles.gradoText}>{item.grado}</Text>
          </View>
        </View>
        
        {/* Seccion de fecha y hora */}
        <View style={styles.timeSection}>
          <View style={styles.dateContainer}>
            <MaterialIcons name="calendar-today" size={16} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(item.fecha)}</Text>
          </View>
          
          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <MaterialIcons name="play-arrow" size={16} color={COLORS.primary} />
              <Text style={styles.timeText}>Inicio: {item.horaInicio}</Text>
            </View>
            
            <View style={styles.timeItem}>
              <MaterialIcons name="stop" size={16} color={COLORS.primary} />
              <Text style={styles.timeText}>Fin: {item.horaFin}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>Prof. {item.profesorNombre}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="subject" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>{item.motivo}</Text>
        </View>
        
        <View style={styles.importanceContainer}>
          <MaterialIcons 
            name={getImportanciaIcon(item.importancia)} 
            size={16} 
            color={getImportanciaColor(item.importancia)} 
          />
          <Text style={[styles.importanceText, {color: getImportanciaColor(item.importancia)}]}>
            Prioridad {item.importancia.toLowerCase()}
          </Text>
        </View>
        
        <View style={[
          styles.directoraContainer,
          item.directoraPresente ? styles.directoraPresente : styles.directoraNoPresente
        ]}>
          <MaterialIcons 
            name={item.directoraPresente ? "verified-user" : "person-off"} 
            size={16} 
            color={item.directoraPresente ? COLORS.success : COLORS.lightText} 
          />
          <Text style={[
            styles.directoraText,
            {color: item.directoraPresente ? COLORS.success : COLORS.lightText}
          ]}>
            {item.directoraPresente ? "Directora estará presente" : "Directora no estará presente"}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {puedeModificarOCancelar ? (
            <>
              <TouchableOpacity
                style={styles.modifyButton}
                onPress={() => router.push(`/tutor/ModificarCita?id=${item.id}`)}
              >
                <MaterialIcons name="edit" size={16} color="#FFF" />
                <Text style={styles.modifyText}> Modificar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => cancelarCita(item.id, item.fecha)}
              >
                <MaterialIcons name="cancel" size={16} color={COLORS.danger} />
                <Text style={styles.cancelText}> Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.timeWarning}>
              <MaterialIcons name="watch-later" size={16} color={COLORS.lightText} />
              <Text style={styles.timeWarningText}>Solo modificable/cancelable con 24h de anticipación</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderAuth />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Citas Pendientes</Text>
          <Text style={styles.subtitle}>Revisa, modifica o cancela tus citas</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando citas...</Text>
          </View>
        ) : citas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-available" size={48} color={COLORS.lightText} />
            <Text style={styles.emptyText}>No hay citas pendientes</Text>
            <Text style={styles.emptySubtext}>Todas tus citas agendadas aparecerán aquí</Text>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => router.push('/maestro/ContactarTutor')}
            >
              <MaterialIcons name="add" size={18} color="#FFF" />
              <Text style={styles.scheduleButtonText}> Contactar Tutor</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: COLORS.background 
  },
  content: { 
    flex: 1, 
    padding: 16 
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  gradoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  gradoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  timeSection: {
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  importanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  importanceText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  directoraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  directoraPresente: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  directoraNoPresente: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
  },
  directoraText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  modifyText: {
    color: '#FFF',
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  cancelText: {
    color: COLORS.danger,
    fontWeight: '500',
  },
  timeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  timeWarningText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.lightText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.lightText,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 8,
    textAlign: 'center',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 6,
    marginTop: 24,
    width: '80%',
  },
  scheduleButtonText: {
    color: '#FFF',
    fontWeight: '500',
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