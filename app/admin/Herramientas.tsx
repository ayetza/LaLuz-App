import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

interface Usuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
  gradoAsignado: string;
  hijos?: Hijo[];
}

interface Hijo {
  id: string;
  nombre: string;
  grado: string;
}

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

export default function AdminToolsScreen() {
  const [activeTab, setActiveTab] = useState<'maestros' | 'tutores'>('maestros');
  const [maestros, setMaestros] = useState<Usuario[]>([]);
  const [tutores, setTutores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTutorId, setExpandedTutorId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Función para cargar usuarios
  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return router.push('/login');

      const q = query(
        collection(db, 'users'),
        where('estado', '==', 'activo')
      );
      
      const querySnapshot = await getDocs(q);
      const usuariosTemp: Usuario[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        if (docSnap.id !== user.uid) {
          const data = docSnap.data();
          const usuario: Usuario = {
            id: docSnap.id,
            nombreCompleto: data.nombreCompleto,
            correo: data.correo,
            rol: data.rol,
            gradoAsignado: data.gradoAsignado || 'N/A'
          };
          
          if (data.rol === 'tutor') {
            const hijosRef = collection(db, 'users', docSnap.id, 'hijos');
            const hijosSnapshot = await getDocs(hijosRef);
            usuario.hijos = hijosSnapshot.docs.map(hijoDoc => ({
              id: hijoDoc.id,
              nombre: hijoDoc.data().nombre,
              grado: hijoDoc.data().grado
            }));
          }
          
          usuariosTemp.push(usuario);
        }
      }

      const maestrosTemp = usuariosTemp.filter(u => u.rol === 'maestro');
      const tutoresTemp = usuariosTemp.filter(u => u.rol === 'tutor');
      
      setMaestros(maestrosTemp);
      setTutores(tutoresTemp);
    } catch (e) {
      console.error("Error fetching users:", e);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga datos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const fetchData = async () => {
        setLoading(true);
        try {
          await fetchUsuarios();
        } catch (error) {
          console.error("Error fetching users:", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // Efecto para recargar cuando se recibe el parámetro refresh
  useEffect(() => {
    if (params.refresh) {
      fetchUsuarios();
      // Limpiamos el parámetro
      router.setParams({ refresh: undefined });
    }
  }, [params]);

  const toggleTutor = (tutorId: string) => {
    setExpandedTutorId(expandedTutorId === tutorId ? null : tutorId);
  };

  const desactivarUsuario = async (id: string) => {
    setDeletingId(id);
    try {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro que deseas eliminar este usuario?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setDeletingId(null)
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const userRef = doc(db, 'users', id);
              await updateDoc(userRef, { estado: 'inactivo' });
              
              // Actualización local inmediata
              if (activeTab === 'maestros') {
                setMaestros(prev => prev.filter(user => user.id !== id));
              } else {
                setTutores(prev => prev.filter(user => user.id !== id));
                if (expandedTutorId === id) setExpandedTutorId(null);
              }
              
              // Forzar recarga de datos para consistencia
              await fetchUsuarios();
              
              setDeletingId(null);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      Alert.alert('Error', 'No se pudo eliminar el usuario');
      setDeletingId(null);
    }
  };

  const handleEditUser = (id: string) => {
    router.push(`/admin/EditarUsuario?id=${id}`);
  };

  const handleAddUser = () => {
    router.push('/admin/AgregarUsuario');
  };

  const renderMaestro = ({ item }: { item: Usuario }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nombre}>{item.nombreCompleto}</Text>
        <View style={[styles.gradoBadge, {backgroundColor: COLORS.primary}]}>
          <Text style={styles.gradoText}>{item.gradoAsignado}</Text>
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <MaterialIcons name="email" size={16} color={COLORS.primary} />
        <Text style={styles.infoText}>{item.correo}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <MaterialIcons name="person" size={16} color={COLORS.primary} />
        <Text style={styles.infoText}>Rol: Maestro</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleEditUser(item.id)}
        >
          <Text style={styles.buttonText}>Modificar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => desactivarUsuario(item.id)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Eliminar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTutor = ({ item }: { item: Usuario }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.tutorHeader} 
        onPress={() => toggleTutor(item.id)}
      >
        <Text style={styles.nombre}>{item.nombreCompleto}</Text>
        <MaterialIcons 
          name={expandedTutorId === item.id ? "expand-less" : "expand-more"} 
          size={24} 
          color={COLORS.primary} 
        />
      </TouchableOpacity>
      
      <View style={styles.infoRow}>
        <MaterialIcons name="email" size={16} color={COLORS.primary} />
        <Text style={styles.infoText}>{item.correo}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <MaterialIcons name="person" size={16} color={COLORS.primary} />
        <Text style={styles.infoText}>Rol: Tutor</Text>
      </View>
      
      {expandedTutorId === item.id && (
        <View style={styles.hijosContainer}>
          <Text style={styles.hijosTitle}>Hijos:</Text>
          {item.hijos && item.hijos.length > 0 ? (
            item.hijos.map((hijo) => (
              <View key={hijo.id} style={styles.hijoItem}>
                <MaterialIcons name="child-care" size={16} color={COLORS.secondary} />
                <Text style={styles.hijoText}>{hijo.nombre} - {hijo.grado}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noHijosText}>No hay hijos registrados</Text>
          )}
        </View>
      )}
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleEditUser(item.id)}
        >
          <Text style={styles.buttonText}>Modificar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => desactivarUsuario(item.id)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Eliminar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderAuth />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Herramientas de Administrador</Text>
          <Text style={styles.subtitle}>Usuarios Activos del Sistema</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'maestros' && styles.activeTab]}
            onPress={() => setActiveTab('maestros')}
          >
            <MaterialIcons 
              name="school" 
              size={20} 
              color={activeTab === 'maestros' ? '#FFF' : COLORS.primary} 
            />
            <Text style={[styles.tabText, activeTab === 'maestros' && styles.activeTabText]}>
              Maestros
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tutores' && styles.activeTab]}
            onPress={() => setActiveTab('tutores')}
          >
            <MaterialIcons 
              name="family-restroom" 
              size={20} 
              color={activeTab === 'tutores' ? '#FFF' : COLORS.primary} 
            />
            <Text style={[styles.tabText, activeTab === 'tutores' && styles.activeTabText]}>
              Tutores
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
          </View>
        ) : activeTab === 'maestros' ? (
          maestros.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-off" size={48} color={COLORS.lightText} />
              <Text style={styles.emptyText}>No hay maestros activos</Text>
              <Text style={styles.emptySubtext}>Todos los maestros activos aparecerán aquí</Text>
            </View>
          ) : (
            <FlatList
              data={maestros}
              keyExtractor={(item) => item.id}
              renderItem={renderMaestro}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : tutores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-off" size={48} color={COLORS.lightText} />
            <Text style={styles.emptyText}>No hay tutores activos</Text>
            <Text style={styles.emptySubtext}>Todos los tutores activos aparecerán aquí</Text>
          </View>
        ) : (
          <FlatList
            data={tutores}
            keyExtractor={(item) => item.id}
            renderItem={renderTutor}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddUser}
        >
          <Ionicons name="person-add" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/admin/AdminHome')}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Volver al Menú</Text>
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
    marginBottom: 16,
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
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.lightText,
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
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
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tutorHeader: {
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
  },
  gradoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  hijosContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hijosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  hijoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 6,
    marginBottom: 6,
  },
  hijoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  noHijosText: {
    fontSize: 14,
    color: COLORS.lightText,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.info,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
});