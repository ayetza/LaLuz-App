// app/register.tsx
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
import { auth, db } from '../../lib/firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async () => {
    setWarning('');

    if (!email || !password) {
      setWarning('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (!validateEmail(email)) {
      setWarning('Ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      setWarning('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        await db.collection('users').doc(user.uid).set({
          correo: email,
          fechaRegistro: new Date().toISOString(),
          rol: 'usuario',
          estado: 'activo',
        });

        Alert.alert('¡Registro exitoso!', 'Tu cuenta ha sido creada.');
        router.replace('/login/login');
      }
    } catch (error: any) {
      const code = error.code;
      if (code === 'auth/email-already-in-use') {
        setWarning('El correo ya está en uso.');
      } else if (code === 'auth/invalid-email') {
        setWarning('Correo electrónico inválido.');
      } else if (code === 'permission-denied') {
        setWarning('Cuenta creada, pero no se pudo guardar en la base de datos.');
      } else {
        setWarning('Algo salió mal. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderFM />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Icon name="user-plus" size={40} color="#3A557C" style={styles.logoIcon}/>
        </View>
        
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Comienza tu experiencia con nosotros</Text>

        {/* Campos del formulario */}
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, {paddingRight: 50}]}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#4B5563"
              />
            </TouchableOpacity>
          </View>
        </View>

        {warning !== '' && <Text style={styles.warning}>{warning}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#3A557C" />
        ) : (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleRegister}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity 
                onPress={() => router.replace('/login/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLink}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 32,
    fontWeight: '800',
    color: '#2A4D8F',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 40,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 10
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
    marginBottom: 20,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warning: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#3A557C',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '400',
  },
  footerLink: {
    color: '#3A557C',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});