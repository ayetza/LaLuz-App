// app/tutor/FormularioCita.tsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp, addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../lib/firebase';

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

type Profesor = {
  id: string;
  nombreCompleto: string;
  gradoAsignado: string;
};

type Horario = {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  fecha: Timestamp;
};

export default function FormularioCita() {
  const router = useRouter();
  const { hijoId } = useLocalSearchParams();

  const [profesorId, setProfesorId] = useState('');
  const [horarioId, setHorarioId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [importancia, setImportancia] = useState('media');
  const [requiereDirectora, setRequiereDirectora] = useState(false);
  const [modalidad, setModalidad] = useState<'presencial' | 'linea'>('presencial');
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [hijo, setHijo] = useState<{ nombre: string; grado: string } | null>(null);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargarDatosIniciales = useCallback(async () => {
    try {
      setErrorCarga(null);
      const user = auth.currentUser;
      if (!user) throw new Error('Debes iniciar sesión');

      const hijoRef = doc(db, 'users', user.uid, 'hijos', hijoId as string);
      const hijoDoc = await getDoc(hijoRef);
      if (!hijoDoc.exists()) throw new Error('Alumno no encontrado');

      const hijoData = hijoDoc.data() as { nombre: string; grado: string };
      setHijo(hijoData);

      const qProfesores = query(
        collection(db, 'users'),
        where('rol', '==', 'maestro'),
        where('estado', '==', 'activo'),
        where('gradoAsignado', '==', hijoData.grado)
      );

      const snapshot = await getDocs(qProfesores);
      const profesoresData = snapshot.docs.map((doc) => ({
        id: doc.id,
        nombreCompleto: doc.data().nombreCompleto || 'Sin nombre',
        gradoAsignado: doc.data().gradoAsignado || 'Sin grado asignado',
      }));

      if (profesoresData.length === 0) {
        setErrorCarga(`No hay profesores asignados para el grado ${hijoData.grado}`);
      }

      setProfesores(profesoresData);

    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      setErrorCarga(error.message || 'Error desconocido');
    } 
  }, [hijoId]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    const cargarHorariosDisponibles = async () => {
      if (!profesorId) return;

      try {
        setCargandoHorarios(true);
        setHorarioId('');
        
        const q = query(
          collection(db, 'horarios_disponibles'),
          where('profesorId', '==', profesorId),
          where('disponible', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const horariosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Horario[];
        
        setHorarios(horariosData);
        
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los horarios');
      } finally {
        setCargandoHorarios(false);
      }
    };

    cargarHorariosDisponibles();
  }, [profesorId]);

  const handleAgendarCita = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Debes iniciar sesión');
      if (!profesorId) throw new Error('Selecciona un profesor');
      if (!horarioId) throw new Error('Selecciona un horario disponible');
      if (!motivo.trim()) throw new Error('Describe el motivo de la cita');
  
      const horarioSeleccionado = horarios.find(h => h.id === horarioId);
      if (!horarioSeleccionado) throw new Error('Horario no válido');

      const fechaCita = horarioSeleccionado.fecha;
      if (!fechaCita || typeof fechaCita.toDate !== 'function') {
        throw new Error('Este horario no tiene una fecha válida');
      }

      await addDoc(collection(db, 'citas'), {
        tutorId: user.uid,
        hijoId,
        profesorId,
        horarioId,
        motivo: motivo.trim(),
        dia: horarioSeleccionado.dia,
        hora: horarioSeleccionado.horaInicio,
        importancia,
        requiereDirectora,
        modalidad,
        estado: 'pendiente',
        fechaCreacion: Timestamp.now(),
        fecha: fechaCita,
        grado: hijo?.grado,
        nombreAlumno: hijo?.nombre
      });
  
      const horarioRef = doc(db, 'horarios_disponibles', horarioId);
      await updateDoc(horarioRef, { disponible: false });
  
      router.push({
        pathname: './Detalles',
        params: {
          nombreAlumno: hijo?.nombre,
          grado: hijo?.grado,
          profesorNombre: profesores.find(p => p.id === profesorId)?.nombreCompleto || '',
          dia: horarioSeleccionado.dia,
          hora: horarioSeleccionado.horaInicio,
          motivo: motivo.trim(),
          importancia,
          requiereDirectora: String(requiereDirectora),
          modalidad,
        },
      });
      
    } catch (error: any) {
      console.error("Error al agendar:", error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Botón de volver */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Regresar</Text>
      </TouchableOpacity>

      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>Agendar Cita</Text>
        {hijo && (
          <Text style={styles.subtitle}>
            Alumno: {hijo.nombre} - Grado: {hijo.grado}
          </Text>
        )}
      </View>

      {/* Mensaje de error general */}
      {errorCarga && (
        <View style={styles.errorBox}>
          <Ionicons name="warning" size={20} color={COLORS.error} />
          <Text style={styles.errorText}>{errorCarga}</Text>
          <TouchableOpacity 
            style={styles.reloadButton}
            onPress={cargarDatosIniciales}
          >
            <Ionicons name="refresh" size={16} color={COLORS.primary} />
            <Text style={styles.reloadText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selección de Profesor */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Profesor <Text style={styles.required}>*</Text></Text>
        {profesores.length > 0 ? (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={profesorId}
              onValueChange={(value) => {
                setProfesorId(value);
                setHorarioId('');
              }}
              dropdownIconColor={COLORS.primary}
            >
              <Picker.Item label="Selecciona un profesor" value="" />
              {profesores.map((profesor) => (
                <Picker.Item
                  key={profesor.id}
                  label={`${profesor.nombreCompleto} (${profesor.gradoAsignado})`}
                  value={profesor.id}
                />
              ))}
            </Picker>
          </View>
        ) : (
          !errorCarga && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
              <Text style={styles.warningText}>No hay profesores disponibles</Text>
            </View>
          )
        )}
      </View>

      {/* Horarios disponibles */}
      {profesorId && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Horario Disponible <Text style={styles.required}>*</Text></Text>
          {cargandoHorarios ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : horarios.length > 0 ? (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={horarioId}
                onValueChange={setHorarioId}
                dropdownIconColor={COLORS.primary}
              >
                <Picker.Item label="Selecciona un horario" value="" />
                {horarios.map((horario) => (
                  <Picker.Item
                    key={horario.id}
                    label={`${horario.dia} ${horario.horaInicio} - ${horario.horaFin}`}
                    value={horario.id}
                  />
                ))}
              </Picker>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Ionicons name="time-outline" size={20} color={COLORS.warning} />
              <Text style={styles.warningText}>No hay horarios disponibles</Text>
            </View>
          )}
        </View>
      )}

      {/* Motivo */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Motivo <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Ej: Revisión de calificaciones..."
          value={motivo}
          onChangeText={setMotivo}
        />
      </View>

      {/* Prioridad, Directora y Modalidad */}
      <View style={styles.inlineGroup}>
        <View style={styles.inlineItem}>
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.pickerSmall}>
            <Picker
              selectedValue={importancia}
              onValueChange={setImportancia}
            >
              <Picker.Item label="Normal" value="media" />
              <Picker.Item label="Baja" value="baja" />
              <Picker.Item label="Alta" value="alta" />
            </Picker>
          </View>
        </View>

        <View style={styles.inlineItem}>
          <Text style={styles.label}>¿Con directora?</Text>
          <View style={styles.pickerSmall}>
            <Picker
              selectedValue={requiereDirectora}
              onValueChange={setRequiereDirectora}
            >
              <Picker.Item label="No" value={false} />
              <Picker.Item label="Sí" value={true} />
            </Picker>
          </View>
        </View>
      </View>

      {/* Modalidad de la cita */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Modalidad <Text style={styles.required}>*</Text></Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={modalidad}
            onValueChange={(itemValue) => setModalidad(itemValue as 'presencial' | 'linea')}
          >
            <Picker.Item label="Presencial" value="presencial" />
            <Picker.Item label="En línea" value="linea" />
          </Picker>
        </View>
        <Text style={styles.selectedValueText}>
          Seleccionado: {modalidad === 'presencial' ? 'Presencial' : 'En línea'}
        </Text>
      </View>

      {/* Botón de agendar */}
      <TouchableOpacity
        style={[
          styles.button,
          (!profesorId || !horarioId || !motivo.trim()) && styles.buttonDisabled
        ]}
        onPress={handleAgendarCita}
        disabled={!profesorId || !horarioId || !motivo.trim()}
      >
        <Ionicons name="calendar" size={20} color="white" />
        <Text style={styles.buttonText}>Agendar Cita</Text>
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontSize: 16,
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
  header: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 5,
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
  required: {
    color: COLORS.error,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.light,
    overflow: 'hidden',
  },
  pickerSmall: {
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
    minHeight: 120,
    backgroundColor: COLORS.light,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.text,
  },
  inlineGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inlineItem: {
    width: '48%',
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
    gap: 8,
  },
  warningText: {
    color: COLORS.warning,
  },
  errorBox: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 10,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.light,
    borderRadius: 6,
    gap: 5,
  },
  reloadText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedValueText: {
    marginTop: 5,
    color: COLORS.primary,
    fontSize: 14,
    fontStyle: 'italic',
  },
});