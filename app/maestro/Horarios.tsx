import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

type TimeSlot = {
  start: string;
  end: string;
  isCustom?: boolean;
  isNew?: boolean;
};

type DaySchedule = {
  name: string;
  active: boolean;
  slots: TimeSlot[];
  defaultMorning: boolean;
  defaultAfternoon: boolean;
};

const DEFAULT_MORNING = { start: '07:00', end: '07:30', isCustom: false };
const DEFAULT_AFTERNOON = { start: '14:00', end: '14:30', isCustom: false };

export default function Horarios() {
  const navigation = useNavigation();
  const [days, setDays] = useState<DaySchedule[]>([
    { name: 'Lunes', active: false, slots: [], defaultMorning: false, defaultAfternoon: false },
    { name: 'Martes', active: false, slots: [], defaultMorning: false, defaultAfternoon: false },
    { name: 'Miércoles', active: false, slots: [], defaultMorning: false, defaultAfternoon: false },
    { name: 'Jueves', active: false, slots: [], defaultMorning: false, defaultAfternoon: false },
    { name: 'Viernes', active: false, slots: [], defaultMorning: false, defaultAfternoon: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const validateTimeFormat = (time: string) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const validateTimeRange = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    return endTime > startTime;
  };

  useEffect(() => {
    obtenerHorarios();
  }, []);

  const obtenerHorarios = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No hay usuario autenticado.');
      return;
    }

    setIsLoading(true);
    try {
      const horariosRef = db.collection(`horarios_disponibles`);
      const querySnapshot = await horariosRef
        .where('profesorId', '==', user.uid)
        .get();

      const updatedDays = [...days];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dayIndex = updatedDays.findIndex(d => 
          d.name.toLowerCase() === data.dia.toLowerCase()
        );
        
        if (dayIndex !== -1) {
          updatedDays[dayIndex].active = true;
          
          if (data.horainicio === DEFAULT_MORNING.start && data.horafin === DEFAULT_MORNING.end) {
            updatedDays[dayIndex].defaultMorning = true;
          } 
          else if (data.horainicio === DEFAULT_AFTERNOON.start && data.horafin === DEFAULT_AFTERNOON.end) {
            updatedDays[dayIndex].defaultAfternoon = true;
          } 
          else {
            updatedDays[dayIndex].slots.push({
              start: data.horainicio,
              end: data.horafin,
              isCustom: true
            });
          }
        }
      });

      setDays(updatedDays);
    } catch (error) {
      console.error('Error al leer los horarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (index: number) => {
    const updatedDays = [...days];
    updatedDays[index].active = !updatedDays[index].active;
    
    if (!updatedDays[index].active) {
      updatedDays[index].defaultMorning = false;
      updatedDays[index].defaultAfternoon = false;
      updatedDays[index].slots = [];
    }
    
    setDays(updatedDays);
  };

  const toggleDefaultSlot = (dayIndex: number, slotType: 'morning' | 'afternoon') => {
    const updatedDays = [...days];
    
    if (slotType === 'morning') {
      updatedDays[dayIndex].defaultMorning = !updatedDays[dayIndex].defaultMorning;
    } else {
      updatedDays[dayIndex].defaultAfternoon = !updatedDays[dayIndex].defaultAfternoon;
    }
    
    if (!updatedDays[dayIndex].active) {
      updatedDays[dayIndex].active = true;
    }
    
    setDays(updatedDays);
  };

  const addCustomTimeSlot = (dayIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].slots.push({ 
      start: '08:00', 
      end: '09:00',
      isCustom: true,
      isNew: true
    });
    setDays(updatedDays);
  };

  const removeCustomTimeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].slots.splice(slotIndex, 1);
    setDays(updatedDays);
  };

  const confirmCustomTimeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].slots[slotIndex].isNew = false;
    setDays(updatedDays);
  };

  const updateCustomTimeSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const cleanedValue = value.replace(/[^0-9:]/g, '');
    const formattedValue = cleanedValue.length > 5 ? cleanedValue.substring(0, 5) : cleanedValue;
    
    const updatedDays = [...days];
    updatedDays[dayIndex].slots[slotIndex][field] = formattedValue;
    setDays(updatedDays);
  };

  const guardarHorarios = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado.');
      return;
    }

    // Validación de horarios
    for (const day of days) {
      if (day.active) {
        for (const slot of day.slots) {
          if (!slot.start || !slot.end) {
            Alert.alert('Error', `Por favor complete todos los campos de horario para ${day.name}`);
            return;
          }
          
          if (!validateTimeFormat(slot.start)) {
            Alert.alert('Error', `Formato de hora de inicio inválido en ${day.name}. Use HH:MM (24 horas)`);
            return;
          }

          if (!validateTimeFormat(slot.end)) {
            Alert.alert('Error', `Formato de hora de fin inválido en ${day.name}. Use HH:MM (24 horas)`);
            return;
          }

          if (!validateTimeRange(slot.start, slot.end)) {
            Alert.alert('Error', `La hora de fin debe ser posterior a la hora de inicio en ${day.name}`);
            return;
          }
        }
      }
    }

    setIsLoading(true);
    try {
      const batch = db.batch();
      
      // Eliminar horarios existentes
      const existingRef = db.collection('horarios_disponibles')
        .where('profesorId', '==', user.uid);
      const existingSnapshot = await existingRef.get();
      existingSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Guardar nuevos horarios
      days.forEach(day => {
        if (day.active) {
          if (day.defaultMorning) {
            const morningRef = db.collection('horarios_disponibles').doc();
            batch.set(morningRef, {
              dia: day.name.toLowerCase(),
              disponible: true,
              horainicio: DEFAULT_MORNING.start,
              horafin: DEFAULT_MORNING.end,
              profesorId: user.uid,
              isDefault: true
            });
          }
          
          if (day.defaultAfternoon) {
            const afternoonRef = db.collection('horarios_disponibles').doc();
            batch.set(afternoonRef, {
              dia: day.name.toLowerCase(),
              disponible: true,
              horainicio: DEFAULT_AFTERNOON.start,
              horafin: DEFAULT_AFTERNOON.end,
              profesorId: user.uid,
              isDefault: true
            });
          }
          
          day.slots.forEach(slot => {
            if (slot.start && slot.end) {
              const ref = db.collection('horarios_disponibles').doc();
              batch.set(ref, {
                dia: day.name.toLowerCase(),
                disponible: true,
                horainicio: slot.start,
                horafin: slot.end,
                profesorId: user.uid,
                isCustom: true
              });
            }
          });
        }
      });

      await batch.commit();
      Alert.alert('Éxito', 'Horarios guardados correctamente');
    } catch (error) {
      console.error('Error al guardar los horarios:', error);
      Alert.alert('Error', 'No se pudieron guardar los horarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <HeaderAuth />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Horarios Disponibles</Text>
          <Text style={styles.subtitle}>Configura tus horarios de disponibilidad</Text>
        </View>

        <ScrollView>
          {days.map((day, dayIndex) => (
            <View key={dayIndex} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.name}</Text>
                <Switch
                  trackColor={{ false: '#E5E7EB', true: '#3A557C' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                  onValueChange={() => toggleDay(dayIndex)}
                  value={day.active}
                />
              </View>

              {day.active && (
                <View>
                  <Text style={styles.sectionTitle}>Horarios sugeridos:</Text>
                  <View style={styles.defaultSlotsContainer}>
                    <TouchableOpacity
                      style={[styles.defaultSlot, day.defaultMorning && styles.activeDefaultSlot]}
                      onPress={() => toggleDefaultSlot(dayIndex, 'morning')}
                    >
                      <Text style={[styles.defaultSlotText, day.defaultMorning && styles.activeDefaultSlotText]}>
                        7:00 - 7:30 AM
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.defaultSlot, day.defaultAfternoon && styles.activeDefaultSlot]}
                      onPress={() => toggleDefaultSlot(dayIndex, 'afternoon')}
                    >
                      <Text style={[styles.defaultSlotText, day.defaultAfternoon && styles.activeDefaultSlotText]}>
                        2:00 - 2:30 PM
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionTitle}>Horarios personalizados:</Text>
                  
                  {day.slots.map((slot, slotIndex) => (
                    <View key={slotIndex} style={styles.customSlotContainer}>
                      <TextInput
                        style={[
                          styles.timeInput,
                          !validateTimeFormat(slot.start) && styles.invalidInput
                        ]}
                        value={slot.start}
                        onChangeText={(text) => updateCustomTimeSlot(dayIndex, slotIndex, 'start', text)}
                        placeholder="HH:MM"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                      <Text style={styles.timeSeparator}>a</Text>
                      <TextInput
                        style={[
                          styles.timeInput,
                          !validateTimeFormat(slot.end) && styles.invalidInput
                        ]}
                        value={slot.end}
                        onChangeText={(text) => updateCustomTimeSlot(dayIndex, slotIndex, 'end', text)}
                        placeholder="HH:MM"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                      
                      <View style={styles.slotActions}>
                        {slot.isNew && (
                          <TouchableOpacity
                            style={[styles.slotButton, styles.confirmButton]}
                            onPress={() => confirmCustomTimeSlot(dayIndex, slotIndex)}
                            disabled={!validateTimeFormat(slot.start) || !validateTimeFormat(slot.end)}
                          >
                            <Text style={styles.buttonText}>Aceptar</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.slotButton, styles.deleteButton]}
                          onPress={() => removeCustomTimeSlot(dayIndex, slotIndex)}
                        >
                          <Text style={styles.buttonText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addCustomTimeSlot(dayIndex)}
                  >
                    <Ionicons name="add" size={18} color="#3A557C" />
                    <Text style={styles.addButtonText}>Agregar horario personalizado</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleGoBack}
            >
              <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, styles.primaryButton]}
              onPress={guardarHorarios}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Guardando...' : 'Guardar Horarios'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  content: { 
    flex: 1, 
    padding: 16 
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A557C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  dayContainer: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  defaultSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  defaultSlot: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  activeDefaultSlot: {
    backgroundColor: '#3A557C',
  },
  defaultSlotText: {
    fontWeight: '500',
    color: '#374151',
  },
  activeDefaultSlotText: {
    color: 'white',
  },
  customSlotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 8,
    borderRadius: 8,
    width: 80,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  invalidInput: {
    borderColor: '#EF4444',
  },
  timeSeparator: {
    marginHorizontal: 8,
    color: '#6B7280',
  },
  slotActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  slotButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#3A557C',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: {
    color: '#3A557C',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3A557C',
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
});