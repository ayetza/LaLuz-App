// app/tutor/Retroalimentacion.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  background: '#FFFFFF',
  text: '#1A1A1A',
  border: '#E5E7EB',
  light: '#F3F4F6',
  success: '#10B981',
};

export default function Retroalimentacion() {
  const { citaId } = useLocalSearchParams();
  const router = useRouter();
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarComentario = async () => {
      try {
        const citaRef = doc(db, 'citas', citaId as string);
        const citaSnap = await getDoc(citaRef);
        if (citaSnap.exists()) {
          const data = citaSnap.data();
          setComentario(data.retroalimentacion || '');
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la retroalimentación');
      } finally {
        setLoading(false);
      }
    };
    if (citaId) cargarComentario();
  }, [citaId]);

  const guardarRetroalimentacion = async () => {
    try {
      const citaRef = doc(db, 'citas', citaId as string);
      await updateDoc(citaRef, { retroalimentacion: comentario });
      Alert.alert('Listo', 'Retroalimentación guardada con éxito');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la retroalimentación');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Retroalimentación de la Cita</Text>
      <Text style={styles.subtitle}>Escribe tus comentarios sobre la sesión con el profesor.</Text>

      <TextInput
        style={styles.textArea}
        multiline
        placeholder="Escribe tu retroalimentación aquí..."
        value={comentario}
        onChangeText={setComentario}
      />

      <TouchableOpacity style={styles.button} onPress={guardarRetroalimentacion} disabled={loading}>
        <Ionicons name="save" size={20} color="#fff" />
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 5,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.light,
    padding: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.text,
  },
  button: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
