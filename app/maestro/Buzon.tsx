import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

export default function Buzon() {
  type Message = { id: string; motivo?: string; content?: string; [key: string]: any };
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const q = query(collection(db, 'citas'), where('profesorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const loadedMessages = querySnapshot.docs.map((doc) => ({
          id: doc.id,
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

  return (
    <>
      <HeaderAuth />
      
      <ScrollView className='h-screen bg-grey/20 p-10'>
        {loading ? (
          <Text className='text-xl text-center text-gray-400'>Cargando mensajes...</Text>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <View key={message.id} className='mb-5 p-4 bg-white rounded-lg shadow-lg'>
              <Text className='text-lg '>{message.motivo}</Text>
              <Text className='text-md text-gray/20'>Tutor: {message.tutorId}</Text>
              <Text className='text-md text-gray/20'>Alumno: {message.nombreAlumno}</Text>
              <Text className='text-md text-gray/20'>Grado: {message.grado}</Text>
              <Text className='text-md text-gray/20'>{message.hora}</Text>
              <Text className='text-md text-gray/20'>
                {new Date(message.fecha.seconds * 1000 + message.fecha.nanoseconds / 1e6).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text className='text-xl text-center text-gray-400'>No hay mensajes</Text>
        )}
      </ScrollView>
    </>
  );
}