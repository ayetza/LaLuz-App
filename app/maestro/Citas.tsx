import Footer from '@/components/Footer';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import HeaderAuth from '../../components/HeaderAuth';

export default function Citas() {
  const router = useRouter();
  
  return(
    <>
      <HeaderAuth />

      <View className='flex-1 p-6 justify-between'>
        <Text className='text-3xl text-center mb-8'>Menu de Citas</Text>
        
        <View className='flex-1 justify-between py-32 space-y-8 w-full'>
          <TouchableOpacity
            className='w-full items-center justify-center py-12 px-6 border-4 border-blue rounded-2xl'
            onPress={() => {router.push('/maestro/CitasAgendadas')}}
          >
            <Text className='text-3xl text-center'>Citas Agendadas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className='w-full items-center justify-center py-12 px-6 border-4 border-blue rounded-2xl'
            onPress={() => {router.push('/maestro/Horarios')}}
          >
            <Text className='text-3xl text-center'>Disponibilidad de Horarios</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Footer />
    </>
  )
}