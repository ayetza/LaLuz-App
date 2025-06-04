import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
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

export default function Buzon() {
  type Message = { 
    id: string; 
    motivo?: string; 
    estado?: 'pendiente' | 'aceptado' | 'rechazado';
    [key: string]: any 
  };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const q = query(
          collection(db, 'citas'), 
          where('profesorId', '==', currentUser.uid),
          where('estado', 'in', ['pendiente', 'aceptado', 'rechazado'])
        );
        
        const querySnapshot = await getDocs(q);
        const loadedMessages = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          estado: 'pendiente',
          ...doc.data(),
        }));

        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const actualizarEstado = async (id: string, nuevoEstado: 'aceptado' | 'rechazado') => {
    setUpdating(id);
    try {
      const docRef = doc(db, 'citas', id);
      await updateDoc(docRef, { estado: nuevoEstado });
      
      setMessages(prev => prev.map(msg => 
        msg.id === id ? {...msg, estado: nuevoEstado} : msg
      ));
    } catch (error) {
      console.error('Error actualizando estado:', error);
    } finally {
      setUpdating(null);
    }
  };

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
    <View className="flex-1 bg-gray-100">
      <HeaderAuth />
      
      <View className="flex-1 p-4">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-center text-[#3A557C]">Buzón de Citas</Text>
          <Text className="text-sm text-center text-gray-500 mt-1">
            Solicitudes de tutoría pendientes
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className='text-lg mt-4 text-gray-600'>Cargando mensajes...</Text>
          </View>
        ) : messages.length > 0 ? (
          <ScrollView className="flex-1">
            {messages.map((message) => (
              <View 
                key={message.id} 
                className={`mb-4 p-4 rounded-lg border ${
                  message.estado === 'aceptado' ? 'border-green-500 bg-green-50' : 
                  message.estado === 'rechazado' ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                } shadow-sm`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className='text-lg font-semibold text-gray-800'>{message.motivo}</Text>
                  <View className={`px-2 py-1 rounded-full ${
                    message.estado === 'aceptado' ? 'bg-green-500' : 
                    message.estado === 'rechazado' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    <Text className="text-xs text-white font-medium">
                      {message.estado === 'aceptado' ? 'Aceptado' : 
                       message.estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
                
                <View className="border-t border-gray-200 pt-2 mt-2">
                  <Text className='text-sm text-gray-600'><Text className="font-medium">Tutor:</Text> {message.tutorId}</Text>
                  <Text className='text-sm text-gray-600 mt-1'><Text className="font-medium">Alumno:</Text> {message.nombreAlumno}</Text>
                  <Text className='text-sm text-gray-600 mt-1'><Text className="font-medium">Grado:</Text> {message.grado}</Text>
                  <Text className='text-sm text-gray-600 mt-1'><Text className="font-medium">Hora:</Text> {message.hora}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>
                    <Text className="font-medium">Fecha:</Text> {formatDate(message.fecha)}
                  </Text>
                </View>
                
                {message.estado === 'pendiente' && (
                  <View className="flex-row justify-end space-x-3 mt-4">
                    <TouchableOpacity 
                      className="px-4 py-2 bg-red-500 rounded-lg disabled:opacity-50 flex-row items-center"
                      disabled={updating === message.id}
                      onPress={() => actualizarEstado(message.id, 'rechazado')}
                    >
                      {updating === message.id ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Ionicons name="close" size={16} color="white" />
                          <Text className="text-white font-medium ml-1">Rechazar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="px-4 py-2 bg-green-600 rounded-lg disabled:opacity-50 flex-row items-center"
                      disabled={updating === message.id}
                      onPress={() => actualizarEstado(message.id, 'aceptado')}
                    >
                      {updating === message.id ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color="white" />
                          <Text className="text-white font-medium ml-1">Aceptar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center py-10">
            <Text className='text-lg text-gray-500'>No hay mensajes pendientes</Text>
          </View>
        )}

       
       <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/maestro/MaestroHome')}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
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