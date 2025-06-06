import { Ionicons, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
import { db } from '../../lib/firebase';

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

interface Hijo {
  id: string;
  nombre: string;
  grado: string;
}

interface Usuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
  gradoAsignado: string;
  hijos?: Hijo[];
}

export default function EditarUsuario() {
  const { id } = useLocalSearchParams();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [gradoAsignado, setGradoAsignado] = useState('');
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [nuevoHijo, setNuevoHijo] = useState({ nombre: '', grado: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingHijoId, setEditingHijoId] = useState<string | null>(null);
  const router = useRouter();

  // Convertir id a string segura
  const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!userId) {
        Alert.alert('Error', 'ID de usuario no válido');
        router.back();
        return;
      }
      
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const usuarioData: Usuario = {
            id: docSnap.id,
            nombreCompleto: data.nombreCompleto,
            correo: data.correo,
            rol: data.rol,
            gradoAsignado: data.gradoAsignado || '',
          };
          
          // Cargar hijos solo para tutores
          if (data.rol === 'tutor') {
            const hijosRef = collection(db, 'users', docSnap.id, 'hijos');
            const hijosSnapshot = await getDocs(hijosRef);
            const hijosData = hijosSnapshot.docs.map(hijoDoc => ({
              id: hijoDoc.id,
              nombre: hijoDoc.data().nombre,
              grado: hijoDoc.data().grado
            }));
            setHijos(hijosData);
          }
          
          setUsuario(usuarioData);
          setNombreCompleto(data.nombreCompleto);
          setGradoAsignado(data.gradoAsignado || '');
        } else {
          Alert.alert('Error', 'El usuario no existe');
          router.back();
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert('Error', 'No se pudo cargar el usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [userId]);

  const agregarHijo = () => {
    if (!nuevoHijo.nombre.trim() || !nuevoHijo.grado.trim()) {
      Alert.alert('Error', 'Nombre y grado son obligatorios');
      return;
    }
    
    setHijos([...hijos, { 
      id: `nuevo-${Date.now()}`, 
      nombre: nuevoHijo.nombre, 
      grado: nuevoHijo.grado 
    }]);
    
    setNuevoHijo({ nombre: '', grado: '' });
  };

  const actualizarHijo = (id: string, campo: keyof Hijo, valor: string) => {
    setHijos(hijos.map(hijo => 
      hijo.id === id ? { ...hijo, [campo]: valor } : hijo
    ));
  };

  const eliminarHijo = async (id: string) => {
    // Si es un hijo existente (no nuevo), eliminarlo de Firestore
    if (!id.startsWith('nuevo-')) {
      try {
        const hijoRef = doc(db, 'users', userId, 'hijos', id);
        await deleteDoc(hijoRef);
      } catch (error) {
        console.error("Error eliminando hijo:", error);
        Alert.alert('Error', 'No se pudo eliminar el hijo');
      }
    }
    
    // Eliminar del estado local
    setHijos(hijos.filter(hijo => hijo.id !== id));
  };

  const handleGuardar = async () => {
    if (!nombreCompleto.trim()) {
      Alert.alert('Error', 'El nombre completo es obligatorio');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'ID de usuario no válido');
      return;
    }

    setSaving(true);
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        nombreCompleto: nombreCompleto.trim(),
        gradoAsignado: gradoAsignado.trim()
      });
      
      // Si es tutor, guardar/actualizar hijos
      if (usuario?.rol === 'tutor') {
        const batch = writeBatch(db);
        const hijosRef = collection(db, 'users', userId, 'hijos');
        
        // Primero eliminar todos los hijos existentes
        const hijosSnapshot = await getDocs(hijosRef);
        hijosSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        // Luego agregar todos los hijos actuales
        hijos.forEach(hijo => {
          if (!hijo.id.startsWith('nuevo-')) {
            const hijoRef = doc(hijosRef, hijo.id);
            batch.set(hijoRef, {
              nombre: hijo.nombre,
              grado: hijo.grado
            });
          } else {
            const nuevoHijoRef = doc(hijosRef);
            batch.set(nuevoHijoRef, {
              nombre: hijo.nombre,
              grado: hijo.grado
            });
          }
        });
        
        await batch.commit();
      }
      
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      router.back();
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderAuth />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando usuario...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <HeaderAuth />
      <View style={styles.content}>
        <Text style={styles.title}>Editar Usuario</Text>
        
        {usuario ? (
          <View style={styles.card}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              
              <View style={styles.infoRow}>
                <MaterialIcons name="person" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Nombre completo:</Text>
                <TextInput
                  style={styles.input}
                  value={nombreCompleto}
                  onChangeText={setNombreCompleto}
                  placeholder="Nombre completo"
                />
              </View>
              
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Correo:</Text>
                <Text style={styles.readOnlyField}>{usuario.correo}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialIcons name="badge" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Rol:</Text>
                <Text style={styles.readOnlyField}>
                  {usuario.rol === 'maestro' ? 'Maestro' : 'Tutor'}
                </Text>
              </View>
            </View>
            
            {usuario.rol === 'maestro' ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información de Maestro</Text>
                
                <View style={styles.infoRow}>
                  <MaterialIcons name="class" size={20} color={COLORS.primary} />
                  <Text style={styles.infoLabel}>Grado asignado:</Text>
                  <TextInput
                    style={styles.input}
                    value={gradoAsignado}
                    onChangeText={setGradoAsignado}
                    placeholder="Ej: 1ro Básico"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información de Tutor</Text>
                
                <View style={styles.infoRow}>
                  <MaterialIcons name="family-restroom" size={20} color={COLORS.primary} />
                  <Text style={styles.infoLabel}>Hijos registrados:</Text>
                  <Text style={styles.readOnlyField}>{hijos.length}</Text>
                </View>
                
                <View style={styles.hijosContainer}>
                  <Text style={styles.hijosTitle}>Hijos:</Text>
                  
                  {hijos.map((hijo) => (
                    <View key={hijo.id} style={styles.hijoItem}>
                      <TextInput
                        style={[styles.hijoInput, styles.hijoNombreInput]}
                        value={hijo.nombre}
                        onChangeText={(text) => actualizarHijo(hijo.id, 'nombre', text)}
                        placeholder="Nombre del hijo"
                      />
                      <TextInput
                        style={[styles.hijoInput, styles.hijoGradoInput]}
                        value={hijo.grado}
                        onChangeText={(text) => actualizarHijo(hijo.id, 'grado', text)}
                        placeholder="Grado"
                      />
                      <TouchableOpacity
                        style={styles.deleteHijoButton}
                        onPress={() => eliminarHijo(hijo.id)}
                      >
                        <AntDesign name="delete" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <View style={styles.nuevoHijoContainer}>
                    <Text style={styles.subtitle}>Agregar nuevo hijo:</Text>
                    
                    <View style={styles.nuevoHijoInputs}>
                      <TextInput
                        style={[styles.hijoInput, styles.hijoNombreInput]}
                        value={nuevoHijo.nombre}
                        onChangeText={(text) => setNuevoHijo({...nuevoHijo, nombre: text})}
                        placeholder="Nombre"
                      />
                      <TextInput
                        style={[styles.hijoInput, styles.hijoGradoInput]}
                        value={nuevoHijo.grado}
                        onChangeText={(text) => setNuevoHijo({...nuevoHijo, grado: text})}
                        placeholder="Grado"
                      />
                    </View>
                    
                    <TouchableOpacity
                      style={styles.addHijoButton}
                      onPress={agregarHijo}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                      <Text style={styles.addHijoButtonText}>Agregar Hijo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => router.back()}
                disabled={saving}
              >
                <Ionicons name="arrow-back" size={18} color="#FFF" />
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleGuardar}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <FontAwesome name="save" size={18} color="#FFF" />
                    <Text style={styles.buttonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error" size={48} color={COLORS.danger} />
            <Text style={styles.emptyText}>No se encontró el usuario</Text>
          </View>
        )}
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  section: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 10,
    width: 150,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  readOnlyField: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.lightText,
  },
  hijosContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#F9FBFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6F0FF',
  },
  hijosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 10,
  },
  hijoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hijoInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  hijoNombreInput: {
    flex: 2,
  },
  hijoGradoInput: {
    flex: 1,
  },
  deleteHijoButton: {
    padding: 8,
  },
  nuevoHijoContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  nuevoHijoInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addHijoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
  },
  addHijoButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.lightText,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.lightText,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.danger,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 10,
  },
});