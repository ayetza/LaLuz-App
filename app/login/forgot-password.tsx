// app/forgot-password.tsx
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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

const COOLDOWN_TIME = 5 * 60 * 1000;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (cooldown > 0) {
      setIsButtonDisabled(true);
      interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1000) {
            setIsButtonDisabled(false);
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleResetPassword = async () => {
    setWarning('');

    if (!email) {
      setWarning('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!validateEmail(email)) {
      setWarning('Ingresa un correo electrónico válido.');
      return;
    }

    if (isButtonDisabled) return;

    setLoading(true);
    // Activar cooldown inmediatamente al presionar el botón
    setCooldown(COOLDOWN_TIME);

    try {
      // Verificar si el correo está registrado
      const methods = await auth.fetchSignInMethodsForEmail(email);
      
      if (methods.length === 0) {
        // Mensaje genérico para no revelar información
        setWarning('Recibirás un enlace de recuperación.');
        return;
      }

      // Si está registrado, enviar el correo de restablecimiento
      await auth.sendPasswordResetEmail(email);
      
      Alert.alert(
        '¡Correo enviado!',
        'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const code = error.code;
      if (code === 'auth/invalid-email') {
        setWarning('El formato del correo es inválido');
      } else {
        setWarning('Ocurrió un error. Intenta más tarde.');
        console.error("Error en restablecimiento:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <HeaderFM />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="key" size={40} color="#3A557C" style={styles.logoIcon}/>
        </View>
        
        <Text style={styles.title}>Recuperar Contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo electrónico para recibir instrucciones
        </Text>

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
            editable={!isButtonDisabled} // Deshabilitar campo durante cooldown
          />
        </View>

        {warning !== '' && <Text style={styles.warning}>{warning}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#3A557C" />
        ) : (
          <>
            <TouchableOpacity 
              style={[
                styles.button, 
                (isButtonDisabled || loading) && styles.disabledButton
              ]} 
              onPress={handleResetPassword}
              activeOpacity={isButtonDisabled ? 1 : 0.7} // Eliminar efecto de opacidad cuando está deshabilitado
              disabled={isButtonDisabled || loading} // Deshabilitar completamente el botón
            >
              <Text style={[
                styles.buttonText,
                isButtonDisabled && styles.disabledButtonText
              ]}>
                {isButtonDisabled 
                  ? `Espera ${formatTime(cooldown)}` 
                  : 'Enviar enlace'}
              </Text>
            </TouchableOpacity>

            {/* Botón de volver SIN deshabilitar durante cooldown */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>
                Volver al inicio de sesión
              </Text>
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
  disabledButton: {
    backgroundColor: '#cccccc',
    shadowColor: '#cccccc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: '#666666',
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