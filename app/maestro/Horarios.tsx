import React, { useEffect, useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

import HeaderAuth from '../../components/HeaderAuth';

import { auth, db } from '../../lib/firebase';


export default function Horarios() {
  useEffect(() => {
    const obtenerDias = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No hay usuario autenticado.');
        return;
      }

      try {
        const horariosRef = db.collection(`users/${user.uid}/horarios`);
        const querySnapshot = await horariosRef.get();

        querySnapshot.forEach((doc) => {
          const dia = doc.id; // e.g., "Lunes"
          const data = doc.data();
          console.log(data.Activo);

          switch(dia){
            case 'Lunes':
              setlunesVal(data.Activo);
              break;
            case 'Martes':
              setmartesVal(data.Activo);
              break;
            case 'Miercoles':
              setmiercolesVal(data.Activo);
              break;
            case 'Jueves':
              setjuevesVal(data.Activo);
              break;
            case 'Viernes':
              setviernesVal(data.Activo);
              break;
            default:
              console.warn(`Día no reconocido: ${dia}`);
          }
          
        });
      } catch (error) {
        console.error('Error al leer los días:', error);
      }
    };

    obtenerDias();
  }, []);


  const guardarDias = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No hay usuario autenticado.');
      return;
    }

    try {
      const dias = [
        { nombre: 'Lunes', activo: lunesVal },
        { nombre: 'Martes', activo: martesVal },
        { nombre: 'Miercoles', activo: miercolesVal },
        { nombre: 'Jueves', activo: juevesVal },
        { nombre: 'Viernes', activo: viernesVal },
      ];

      const batch = db.batch(); // Optional: batch for performance

      dias.forEach(({ nombre, activo }) => {
        const diaRef = db.doc(`users/${user.uid}/horarios/${nombre}`);
        batch.set(diaRef, { Activo: activo }, { merge: true }); // merge keeps other fields
      });

      await batch.commit();
      console.log('Días guardados exitosamente.');
    } catch (error) {
      console.error('Error al guardar los días:', error);
    }
  };


  const [lunesVal, setlunesVal] = useState(false);
  const lunesSwitch = () => setlunesVal(previousState => !previousState);
  
  const [martesVal, setmartesVal] = useState(false);
  const martesSwitch = () => setmartesVal(previousState => !previousState);

  const [miercolesVal, setmiercolesVal] = useState(false);
  const miercolesSwitch = () => setmiercolesVal(previousState => !previousState);

  const [juevesVal, setjuevesVal] = useState(false);
  const juevesSwitch = () => setjuevesVal(previousState => !previousState);

  const [viernesVal, setviernesVal] = useState(false);
  const viernesSwitch = () => setviernesVal(previousState => !previousState);

  const days = [
    { day: 'Lunes', value: lunesVal, toggle: lunesSwitch },
    { day: 'Martes', value: martesVal, toggle: martesSwitch },
    { day: 'Miércoles', value: miercolesVal, toggle: miercolesSwitch },
    { day: 'Jueves', value: juevesVal, toggle: juevesSwitch },
    { day: 'Viernes', value: viernesVal, toggle: viernesSwitch },
  ];


  return(
    <>
      <HeaderAuth />

      <View className='p-10 flex flex-col items-center justify-between h-4/5'>
        <Text className='text-4xl'>Horarios</Text>

        <View className='flex-row items-center justify-between w-2/3 mt-10'>
          <Text className='text-2xl'>Dia</Text>
          <Text className='text-2xl'>Activo</Text>
        </View>
        
        <View className='w-2/3 pb-20'>
          {days.map((day, index) => (
            <View key={index} className="flex-row items-center justify-between mt-5">
              <Text className='text-2xl'>{day.day}</Text>
              <Switch
                trackColor={{ false: '#A6A6A6', true: '#3A557C' }}
                thumbColor={day.value ? '#f4f3f4' : '#f4f3f4'}
                onValueChange={day.toggle}
                value={day.value}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
        className='bg-blue p-5 rounded-lg'
        onPress={guardarDias}
        >
          <Text className='my-2 mx-10 text-white text-2xl'>Guardar Horarios</Text>
        </TouchableOpacity>

      </View>
    </>
  )
}