// app/maestro/FormularioCitaMaestro.tsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  light: '#E5E7EB',
  background: '#FFFFFF',
  text: '#1A1A1A',
  border: '#D1D5DB',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
};

type Horario = {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  fecha: Timestamp;
};

export default function FormularioCitaMaestro() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Obtenemos los parámetros de navegación
  const tutorId = params.tutorId as string;
  const hijoId = params.hijoId as string;
  const tutorNombre = params.tutorNombre as string;
  const hijoNombre = params.hijoNombre as string;
  const grado = params.grado as string;

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horarioId, setHorarioId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [importancia, setImportancia] = useState('media');
  const [requiereDirectora, setRequiereDirectora] = useState(false);
  const [modalidad, setModalidad] = useState<'presencial' | 'linea'>('presencial');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHorarios = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Cargar horarios disponibles del maestro
        const horariosSnapshot = await getDocs(
          query(collection(db, 'horarios_disponibles'), 
            where('profesorId', '==', user.uid), 
            where('disponible', '==', true))
        );

        const horariosDisponibles = horariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Horario[];

        setHorarios(horariosDisponibles);
      } catch (error) {
        console.error("Error cargando horarios:", error);
        Alert.alert("Error", "No se pudieron cargar los horarios disponibles");
      } finally {
        setCargando(false);
      }
    };

    cargarHorarios();
  }, []);

  const handleAgendar = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!horarioId || !motivo.trim()) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
      return;
    }

    const horarioSeleccionado = horarios.find(h => h.id === horarioId);
    if (!horarioSeleccionado) {
      Alert.alert('Error', 'Horario no válido');
      return;
    }

    try {
      // Crear la cita
      await addDoc(collection(db, 'citas'), {
        tutorId,
        hijoId,
        profesorId: user.uid,
        horarioId,
        motivo,
        dia: horarioSeleccionado.dia,
        hora: horarioSeleccionado.horaInicio,
        importancia,
        requiereDirectora,
        modalidad,
        estado: 'pendiente',
        fechaCreacion: new Date(),
        fecha: horarioSeleccionado.fecha,
        grado,
        nombreAlumno: hijoNombre,
        tutorNombre
      });

      // Marcar horario como no disponible
      await updateDoc(doc(db, 'horarios_disponibles', horarioId), {
        disponible: false,
      });

      // Navegar a pantalla de confirmación
      router.push({
        pathname: '/maestro/Detalles',
        params: {
          nombreAlumno: hijoNombre,
          grado,
          dia: horarioSeleccionado.dia,
          hora: horarioSeleccionado.horaInicio,
          motivo,
          importancia,
          requiereDirectora: String(requiereDirectora),
          modalidad,
          tutorNombre
        },
      });
    } catch (error) {
      console.error("Error al agendar cita:", error);
      Alert.alert("Error", "No se pudo agendar la cita");
    }
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando horarios disponibles...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Botón de regreso */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Regresar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Agendar Nueva Cita</Text>

      {/* Información del alumno (solo lectura) */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Alumno:</Text>
        <Text style={styles.infoText}>{hijoNombre}</Text>
        
        <Text style={styles.infoLabel}>Grado:</Text>
        <Text style={styles.infoText}>{grado}</Text>
        
        <Text style={styles.infoLabel}>Tutor asignado:</Text>
        <Text style={styles.infoText}>{tutorNombre}</Text>
      </View>

      {/* Horario */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Horario disponible *</Text>
        {horarios.length > 0 ? (
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={horarioId} onValueChange={setHorarioId}>
              <Picker.Item label="Selecciona un horario" value="" />
              {horarios.map(h => (
                <Picker.Item 
                  key={h.id} 
                  label={`${h.dia} ${h.horaInicio} - ${h.horaFin}`} 
                  value={h.id} 
                />
              ))}
            </Picker>
          </View>
        ) : (
          <Text style={styles.warningText}>No hay horarios disponibles. Crea horarios primero.</Text>
        )}
      </View>

      {/* Motivo */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Motivo de la cita *</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Ej: Hablar sobre rendimiento académico, comportamiento, etc."
          value={motivo}
          onChangeText={setMotivo}
        />
      </View>

      {/* Prioridad */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Prioridad</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={importancia} onValueChange={setImportancia}>
            <Picker.Item label="Normal" value="media" />
            <Picker.Item label="Baja" value="baja" />
            <Picker.Item label="Alta" value="alta" />
          </Picker>
        </View>
      </View>

      {/* Directora */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>¿Requiere presencia de directora?</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={requiereDirectora} onValueChange={setRequiereDirectora}>
            <Picker.Item label="No" value={false} />
            <Picker.Item label="Sí" value={true} />
          </Picker>
        </View>
      </View>

      {/* Modalidad */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Modalidad de la cita</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={modalidad} onValueChange={(value) => setModalidad(value as 'presencial' | 'linea')}>
            <Picker.Item label="Presencial" value="presencial" />
            <Picker.Item label="En línea" value="linea" />
          </Picker>
        </View>
      </View>

      {/* Botón de agendar */}
      <TouchableOpacity 
        style={[styles.button, (!horarioId || !motivo.trim()) && styles.buttonDisabled]} 
        onPress={handleAgendar}
        disabled={!horarioId || !motivo.trim()}
      >
        <Ionicons name="calendar" size={20} color="#fff" />
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
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
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  warningText: {
    color: COLORS.warning,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});