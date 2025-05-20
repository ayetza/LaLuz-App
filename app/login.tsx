// app/login.tsx
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import HeaderFM from '../components/HeaderFM';
import { auth, db } from '../lib/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setWarning('');

    if (!email || !password) {
      setWarning('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (!validateEmail(email)) {
      setWarning('Correo inválido.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(docRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const rol = data.rol;

          if (rol === 'tutor') {
            router.replace('/tutor/TutorHome');
          } else if (rol === 'admin') {
            router.replace('/admin/AdminHome');
          } else if (rol === 'maestro') {
            router.replace('/maestro/MaestroHome');
          } else {
            setWarning('Rol de usuario desconocido.');
          }
        } else {
          setWarning('No se encontró el perfil de usuario en la base de datos.');
        }
      }
    } catch (error: any) {
      const code = error.code;

      if (code === 'auth/invalid-email') {
        setWarning('Correo inválido.');
      } else if (code === 'auth/wrong-password') {
        setWarning('Contraseña incorrecta.');
      } else if (code === 'auth/user-not-found') {
        setWarning('Usuario no encontrado.');
      } else {
        setWarning('Algo salió mal.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderFM />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="lock" size={40} color="#3A557C" style={styles.logoIcon} />
        </View>

        <Text style={styles.title}>Bienvenido de vuelta</Text>
        <Text style={styles.subtitle}>Ingresa tus credenciales para continuar</Text>

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
              style={[styles.input, { paddingRight: 50 }]}
              placeholder="********"
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
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push('/forgot-password')}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {warning !== '' && <Text style={styles.warning}>{warning}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#3A557C" />
        ) : (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Ingresar</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes usuario?</Text>
              <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Crear Usuario</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end', 
    marginBottom: 20
  },
  forgotPasswordText: {
    color: '#3A557C', 
    fontSize: 14, 
    fontWeight: '500'
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