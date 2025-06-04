import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderAuth from '../../components/HeaderAuth';
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

type Message = { 
  id: string; 
  motivo?: string; 
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'realizada' | 'cancelada';
  [key: string]: any;
};

export default function Buzon() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const q = query(
          collection(db, 'citas'), 
          where('tutorId', '==', currentUser.uid),
          where('estado', 'in', ['pendiente', 'aceptado', 'rechazado', 'realizada', 'cancelada'])
        );
        
        const querySnapshot = await getDocs(q);
        const loadedMessages = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            estado: data.estado || 'pendiente'
          };
        });

        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const formatDate = (fecha: any) => {
    if (!fecha || !fecha.seconds) return 'Fecha inválida';
    return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1e6).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <HeaderAuth />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Buzón de Citas</Text>
          <Text style={styles.subtitle}>
            Historial de solicitudes de tutoría
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando mensajes...</Text>
          </View>
        ) : messages.length > 0 ? (
          <ScrollView 
            style={styles.messagesContainer}
            contentContainerStyle={styles.scrollContent}
          >
            {messages.map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.messageCard,
                  message.estado === 'aceptado' && styles.acceptedCard,
                  message.estado === 'rechazado' && styles.rejectedCard,
                  message.estado === 'realizada' && styles.completedCard,
                  message.estado === 'cancelada' && styles.canceledCard
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.messageTitle}>{message.motivo}</Text>
                  <View style={[
                    styles.statusBadge,
                    message.estado === 'aceptado' && styles.acceptedBadge,
                    message.estado === 'rechazado' && styles.rejectedBadge,
                    message.estado === 'pendiente' && styles.pendingBadge,
                    message.estado === 'realizada' && styles.completedBadge,
                    message.estado === 'cancelada' && styles.canceledBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {message.estado === 'aceptado' ? 'Aceptado' : 
                       message.estado === 'rechazado' ? 'Rechazado' : 
                       message.estado === 'pendiente' ? 'Pendiente' :
                       message.estado === 'realizada' ? 'Realizada' : 'Cancelada'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.messageDetails}>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Profesor:</Text> {message.profesorId}</Text>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Alumno:</Text> {message.nombreAlumno}</Text>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Grado:</Text> {message.grado}</Text>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Hora:</Text> {message.hora}</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Fecha:</Text> {formatDate(message.fecha)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay mensajes pendientes</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/tutor/TutorHome')}
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
    backgroundColor: '#F5F7FA',
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
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.lightText,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.lightText,
  },
  messagesContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  messageCard: {
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
  acceptedCard: {
    borderTopColor: COLORS.success,
  },
  rejectedCard: {
    borderTopColor: COLORS.danger,
  },
  completedCard: {
    borderTopColor: '#8B5CF6',
  },
  canceledCard: {
    borderTopColor: '#6B7280',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
  },
  acceptedBadge: {
    backgroundColor: COLORS.success,
  },
  rejectedBadge: {
    backgroundColor: COLORS.danger,
  },
  completedBadge: {
    backgroundColor: '#8B5CF6',
  },
  canceledBadge: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  messageDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  detailLabel: {
    fontWeight: '600',
    color: COLORS.text,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});