// app/forgot-password.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import HeaderFM from '../../components/HeaderFM';
import { auth } from '../../lib/firebase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleResetPassword = async () => {
    setWarning('');
    setSuccess('');

    if (!email) {
      setWarning('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!validateEmail(email)) {
      setWarning('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);

    try {
      await auth.sendPasswordResetEmail(email);
      setSuccess(`Se ha enviado un enlace de recuperación a ${email}`);
      Alert.alert(
        'Correo enviado',
        'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const code = error.code;
      if (code === 'auth/user-not-found') {
        setWarning('No existe una cuenta con este correo.');
      } else {
        setWarning('Ocurrió un error. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderFM />

      <View style={styles.content}>
        {/* Logo o icono */}
        <View style={styles.logoContainer}>
          <Icon name="key" size={40} color="#3A557C" style={styles.logoIcon}/>
        </View>
        
        <Text style={styles.title}>Recuperar Contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo electrónico para recibir instrucciones
        </Text>

        {/* Campo de correo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Mensajes */}
        {warning !== '' && <Text style={styles.warning}>{warning}</Text>}
        {success !== '' && <Text style={styles.success}>{success}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#3A557C" />
        ) : (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleResetPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Enviar enlace</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center', 
    marginBottom: 30
  },
  logoIcon: {
    marginBottom: 10
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2A4D8F',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 40,
    fontWeight: '500',
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#374151',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  warning: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  success: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#3A557C',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3A557C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  backButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#3A557C',
    fontWeight: '600',
    fontSize: 15,
  },
});