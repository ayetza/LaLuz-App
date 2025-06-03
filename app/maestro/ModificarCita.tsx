import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  light: '#E5E7EB',
  background: '#FFFFFF',
  text: '#1A1A1A',
  border: '#D1D5DB',
  error: '#DC2626',
};

export default function ModificarCitaMaestro() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [horarioId, setHorarioId] = useState('');
  const [horarios, setHorarios] = useState<any[]>([]);
  const [profesorId, setProfesorId] = useState('');
  const [datosCita, setDatosCita] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const citaRef = doc(db, 'citas', id as string);
        const citaSnap = await getDoc(citaRef);
        if (!citaSnap.exists()) throw new Error('Cita no encontrada');

        const data = citaSnap.data();
        setDatosCita(data);
        setProfesorId(data.profesorId);
        setHorarioId(data.horarioId);

        const q = query(
          collection(db, 'horarios_disponibles'),
          where('profesorId', '==', data.profesorId),
          where('disponible', '==', true)
        );
        const snap = await getDocs(q);
        const horariosDisponibles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHorarios(horariosDisponibles);
      } catch (error) {
        console.error('Error al cargar datos de la cita:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  const handleGuardarCambios = async () => {
    try {
      if (!horarioId) throw new Error('Debes seleccionar un nuevo horario');
      await updateDoc(doc(db, 'citas', id as string), {
        horarioId,
      });
      Alert.alert('Éxito', 'Horario actualizado correctamente');
      router.push('/maestro/Citas');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Modificar Horario</Text>

      {/* Mostrar detalles de la cita */}
      {datosCita && (
        <View style={styles.detailsBox}>
          <Text style={styles.detail}><Text style={styles.bold}>Alumno:</Text> {datosCita.nombreAlumno}</Text>
          <Text style={styles.detail}><Text style={styles.bold}>Grado:</Text> {datosCita.grado}</Text>
          <Text style={styles.detail}><Text style={styles.bold}>Motivo:</Text> {datosCita.motivo}</Text>
          <Text style={styles.detail}><Text style={styles.bold}>Importancia:</Text> {datosCita.importancia}</Text>
          <Text style={styles.detail}><Text style={styles.bold}>Directora:</Text> {datosCita.requiereDirectora ? 'Sí' : 'No'}</Text>
        </View>
      )}

      {/* Horario */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nuevo horario</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={horarioId} onValueChange={setHorarioId}>
            <Picker.Item label="Selecciona un horario" value="" />
            {horarios.map((h) => (
              <Picker.Item key={h.id} label={`${h.dia} ${h.horaInicio} - ${h.horaFin}`} value={h.id} />
            ))}
          </Picker>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleGuardarCambios}>
        <Ionicons name="save" size={20} color="#FFF" />
        <Text style={styles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  backButtonText: {
    marginLeft: 5,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    fontSize: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.light,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  detailsBox: {
    backgroundColor: COLORS.light,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detail: {
    fontSize: 14,
    marginBottom: 6,
    color: COLORS.text,
  },
  bold: {
    fontWeight: '600',
  },
});
