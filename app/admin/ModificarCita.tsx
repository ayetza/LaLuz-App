// app/admin/ModificarCita.tsx
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

export default function ModificarCitaAdmin() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [profesorId, setProfesorId] = useState('');
  const [horarioId, setHorarioId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [importancia, setImportancia] = useState('media');
  const [requiereDirectora, setRequiereDirectora] = useState(false);
  const [modalidad, setModalidad] = useState<'presencial' | 'linea'>('presencial');
  const [profesores, setProfesores] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [grado, setGrado] = useState('');
  const [tutorId, setTutorId] = useState('');
  const [tutores, setTutores] = useState<any[]>([]);
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
        setModalidad(data.modalidad || 'presencial');
        setProfesorId(data.profesorId);
        setHorarioId(data.horarioId);
        setGrado(data.grado);
        setTutorId(data.tutorId);

        // Cargar todos los profesores (sin filtro por grado)
        const qProf = query(collection(db, 'users'), where('rol', '==', 'maestro'));
        const snapProf = await getDocs(qProf);
        const profs = snapProf.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProfesores(profs);

        // Cargar todos los tutores
        const qTut = query(collection(db, 'users'), where('rol', '==', 'tutor'));
        const snapTut = await getDocs(qTut);
        const tuts = snapTut.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTutores(tuts);

        // Cargar horarios del profesor seleccionado
        if (data.profesorId) {
          const qHor = query(
            collection(db, 'horarios_disponibles'), 
            where('profesorId', '==', data.profesorId), 
            where('disponible', '==', true)
          );
          const snapHor = await getDocs(qHor);
          const horariosData = snapHor.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setHorarios(horariosData);
        }
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
      const q = query(
        collection(db, 'horarios_disponibles'), 
        where('profesorId', '==', profesorId), 
        where('disponible', '==', true)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHorarios(data);
    };

    cargarHorarios();
  }, [profesorId]);

  const handleGuardarCambios = async () => {
    try {
      if (!profesorId || !horarioId || !motivo.trim() || !tutorId) {
        throw new Error('Faltan campos requeridos');
      }
      
      await updateDoc(doc(db, 'citas', id as string), {
        profesorId,
        horarioId,
        tutorId,
        motivo,
        importancia,
        requiereDirectora,
        modalidad,
        grado: tutores.find(t => t.id === tutorId)?.gradoHijo || grado
      });
      
      Alert.alert('Éxito', 'Cita actualizada correctamente');
      router.push('/admin/CitasAgendadas');
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
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Modificar Cita</Text>

      {/* Tutor */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tutor</Text>
        <View style={styles.pickerWrapper}>
          <Picker 
            selectedValue={tutorId} 
            onValueChange={(value) => {
              setTutorId(value);
              const tutorSeleccionado = tutores.find(t => t.id === value);
              if (tutorSeleccionado) {
                setGrado(tutorSeleccionado.gradoHijo || '');
              }
            }}
            dropdownIconColor={COLORS.primary}
          >
            <Picker.Item label="Selecciona un tutor" value="" />
            {tutores.map((t) => (
              <Picker.Item key={t.id} label={t.nombreCompleto} value={t.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Grado (automático basado en tutor) */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Grado del alumno</Text>
        <TextInput 
          style={[styles.textArea, { minHeight: 50, backgroundColor: '#F5F5F5' }]} 
          value={grado}
          editable={false}
        />
      </View>

      {/* Profesor */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Profesor</Text>
        <View style={styles.pickerWrapper}>
          <Picker 
            selectedValue={profesorId} 
            onValueChange={setProfesorId}
            dropdownIconColor={COLORS.primary}
          >
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
          <Picker 
            selectedValue={horarioId} 
            onValueChange={setHorarioId}
            dropdownIconColor={COLORS.primary}
          >
            <Picker.Item label="Selecciona un horario" value="" />
            {horarios.map((h) => (
              <Picker.Item 
                key={h.id} 
                label={`${h.dia} ${h.horaInicio} - ${h.horaFin}`} 
                value={h.id} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Motivo */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Motivo</Text>
        <TextInput 
          style={styles.textArea} 
          multiline 
          value={motivo} 
          onChangeText={setMotivo} 
          placeholder="Describe el motivo de la cita"
        />
      </View>

      {/* Modalidad */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Modalidad</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={modalidad}
            onValueChange={(itemValue) => setModalidad(itemValue as 'presencial' | 'linea')}
            dropdownIconColor={COLORS.primary}
          >
            <Picker.Item label="Presencial" value="presencial" />
            <Picker.Item label="En línea" value="linea" />
          </Picker>
        </View>
      </View>

      {/* Importancia */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Importancia</Text>
        <View style={styles.pickerWrapper}>
          <Picker 
            selectedValue={importancia} 
            onValueChange={setImportancia}
            dropdownIconColor={COLORS.primary}
          >
            <Picker.Item label="Alta" value="alta" />
            <Picker.Item label="Media" value="media" />
            <Picker.Item label="Baja" value="baja" />
          </Picker>
        </View>
      </View>

      {/* Directora */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>¿Requiere directora?</Text>
        <View style={styles.pickerWrapper}>
          <Picker 
            selectedValue={requiereDirectora} 
            onValueChange={setRequiereDirectora}
            dropdownIconColor={COLORS.primary}
          >
            <Picker.Item label="No" value={false} />
            <Picker.Item label="Sí" value={true} />
          </Picker>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.button, 
          (!profesorId || !horarioId || !motivo.trim() || !tutorId) && styles.buttonDisabled
        ]} 
        onPress={handleGuardarCambios}
        disabled={!profesorId || !horarioId || !motivo.trim() || !tutorId}
      >
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    marginLeft: 5,
    color: COLORS.primary,
    fontSize: 14,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});