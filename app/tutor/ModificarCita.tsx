// app/tutor/ModificarCita.tsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  light: '#E5E7EB',
  background: '#FFFFFF',
  text: '#1A1A1A',
  border: '#D1D5DB',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981'
};

export default function ModificarCita() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [profesorId, setProfesorId] = useState('');
  const [horarioId, setHorarioId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [importancia, setImportancia] = useState('media');
  const [requiereDirectora, setRequiereDirectora] = useState(false);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [grado, setGrado] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setError('');
        const citaRef = doc(db, 'citas', id as string);
        const citaSnap = await getDoc(citaRef);
        if (!citaSnap.exists()) throw new Error('Cita no encontrada');

        const data = citaSnap.data();
        setMotivo(data.motivo);
        setImportancia(data.importancia);
        setRequiereDirectora(data.requiereDirectora);
        setProfesorId(data.profesorId);
        setHorarioId(data.horarioId);
        setGrado(data.grado);

        const qProf = query(collection(db, 'users'), where('rol', '==', 'maestro'), where('gradoAsignado', '==', data.grado));
        const snapProf = await getDocs(qProf);
        const profs = snapProf.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProfesores(profs);

        const qHor = query(collection(db, 'horarios_disponibles'), where('profesorId', '==', data.profesorId), where('disponible', '==', true));
        const snapHor = await getDocs(qHor);
        const horariosData = snapHor.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHorarios(horariosData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  useEffect(() => {
    const cargarHorarios = async () => {
      if (!profesorId) return;
      const q = query(collection(db, 'horarios_disponibles'), where('profesorId', '==', profesorId), where('disponible', '==', true));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHorarios(data);
    };

    cargarHorarios();
  }, [profesorId]);

  const handleGuardarCambios = async () => {
    try {
      if (!profesorId || !horarioId || !motivo.trim()) throw new Error('Faltan campos requeridos');
      await updateDoc(doc(db, 'citas', id as string), {
        profesorId,
        horarioId,
        motivo,
        importancia,
        requiereDirectora
      });
      Alert.alert('Éxito', 'Cita actualizada correctamente');
      router.push('/tutor/CitasAgendadas');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Modificar Cita</Text>

      {/* Profesor */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Profesor</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={profesorId} onValueChange={setProfesorId}>
            <Picker.Item label="Selecciona un profesor" value="" />
            {profesores.map((p) => (
              <Picker.Item key={p.id} label={p.nombreCompleto} value={p.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Horario */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Horario</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={horarioId} onValueChange={setHorarioId}>
            <Picker.Item label="Selecciona un horario" value="" />
            {horarios.map((h) => (
              <Picker.Item key={h.id} label={`${h.dia} ${h.horaInicio} - ${h.horaFin}`} value={h.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Motivo */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Motivo</Text>
        <TextInput style={styles.textArea} multiline value={motivo} onChangeText={setMotivo} />
      </View>

      {/* Importancia */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Importancia</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={importancia} onValueChange={setImportancia}>
            <Picker.Item label="Alta" value="alta" />
            <Picker.Item label="Media" value="media" />
            <Picker.Item label="Baja" value="baja" />
          </Picker>
        </View>
      </View>

      {/* Directora */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>¿Con directora?</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={requiereDirectora} onValueChange={setRequiereDirectora}>
            <Picker.Item label="No" value={false} />
            <Picker.Item label="Sí" value={true} />
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
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    minHeight: 100,
    backgroundColor: COLORS.light,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.text,
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
});