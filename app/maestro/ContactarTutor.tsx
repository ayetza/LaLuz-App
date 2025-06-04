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

interface HijoConTutor {
  tutorId: string;
  tutorNombre: string;
  hijoId: string;
  hijoNombre: string;
  grado: string;
}

interface MensajeEnviado {
  id: string;
  alumnoNombre: string;
  tutorNombre: string;
  contenido: string;
  fecha: any;
}

const COLORS = {
  primary: '#3A557C',
  secondary: '#8FC027',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightText: '#666666',
  border: '#E0E0E0',
  danger: '#D9534F',
};

export default function ContactarTutor() {
  const [activeTab, setActiveTab] = useState<'contactar' | 'historial'>('contactar');
  const [alumnos, setAlumnos] = useState<HijoConTutor[]>([]);
  const [mensajes, setMensajes] = useState<MensajeEnviado[]>([]);
  const [gradoMaestro, setGradoMaestro] = useState('');
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<HijoConTutor | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return router.push('/login');

        const maestroSnap = await getDoc(doc(db, 'users', user.uid));
        const grado = maestroSnap.data()?.gradoAsignado;
        if (!grado) return;
        setGradoMaestro(grado);

        const tutoresSnap = await getDocs(query(collection(db, 'users'), where('rol', '==', 'tutor')));
        const alumnosTemp: HijoConTutor[] = [];

        for (const tutor of tutoresSnap.docs) {
          const hijosSnap = await getDocs(query(collection(db, 'users', tutor.id, 'hijos'), where('grado', '==', grado)));
          hijosSnap.forEach(hijo => alumnosTemp.push({
            tutorId: tutor.id,
            tutorNombre: tutor.data().nombreCompleto,
            hijoId: hijo.id,
            hijoNombre: hijo.data().nombre,
            grado: hijo.data().grado
          }));
        }

        const mensajesSnap = await getDocs(query(
          collection(db, 'contactos_tutor'),
          where('maestroId', '==', user.uid),
          where('tipo', '==', 'mensaje')
        ));

        const mensajesTemp: MensajeEnviado[] = mensajesSnap.docs.map(doc => ({
          id: doc.id,
          alumnoNombre: doc.data().alumnoNombre,
          tutorNombre: doc.data().tutorNombre,
          contenido: doc.data().contenido,
          fecha: doc.data().fecha,
        }));

        setAlumnos(alumnosTemp);
        setMensajes(mensajesTemp);
      } catch (e) {
        Alert.alert('Error', 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const registrarContacto = async (tutor: HijoConTutor) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const maestroSnap = await getDoc(doc(db, 'users', user.uid));
      const maestroNombre = maestroSnap.data()?.nombreCompleto || 'Maestro';

      await addDoc(collection(db, 'contactos_tutor'), {
        maestroId: user.uid,
        maestroNombre,
        tutorId: tutor.tutorId,
        tutorNombre: tutor.tutorNombre,
        alumnoId: tutor.hijoId,
        alumnoNombre: tutor.hijoNombre,
        grado: tutor.grado,
        tipo: 'mensaje',
        contenido: mensaje,
        fecha: serverTimestamp(),
        estado: 'pendiente'
      });

      setModalVisible(false);
      setMensaje('');

      router.push({
        pathname: '/maestro/Detalles',
        params: {
          nombreAlumno: tutor.hijoNombre,
          grado: tutor.grado,
          motivo: mensaje,
          tutorNombre: tutor.tutorNombre
        }
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo registrar el mensaje');
    }
  };

  const formatDate = (fecha: any) => {
    if (!fecha?.toDate) return 'Fecha inválida';
    return fecha.toDate().toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const eliminarMensajeLocal = (id: string) => {
    setMensajes((prevMensajes) => prevMensajes.filter((m) => m.id !== id));
  };

  const renderMensaje = ({ item }: { item: MensajeEnviado }) => (
    <View style={styles.card}>
      <View style={styles.mensajeHeader}>
        <Text style={styles.nombre}>{item.alumnoNombre}</Text>
        <TouchableOpacity onPress={() => eliminarMensajeLocal(item.id)}>
          <Ionicons name="trash-bin" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      <Text style={styles.info}>Tutor: {item.tutorNombre}</Text>
      <Text style={styles.info}>Mensaje: {item.contenido}</Text>
      <Text style={styles.fecha}>{formatDate(item.fecha)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderAuth />
      <View style={styles.content}>
        <Text style={styles.title}>Contactar Tutores</Text>
        <Text style={styles.subtitle}>Administra tus mensajes con los tutores</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'contactar' && styles.activeTab]} onPress={() => setActiveTab('contactar')}>
            <Text style={[styles.tabText, activeTab === 'contactar' && styles.activeTabText]}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'historial' && styles.activeTab]} onPress={() => setActiveTab('historial')}>
            <Text style={[styles.tabText, activeTab === 'historial' && styles.activeTabText]}>Historial</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : activeTab === 'contactar' ? (
          <ScrollView>
            {alumnos.map((alumno) => (
              <View key={`${alumno.tutorId}-${alumno.hijoId}`} style={styles.card}>
                <Text style={styles.nombre}>{alumno.hijoNombre}</Text>
                <Text style={styles.info}>Grado: {alumno.grado}</Text>
                <Text style={styles.info}>Tutor: {alumno.tutorNombre}</Text>
                <TouchableOpacity style={styles.modifyButton} onPress={() => { setSelectedTutor(alumno); setModalVisible(true); }}>
                  <Text style={styles.modifyText}>Enviar Mensaje</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={mensajes}
            keyExtractor={item => item.id}
            renderItem={renderMensaje}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/maestro/MaestroHome')}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Volver al Menú</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mensaje para {selectedTutor?.tutorNombre}</Text>
            <TextInput
              style={styles.messageInput}
              multiline
              placeholder="Escribe tu mensaje..."
              value={mensaje}
              onChangeText={setMensaje}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setMensaje(''); setModalVisible(false); }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modifyButton} onPress={() => selectedTutor && registrarContacto(selectedTutor)} disabled={!mensaje.trim()}>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.lightText, textAlign: 'center', marginVertical: 8 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F5F7FA', borderRadius: 8, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 16, fontWeight: '600', color: COLORS.lightText },
  activeTabText: { color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 16, borderTopWidth: 4, borderTopColor: COLORS.primary, elevation: 2 },
  nombre: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  info: { fontSize: 14, color: COLORS.lightText, marginTop: 4 },
  fecha: { fontSize: 12, color: COLORS.lightText, marginTop: 8 },
  modifyButton: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  modifyText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  cancelButton: { flex: 1, backgroundColor: '#FFFFFF', borderColor: COLORS.danger, borderWidth: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cancelText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, padding: 12, borderRadius: 8, backgroundColor: '#F5F7FA' },
  backButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 16, marginLeft: 8 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 },
  messageInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  mensajeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
