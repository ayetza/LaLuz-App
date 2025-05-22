import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import HeaderAuth from '../../components/HeaderAuth';


interface User {
  idUnico: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
}

//useEffect(() => {
//  const unsubscribe = onSnapshot(collection(db, 'Users'), (snapshot) => {
//    const data = snapshot.docs.map(doc => {
//      const userData = doc.data();
//      return {
//        idUnico: doc.id,
//        nombreCompleto: userData.nombreCompleclassName='bg-light-gray-200 rounded-lg'to,
//        correo: userData.correo,
//        rol: userData.rol,
//      } as User;
//    });
//    setUsers(data);
//    console.log('Users:', data);
//  });
//  
//
//  // 🔥 Added cleanup to avoid memory leaks
//  return () => unsubscribe(); 
//}, []); // Added empty dependency array to run only once
export default function Herramientas() {
  const dummyUsers: User[] = [
  {
    idUnico: 'usr-67890-user',
    nombreCompleto: 'María López',
    correo: 'maria.lopez@ejemplo.com',
    rol: 'tutor'
  },
  {
    idUnico: 'usr-54321-editor',
    nombreCompleto: 'Carlos Ruiz',
    correo: 'carlos.ruiz@ejemplo.com',
    rol: 'maestro'
  }
];

  const [UserType, setUserType] = useState('usuario');
  const [Users, setUsers] = useState<User[]>(dummyUsers);
  const [SelectedUser, setSelectedUser] = useState<User | null>(null);
  
  console.log('Users:', Users)
  console.log('UserType:', UserType)

  return (
    <>
    
      <HeaderAuth />

      <View className='flex-1 p-10 space-y-6 bg-white '>
        <View className='flex items-center'>
          <Text className='text-3xl pb-5'>Seleccion de Usuario</Text>
        </View>

        <View className=''>
          <View className='py-5'>
            <Text className='text-2xl'>Tipo de Usuario</Text>
            <View
              className='bg-grey/50 rounded-2xl h-auto'
            >
              <Picker
                style={{ color: 'black' }}
                selectedValue={UserType}
                onValueChange={(itemValue) => setUserType(itemValue)}
              >
                <Picker.Item label="" value="" />
                <Picker.Item label="Maestro" value="maestro" />
                <Picker.Item label="Tutor" value="tutor" />
              </Picker>
            </View>
          </View>

          <View className='py-5'>
            <Text className='text-2xl'>Usuario</Text>
            <View
              className='bg-grey/50 rounded-2xl h-auto'
            >
              <Picker
                className='bg-light-gray-200 rounded-lg'
                selectedValue={SelectedUser}
                onValueChange={(itemValue) => setSelectedUser(itemValue)}>
                <Picker.Item label="" value="" />
                {Users.filter(user => user.rol == UserType).map((user) => (
                  <Picker.Item key={user.idUnico} label={user.nombreCompleto} value={user.idUnico} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View className='mt-auto mb-8'>
          <TouchableOpacity
            className='flex items-center bg-blue rounded-lg p-4'
            >
            <Text className='text-2xl text-white'>Acceder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}