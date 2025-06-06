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
  tutorId?: string; // Para identificar al padre/tutor
}

interface Usuario {
  id: string;
  nombre: string;
  rol: string;
}

export default function AgendarCita() {
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Obtener el rol del usuario actual
          const userDoc = await db.doc(`users/${user.uid}`).get();
          const userData = userDoc.data();
          if (userData) {
            setCurrentUserRole(userData.rol || 'tutor');
            
            // Si es administrador, cargar todos los usuarios relevantes
            if (userData.rol === 'admin') {
              const usersSnapshot = await db.collection('users')
                .where('rol', 'in', ['tutor', 'maestro'])
                .get();
              
              const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                nombre: doc.data().nombre,
                rol: doc.data().rol
              }));
              
              setUsuarios(usersData);
            }
          }

          // Cargar hijos (para tutores o admin)
          const hijosRef = db.collection(`users/${user.uid}/hijos`);
          const snapshot = await hijosRef.get();

          const hijosData: Hijo[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
            grado: doc.data().grado,
            tutorId: user.uid
          }));

          setHijos(hijosData);
        } catch (error) {
          console.error('Error al obtener datos:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleHacerCita = (hijo: Hijo) => {
    router.push({
      pathname: '/tutor/FormularioCita',
      params: { 
        hijoId: hijo.id,
        tutorId: hijo.tutorId || auth.currentUser?.uid 
      },
    });
  };

  const handleHacerCitaUsuario = (usuario: Usuario) => {
    router.push({
      pathname: '/tutor/FormularioCita',
      params: { 
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
        usuarioRol: usuario.rol 
      },
    });
  };

  const handleHacerCitaPersonal = () => {
    const user = auth.currentUser;
    if (user) {
      router.push({
        pathname: '/tutor/FormularioCita',
        params: { 
          usuarioId: user.uid,
          usuarioNombre: 'Mi cita',
          usuarioRol: 'admin' 
        },
      });
    }
  };

  const handleVolverMenu = () => {
    router.push(currentUserRole === 'admin' ? '/admin/AdminToolsMenu' : '/tutor/TutorHome');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HeaderAuth />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {currentUserRole === 'admin' ? 'Agendar cita para:' : 'Seleccione un estudiante'}
            </Text>
            <Text style={styles.subtitle}>
              {currentUserRole === 'admin' ? 'Seleccione una opción' : 'Para agendar una cita'}
            </Text>
          </View>

          {currentUserRole === 'admin' && (
            <>
              {/* Opción para agendar cita personal (para el admin mismo) */}
              <View style={styles.card}>
                <Text style={styles.nombre}>Agendar cita para mí</Text>
                <Text style={styles.grado}>Como director/a</Text>
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleHacerCitaPersonal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.buttonText}>Agendar Cita</Text>
                </TouchableOpacity>
              </View>

              {/* Sección de padres/tutores */}
              <Text style={styles.sectionTitle}>Padres/Tutores</Text>
              {usuarios.filter(u => u.rol === 'tutor').map((usuario) => (
                <View key={usuario.id} style={styles.card}>
                  <Text style={styles.nombre}>{usuario.nombre}</Text>
                  <Text style={styles.grado}>Padre/Tutor</Text>
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => handleHacerCitaUsuario(usuario)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonText}>Agendar Cita</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Sección de maestros */}
              <Text style={styles.sectionTitle}>Maestros</Text>
              {usuarios.filter(u => u.rol === 'maestro').map((usuario) => (
                <View key={usuario.id} style={styles.card}>
                  <Text style={styles.nombre}>{usuario.nombre}</Text>
                  <Text style={styles.grado}>Maestro</Text>
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => handleHacerCitaUsuario(usuario)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonText}>Agendar Cita</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Sección de hijos (para tutores o admin si tiene hijos registrados) */}
          {(hijos.length > 0 && currentUserRole !== 'admin') && (
            <>
              <Text style={styles.sectionTitle}>Estudiantes</Text>
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
            </>
          )}

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 10,
    marginTop: 20,
  },
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