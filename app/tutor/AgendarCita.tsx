//app/tutor/AgendarCita.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

interface Hijo {
  nombre: string;
  grado: string;
  id: string;
}

export default function AgendarCita() {
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchHijos = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const hijosRef = db.collection(`users/${user.uid}/hijos`);
          const snapshot = await hijosRef.get();

          const hijosData: Hijo[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
            grado: doc.data().grado,
          }));

          setHijos(hijosData);
        } catch (error) {
          console.error('Error al obtener hijos:', error);
        }
      }
    };

    fetchHijos();
  }, []);

  const handleHacerCita = (hijo: Hijo) => {
    router.push({
      pathname: '/tutor/FormularioCita',
      params: { hijoId: hijo.id },
    });
  };

  const handleVolverMenu = () => {
    router.push('/tutor/TutorHome');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HeaderAuth />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Seleccione un estudiante</Text>
            <Text style={styles.subtitle}>Para agendar una cita</Text>
          </View>

          {hijos.map((hijo) => (
            <View key={hijo.id} style={styles.card}>
              <Text style={styles.nombre}>{hijo.nombre}</Text>
              <Text style={styles.grado}>{hijo.grado}</Text>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => handleHacerCita(hijo)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>Agendar Cita</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Botón Volver al Menú */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleVolverMenu}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>Volver al Menú</Text>
          </TouchableOpacity>

          <Footer />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const COLORS = {
  primary: '#3A557C',
  background: '#FFFFFF',
  light: '#E5E7EB',
  text: '#1A1A1A',
  secondaryText: '#4B5563',
  border: '#D1D5DB',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 0 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.secondaryText },
  card: { 
    backgroundColor: COLORS.light, 
    padding: 16, 
    borderRadius: 10, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nombre: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  grado: { fontSize: 14, color: COLORS.secondaryText, marginBottom: 10 },
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    padding: 12, 
    borderRadius: 8, 
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
