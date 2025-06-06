// app/maestro/Horarios.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
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

type Horario = {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  fecha: Timestamp;
  disponible: boolean; 
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS_DISPONIBLES = [
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00'
];

export default function Horarios() {
  const router = useRouter();
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [horasSeleccionadas, setHorasSeleccionadas] = useState<string[]>([]);
  const [horariosRegistrados, setHorariosRegistrados] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generarFecha = useCallback((diaSemana: string): Date => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diaActual = hoy.getDay();
    const diaObjetivo = dias.indexOf(diaSemana);

    let diferencia = diaObjetivo - diaActual;
    if (diferencia < 0) {
      diferencia += 7;
    } else if (diferencia === 0) {
      diferencia += 7;
    }

    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diferencia);
    return fecha;
  }, []);

  const cargarHorarios = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) throw new Error('Debes iniciar sesión');

      const q = query(
        collection(db, 'horarios_disponibles'),
        where('profesorId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const horariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Horario[];

      setHorariosRegistrados(horariosData);

      const initialDias: string[] = [];
      const initialHoras: string[] = [];
      horariosData.forEach(horario => {
        if (horario.disponible) {
          if (!initialDias.includes(horario.dia)) {
            initialDias.push(horario.dia);
          }
          const horaString = `${horario.horaInicio} - ${horario.horaFin}`;
          if (!initialHoras.includes(horaString)) {
            initialHoras.push(horaString);
          }
        }
      });
      setDiasSeleccionados(initialDias);
      setHorasSeleccionadas(initialHoras);

    } catch (error: any) {
      console.error("Error al cargar horarios:", error);
      setError(error.message || 'Error al cargar horarios');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarHorarios();
  }, [cargarHorarios]);

  const toggleDia = (dia: string) => {
    setDiasSeleccionados(prev =>
      prev.includes(dia)
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const toggleHora = (hora: string) => {
    setHorasSeleccionadas(prev =>
      prev.includes(hora)
        ? prev.filter(h => h !== hora)
        : [...prev, hora]
    );
  };

  const guardarHorarios = async () => {
    try {
      setCargando(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Debes iniciar sesión');
      if (diasSeleccionados.length === 0 || horasSeleccionadas.length === 0) {
        throw new Error('Selecciona al menos un día y una hora');
      }

      const currentHorariosMap = new Map<string, Horario>();
      horariosRegistrados.forEach(h => {
        currentHorariosMap.set(`${h.dia}-${h.horaInicio}-${h.horaFin}`, h);
      });

      const newHorariosToSet: { dia: string; horaInicio: string; horaFin: string; fecha: Timestamp; }[] = [];
      diasSeleccionados.forEach(dia => {
        horasSeleccionadas.forEach(hora => {
          const [horaInicio, horaFin] = hora.split(' - ');
          const fecha = generarFecha(dia);
          newHorariosToSet.push({ dia, horaInicio, horaFin, fecha: Timestamp.fromDate(fecha) });
        });
      });

      for (const [key, horario] of currentHorariosMap.entries()) {
        const isStillSelected = newHorariosToSet.some(
          nh => nh.dia === horario.dia && nh.horaInicio === horario.horaInicio && nh.horaFin === horario.horaFin
        );

        if (!isStillSelected && horario.disponible) {
          await deleteDoc(doc(db, 'horarios_disponibles', horario.id));
        }
      }

      for (const newHorario of newHorariosToSet) {
        const key = `${newHorario.dia}-${newHorario.horaInicio}-${newHorario.horaFin}`;
        if (!currentHorariosMap.has(key)) {
          await addDoc(collection(db, 'horarios_disponibles'), {
            profesorId: user.uid,
            dia: newHorario.dia,
            horaInicio: newHorario.horaInicio,
            horaFin: newHorario.horaFin,
            disponible: true,
            fecha: newHorario.fecha,
            nombreProfesor: user.displayName || 'Profesor'
          });
        }
      }

      Alert.alert('Éxito', 'Horarios actualizados correctamente');
      await cargarHorarios();
    } catch (error: any) {
      console.error("Error al guardar horarios:", error);
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <HeaderAuth />
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
          <Text style={styles.title}>Mis Horarios Disponibles</Text>
          <Text style={styles.subtitle}>
            Selecciona los días y horarios en que estás disponible para atender citas. Los horarios ya agendados no se pueden eliminar.
          </Text>
        </View>

        {/* Mensaje de error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.reloadButton}
              onPress={cargarHorarios}
            >
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={styles.reloadText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Días de la semana */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Días disponibles</Text>
          <View style={styles.diasContainer}>
            {DIAS_SEMANA.map(dia => (
              <TouchableOpacity
                key={dia}
                style={[
                  styles.diaButton,
                  diasSeleccionados.includes(dia) && styles.diaButtonSelected
                ]}
                onPress={() => toggleDia(dia)}
              >
                <Text style={[
                  styles.diaButtonText,
                  diasSeleccionados.includes(dia) && styles.diaButtonTextSelected
                ]}>
                  {dia}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Horas disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horas disponibles</Text>
          <View style={styles.horasContainer}>
            {HORAS_DISPONIBLES.map(hora => (
              <TouchableOpacity
                key={hora}
                style={[
                  styles.horaButton,
                  horasSeleccionadas.includes(hora) && styles.horaButtonSelected
                ]}
                onPress={() => toggleHora(hora)}
              >
                <Text style={[
                  styles.horaButtonText,
                  horasSeleccionadas.includes(hora) && styles.horaButtonTextSelected
                ]}>
                  {hora}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Horarios registrados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis horarios registrados (y su estado)</Text>
          {cargando ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : horariosRegistrados.length > 0 ? (
            <View style={styles.horariosList}>
              {horariosRegistrados.map(horario => (
                <View key={horario.id} style={styles.horarioItem}>
                  <Ionicons
                    name={horario.disponible ? "checkmark-circle" : "close-circle"}
                    size={18}
                    color={horario.disponible ? COLORS.success : COLORS.error}
                  />
                  <Text style={styles.horarioText}>
                    {horario.dia} {horario.horaInicio} - {horario.horaFin}
                    <Text style={{ color: horario.disponible ? COLORS.success : COLORS.error, fontWeight: 'bold' }}>
                      ({horario.disponible ? 'Disponible' : 'Agendado'})
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No has configurado ningún horario disponible.</Text>
          )}
        </View>

        {/* Botón de guardar */}
        <TouchableOpacity
          style={[
            styles.button,
            (diasSeleccionados.length === 0 || horasSeleccionadas.length === 0) && styles.buttonDisabled
          ]}
          onPress={guardarHorarios}
          disabled={diasSeleccionados.length === 0 || horasSeleccionadas.length === 0 || cargando}
        >
          {cargando ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.buttonText}>Guardar Horarios</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80, // Para que el footer no tape el contenido
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 15,
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  diaButton: {
    width: '30%',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: COLORS.light,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  diaButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diaButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  diaButtonTextSelected: {
    color: 'white',
  },
  horasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  horaButton: {
    width: '48%',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: COLORS.light,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  horaButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  horaButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  horaButtonTextSelected: {
    color: 'white',
  },
  horariosList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
  },
  horarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  horarioText: {
    marginLeft: 10,
    color: COLORS.text,
  },
  emptyText: {
    color: COLORS.text,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
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
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
});