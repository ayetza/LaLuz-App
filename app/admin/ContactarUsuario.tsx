import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

interface Hijo {
  nombre: string;
  grado: string;
}

interface Usuario {
  id: string;
  nombre: string;
  rol: 'tutor' | 'maestro';
  grado?: string;
  hijos?: Hijo[];
}

interface MensajeAdmin {
  id: string;
  receptorNombre: string;
  receptorRol: string;
  contenido: string;
  fecha: any;
  estado?: string;
}

const COLORS = {
  primary: '#3A557C',
  secondary: '#8FC027',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightText: '#666666',
  border: '#E0E0E0',
  danger: '#D9534F',
  sectionHeader: '#F5F7FA',
};

export default function ContactarUsuariosAdmin() {
  const [activeTab, setActiveTab] = useState<'contactar' | 'historial'>('contactar');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mensajes, setMensajes] = useState<MensajeAdmin[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRol, setSelectedRol] = useState<'tutor' | 'maestro' | null>(null);
  const [selectedGrado, setSelectedGrado] = useState<string | null>(null);
  const [gradosDisponibles, setGradosDisponibles] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return router.push('/login');

        const usuariosSnap = await getDocs(query(
          collection(db, 'users'),
          where('rol', 'in', ['tutor', 'maestro'])
        ));

        const usuariosTemp: Usuario[] = [];
        
        for (const docSnap of usuariosSnap.docs) {
          const userData = docSnap.data();
          const usuario: Usuario = {
            id: docSnap.id,
            nombre: userData.nombreCompleto,
            rol: userData.rol,
            grado: userData.gradoAsignado || ''
          };

          if (userData.rol === 'tutor') {
            const hijosSnap = await getDocs(collection(db, `users/${docSnap.id}/hijos`));
            const hijosInfo: Hijo[] = [];
            
            hijosSnap.forEach(hijoDoc => {
              const hijoData = hijoDoc.data();
              hijosInfo.push({
                nombre: hijoData.nombre || 'Sin nombre',
                grado: hijoData.grado || 'Sin grado'
              });
            });

            if (hijosInfo.length > 0) {
              usuario.hijos = hijosInfo;
            }
          }

          usuariosTemp.push(usuario);
        }

        const mensajesSnap = await getDocs(query(
          collection(db, 'contactos_admin'),
          where('estado', '!=', 'eliminado')
        ));

        const mensajesTemp: MensajeAdmin[] = mensajesSnap.docs.map(doc => ({
          id: doc.id,
          receptorNombre: doc.data().receptorNombre,
          receptorRol: doc.data().receptorRol,
          contenido: doc.data().contenido,
          fecha: doc.data().fecha,
          estado: doc.data().estado || 'enviado'
        }));

        setUsuarios(usuariosTemp);
        setMensajes(mensajesTemp);

        // Extraer grados únicos
        const gradosMaestros = usuariosTemp
          .filter(u => u.rol === 'maestro' && u.grado)
          .map(u => u.grado as string);
        
        const gradosHijos = usuariosTemp
          .filter(u => u.rol === 'tutor' && u.hijos)
          .flatMap(u => u.hijos?.map(h => h.grado) || []);

        const gradosUnicos = [...new Set([...gradosMaestros, ...gradosHijos])].sort();
        setGradosDisponibles(gradosUnicos);
      } catch (e) {
        Alert.alert('Error', 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const registrarMensaje = async (usuario: Usuario) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const adminSnap = await getDoc(doc(db, 'users', user.uid));
      const adminNombre = adminSnap.data()?.nombreCompleto || 'Admin';

      await addDoc(collection(db, 'contactos_admin'), {
        adminId: user.uid,
        adminNombre,
        receptorId: usuario.id,
        receptorNombre: usuario.nombre,
        receptorRol: usuario.rol,
        contenido: mensaje,
        fecha: serverTimestamp(),
        estado: 'enviado'
      });

      setModalVisible(false);
      setMensaje('');
      Alert.alert('Éxito', 'Mensaje enviado correctamente');
      
      // Actualizar historial
      const mensajesSnap = await getDocs(query(
        collection(db, 'contactos_admin'),
        where('estado', '!=', 'eliminado')
      ));
      const mensajesTemp: MensajeAdmin[] = mensajesSnap.docs.map(doc => ({
        id: doc.id,
        receptorNombre: doc.data().receptorNombre,
        receptorRol: doc.data().receptorRol,
        contenido: doc.data().contenido,
        fecha: doc.data().fecha,
        estado: doc.data().estado || 'enviado'
      }));
      setMensajes(mensajesTemp);
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const eliminarMensaje = async (id: string) => {
    try {
      const mensajeRef = doc(db, 'contactos_admin', id);
      await updateDoc(mensajeRef, { estado: 'eliminado' });
      
      setMensajes(prev => prev.filter(m => m.id !== id));
      Alert.alert('Éxito', 'Mensaje eliminado correctamente');
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar el mensaje');
    }
  };

  const formatDate = (fecha: any) => {
    if (!fecha?.toDate) return 'Fecha inválida';
    return fecha.toDate().toLocaleDateString('es-ES', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const usuariosFiltrados = usuarios.filter(u => {
    if (selectedRol && u.rol !== selectedRol) return false;
    if (selectedGrado) {
      if (u.rol === 'maestro' && u.grado !== selectedGrado) return false;
      if (u.rol === 'tutor' && !u.hijos?.some(h => h.grado === selectedGrado)) return false;
    }
    return true;
  });

  const renderMensaje = ({ item }: { item: MensajeAdmin }) => (
    <View style={styles.card}>
      <View style={styles.mensajeHeader}>
        <View style={styles.mensajeHeaderLeft}>
          <Text style={styles.nombre}>{item.receptorNombre}</Text>
          <Text style={[styles.rolBadge, { 
            backgroundColor: item.receptorRol === 'maestro' ? '#4A90E2' : COLORS.secondary 
          }]}>
            {item.receptorRol}
          </Text>
        </View>
        <TouchableOpacity onPress={() => eliminarMensaje(item.id)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      <Text style={styles.contenidoMensaje}>{item.contenido}</Text>
      <Text style={styles.fecha}>{formatDate(item.fecha)}</Text>
    </View>
  );

  const renderUsuario = (usuario: Usuario) => (
    <View key={usuario.id} style={styles.card}>
      <Text style={styles.nombre}>{usuario.nombre}</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.info}>Rol: {usuario.rol}</Text>
        
        {usuario.rol === 'maestro' ? (
          usuario.grado && <Text style={styles.info}>Grado asignado: {usuario.grado}</Text>
        ) : (
          usuario.hijos?.map((hijo, index) => (
            <View key={index} style={styles.hijoInfoContainer}>
              <Text style={styles.info}>Hijo: {hijo.nombre}</Text>
              <Text style={styles.info}>Grado: {hijo.grado}</Text>
            </View>
          ))
        )}
      </View>
      <TouchableOpacity 
        style={styles.modifyButton} 
        onPress={() => { setSelectedUsuario(usuario); setModalVisible(true); }}
      >
        <Text style={styles.modifyText}>Enviar Mensaje</Text>
      </TouchableOpacity>
    </View>
  );

  const resetFiltros = () => {
    setSelectedRol(null);
    setSelectedGrado(null);
  };

  return (
    <View style={styles.container}>
      <HeaderAuth />
      <View style={styles.content}>
        <Text style={styles.title}>Contactar Usuarios</Text>
        <Text style={styles.subtitle}>Administra tus mensajes con maestros y tutores</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'contactar' && styles.activeTab]} 
            onPress={() => setActiveTab('contactar')}
          >
            <Text style={[styles.tabText, activeTab === 'contactar' && styles.activeTabText]}>Enviar Mensajes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'historial' && styles.activeTab]} 
            onPress={() => setActiveTab('historial')}
          >
            <Text style={[styles.tabText, activeTab === 'historial' && styles.activeTabText]}>Historial</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : activeTab === 'contactar' ? (
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.filtrosContainer}>
              <Text style={styles.filtrosTitle}>Filtrar Usuarios</Text>
              
              <Text style={styles.filtrosLabel}>1. Seleccione el rol:</Text>
              <View style={styles.rolesContainer}>
                <TouchableOpacity
                  style={[styles.rolButton, selectedRol === 'maestro' && styles.rolButtonSelected]}
                  onPress={() => setSelectedRol('maestro')}
                >
                  <Text style={[styles.rolButtonText, selectedRol === 'maestro' && styles.rolButtonTextSelected]}>
                    Maestros
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rolButton, selectedRol === 'tutor' && styles.rolButtonSelected]}
                  onPress={() => setSelectedRol('tutor')}
                >
                  <Text style={[styles.rolButtonText, selectedRol === 'tutor' && styles.rolButtonTextSelected]}>
                    Tutores
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedRol && (
                <>
                  <Text style={styles.filtrosLabel}>2. Seleccione el grado:</Text>
                  <View style={styles.gradosContainer}>
                    <TouchableOpacity
                      style={[styles.gradoButton, selectedGrado === null && styles.gradoButtonSelected]}
                      onPress={() => setSelectedGrado(null)}
                    >
                      <Text style={[styles.gradoButtonText, selectedGrado === null && styles.gradoButtonTextSelected]}>
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {gradosDisponibles.map(grado => (
                      <TouchableOpacity
                        key={grado}
                        style={[styles.gradoButton, selectedGrado === grado && styles.gradoButtonSelected]}
                        onPress={() => setSelectedGrado(grado)}
                      >
                        <Text style={[styles.gradoButtonText, selectedGrado === grado && styles.gradoButtonTextSelected]}>
                          {grado}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {(selectedRol || selectedGrado) && (
                <TouchableOpacity style={styles.resetButton} onPress={resetFiltros}>
                  <Text style={styles.resetButtonText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedRol ? (
              <View style={styles.resultadosContainer}>
                <Text style={styles.resultadosTitle}>
                  {selectedRol === 'maestro' ? 'Maestros' : 'Tutores'}
                  {selectedGrado ? ` del grado ${selectedGrado}` : ''}
                </Text>
                
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map(renderUsuario)
                ) : (
                  <Text style={styles.emptyText}>No hay usuarios que coincidan con los filtros</Text>
                )}
              </View>
            ) : (
              <View style={styles.instruccionesContainer}>
                <Ionicons name="filter" size={40} color={COLORS.lightText} style={styles.instruccionesIcon} />
                <Text style={styles.instruccionesText}>
                  Por favor, selecciona un rol para ver los usuarios disponibles
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={mensajes}
            keyExtractor={item => item.id}
            renderItem={renderMensaje}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay mensajes enviados</Text>}
          />
        )}

        {/* Botón modificado para regresar a la página anterior */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mensaje para {selectedUsuario?.nombre}</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUsuario?.rol === 'maestro' ? 'Maestro' : 'Tutor'}
              {selectedUsuario?.rol === 'maestro' && selectedUsuario?.grado ? ` - Grado ${selectedUsuario.grado}` : ''}
            </Text>
            
            {selectedUsuario?.rol === 'tutor' && selectedUsuario?.hijos && (
              <View style={styles.hijosModalContainer}>
                <Text style={styles.hijosTitle}>Hijos:</Text>
                {selectedUsuario.hijos.map((hijo, index) => (
                  <View key={index} style={styles.hijoModalInfo}>
                    <Text style={styles.hijoModalText}>• {hijo.nombre} (Grado: {hijo.grado})</Text>
                  </View>
                ))}
              </View>
            )}

            <TextInput
              style={styles.messageInput}
              multiline
              placeholder="Escribe tu mensaje aquí..."
              value={mensaje}
              onChangeText={setMensaje}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={() => { setMensaje(''); setModalVisible(false); }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.modifyButton, !mensaje.trim() && styles.disabledButton]} 
                onPress={() => selectedUsuario && registrarMensaje(selectedUsuario)} 
                disabled={!mensaje.trim()}
              >
                <Text style={styles.modifyText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: COLORS.primary, 
    textAlign: 'center',
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 14, 
    color: COLORS.lightText, 
    textAlign: 'center', 
    marginBottom: 16 
  },
  tabsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#F5F7FA', 
    borderRadius: 8, 
    marginBottom: 16,
    overflow: 'hidden'
  },
  tabButton: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center', 
  },
  activeTab: { 
    backgroundColor: COLORS.primary 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.lightText 
  },
  activeTabText: { 
    color: '#FFFFFF' 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: COLORS.primary, 
    elevation: 2 
  },
  nombre: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.text,
    marginBottom: 4
  },
  infoContainer: {
    marginBottom: 8
  },
  info: { 
    fontSize: 14, 
    color: COLORS.lightText 
  },
  fecha: { 
    fontSize: 12, 
    color: COLORS.lightText, 
    marginTop: 8,
    textAlign: 'right'
  },
  modifyButton: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 10, 
    borderRadius: 6, 
    alignItems: 'center',
    marginTop: 8
  },
  modifyText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 14 
  },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 16, 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: '#F5F7FA' 
  },
  backButtonText: { 
    color: COLORS.primary, 
    fontWeight: '600', 
    fontSize: 16, 
    marginLeft: 8 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 10, 
    padding: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.primary, 
    marginBottom: 4 
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 16
  },
  messageInput: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 8, 
    padding: 12, 
    minHeight: 120, 
    textAlignVertical: 'top', 
    marginBottom: 16 
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6
  },
  cancelButton: { 
    backgroundColor: '#FFFFFF', 
    borderColor: COLORS.danger, 
    borderWidth: 1,
    marginRight: 8
  },
  cancelText: { 
    color: COLORS.danger, 
    fontWeight: '600', 
    fontSize: 14 
  },
  mensajeHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8
  },
  mensajeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rolBadge: {
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
    marginLeft: 8
  },
  contenidoMensaje: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    marginVertical: 20,
    fontStyle: 'italic'
  },
  scrollContainer: {
    flex: 1
  },
  listContainer: {
    paddingBottom: 20
  },
  loader: {
    marginVertical: 40
  },
  filtrosContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 1
  },
  filtrosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16
  },
  filtrosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  rolesContainer: {
    flexDirection: 'row',
    marginBottom: 16
  },
  rolButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center'
  },
  rolButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  rolButtonText: {
    color: COLORS.text,
    fontWeight: '500'
  },
  rolButtonTextSelected: {
    color: '#FFFFFF'
  },
  gradosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  gradoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center'
  },
  gradoButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  gradoButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500'
  },
  gradoButtonTextSelected: {
    color: '#FFFFFF'
  },
  resetButton: {
    alignSelf: 'flex-end',
    padding: 8
  },
  resetButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    textDecorationLine: 'underline'
  },
  resultadosContainer: {
    marginTop: 8
  },
  resultadosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
    paddingLeft: 8
  },
  instruccionesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginTop: 20
  },
  instruccionesIcon: {
    marginBottom: 16
  },
  instruccionesText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 14
  },
  hijoInfoContainer: {
    marginBottom: 4
  },
  hijosModalContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6
  },
  hijosTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.text
  },
  hijoModalInfo: {
    marginLeft: 8,
    marginBottom: 4
  },
  hijoModalText: {
    color: COLORS.text,
    fontSize: 14
  }
});