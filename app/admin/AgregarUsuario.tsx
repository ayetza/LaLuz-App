import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';
import HeaderFM from '../../components/HeaderFM';
import { auth, db } from '../../lib/firebase';

const COLORS = {
  primary: '#3A557C',
  secondary: '#2A4D8F',
  light: '#E5E7EB',
  background: '#F8FAFF',
  text: '#1A1A1A',
  border: '#D1D5DB',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
  inactive: '#9CA3AF',
};

interface Hijo {
  id: string;
  nombre: string;
  grado: string;
}

export default function AgregarUsuarioScreen() {
  const router = useRouter();
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [emailLocal, setEmailLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'maestro' | 'tutor'>('maestro');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Campos para maestro
  const [gradoAsignado, setGradoAsignado] = useState('');
  
  // Campos para tutor
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [nuevoHijo, setNuevoHijo] = useState({ nombre: '', grado: '' });

  // Generar email completo automáticamente
  useEffect(() => {
    if (emailLocal) {
      const domain = userType === 'maestro' 
        ? '.maestro@laluz.mx' 
        : '.tutor@laluz.mx';
      setEmail(`${emailLocal}${domain}`);
    } else {
      setEmail('');
    }
  }, [emailLocal, userType]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
    
    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  // Agregar nuevo hijo
  const agregarHijo = () => {
    if (!nuevoHijo.nombre.trim() || !nuevoHijo.grado.trim()) {
      setWarning('Por favor completa el nombre y grado del hijo');
      return;
    }
    
    setHijos([...hijos, { 
      id: `nuevo-${Date.now()}`, 
      nombre: nuevoHijo.nombre, 
      grado: nuevoHijo.grado 
    }]);
    
    setNuevoHijo({ nombre: '', grado: '' });
    setWarning('');
  };

  // Actualizar hijo existente
  const actualizarHijo = (id: string, campo: keyof Hijo, valor: string) => {
    setHijos(hijos.map(hijo => 
      hijo.id === id ? { ...hijo, [campo]: valor } : hijo
    ));
  };

  // Eliminar hijo
  const eliminarHijo = (id: string) => {
    setHijos(hijos.filter(hijo => hijo.id !== id));
  };

  // Función para obtener el siguiente ID único
  const obtenerSiguienteID = async (tipo: 'maestro' | 'tutor'): Promise<string> => {
    const prefix = tipo === 'maestro' ? 'PROF' : 'TUT0';
    
    try {
      // Consultamos la colección de usuarios filtrando por rol y ordenando por idUnico descendente
      const lastUserSnapshot = await db.collection('users')
        .where('rol', '==', tipo)
        .orderBy('idUnico', 'desc')
        .limit(1)
        .get();
      
      let nextNumber = 1;
      if (!lastUserSnapshot.empty) {
        const lastID = lastUserSnapshot.docs[0].data().idUnico;
        // Extraemos el número del último ID
        const lastNumber = parseInt(lastID.replace(prefix, ''));
        // Si es un número válido, incrementamos; si no, empezamos en 1
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      if (tipo === 'tutor' && nextNumber < 10) {
        return `${prefix}${nextNumber}`;
      }
      
      return `${prefix}${nextNumber}`;
    } catch (error) {
      console.error('Error al obtener el siguiente ID:', error);
      // En caso de error, generamos un ID con timestamp para asegurar unicidad
      return `${prefix}${Date.now()}`;
    }
  };

  const handleRegistrarUsuario = async () => {
    setWarning('');

    // Validaciones básicas
    if (!nombreCompleto || !email || !password) {
      setWarning('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!validateEmail(email)) {
      setWarning('Ingresa un correo electrónico válido.');
      return;
    }

    if (!validatePassword(password)) {
      setWarning('La contraseña debe tener al menos 12 caracteres, incluyendo una mayúscula, un número y un símbolo.');
      return;
    }

    // Validaciones específicas por tipo de usuario
    if (userType === 'maestro' && !gradoAsignado.trim()) {
      setWarning('Por favor ingresa el grado asignado para el maestro.');
      return;
    }

    if (userType === 'tutor' && hijos.length === 0) {
      setWarning('Por favor agrega al menos un hijo para el tutor.');
      return;
    }

    setLoading(true);

    try {
      // Generar ID único secuencial
      const idUnico = await obtenerSiguienteID(userType);
      
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        // Datos base del usuario
        const userData: any = {
          nombreCompleto,
          correo: email,
          fechaRegistro: new Date().toISOString(),
          rol: userType,
          estado: 'activo',
          emailVerified: true,
          idUnico,   // ID único generado
          citas: 0,          // Inicializar citas en 0
        };

        // Agregar datos específicos
        if (userType === 'maestro') {
          userData.gradoAsignado = gradoAsignado.trim();
        }

        // Guardar usuario en Firestore
        const userRef = db.collection('users').doc(user.uid);
        await userRef.set(userData);

        // Si es tutor, guardar hijos en subcolección
        if (userType === 'tutor' && hijos.length > 0) {
          const batch = db.batch();
          hijos.forEach(hijo => {
            const hijoRef = userRef.collection('hijos').doc();
            batch.set(hijoRef, {
              nombre: hijo.nombre,
              grado: hijo.grado
            });
          });
          await batch.commit();
        }

        Alert.alert(
          '¡Usuario creado exitosamente!', 
          `La cuenta para ${nombreCompleto} ha sido creada como ${userType === 'maestro' ? 'maestro' : 'tutor'} con ID: ${idUnico}.`,
          [{ 
            text: 'OK', 
            onPress: () => router.replace({
              pathname: '/admin/Herramientas',
              params: { refresh: Date.now() } // Cambiamos a replace y pasamos parámetro refresh
            })
          }]
        );
      }
    } catch (error: any) {
      const code = error.code;
      if (code === 'auth/email-already-in-use') {
        setWarning('El correo ya está en uso por otro usuario.');
      } else if (code === 'auth/invalid-email') {
        setWarning('Correo electrónico inválido.');
      } else {
        setWarning('Error al crear el usuario: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeaderFM />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>Regresar</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Agregar Nuevo Usuario</Text>
          <Text style={styles.subtitle}>Completa el formulario para registrar un nuevo usuario</Text>
        </View>

        {/* Campos del formulario */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre y apellidos"
            placeholderTextColor="#9CA3AF"
            value={nombreCompleto}
            onChangeText={setNombreCompleto}
          />
        </View>

        {/* Selector de tipo de usuario (toggle) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de usuario *</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton, 
                userType === 'maestro' && styles.toggleButtonActive
              ]}
              onPress={() => setUserType('maestro')}
            >
              <Text style={[
                styles.toggleButtonText,
                userType === 'maestro' && styles.toggleButtonTextActive
              ]}>
                Maestro
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton, 
                userType === 'tutor' && styles.toggleButtonActive
              ]}
              onPress={() => setUserType('tutor')}
            >
              <Text style={[
                styles.toggleButtonText,
                userType === 'tutor' && styles.toggleButtonTextActive
              ]}>
                Tutor
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campo de correo modificado */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Correo electrónico *</Text>
          <View style={styles.emailContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="usuario"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailLocal}
              onChangeText={text => {
                const cleanedText = text.replace(/[@\s]/g, '');
                setEmailLocal(cleanedText);
              }}
            />
            <Text style={styles.emailDomain}>
              {userType === 'maestro' ? '.maestro@laluz.mx' : '.tutor@laluz.mx'}
            </Text>
          </View>
          <Text style={styles.emailFull}>{email}</Text>
        </View>

        {/* Campo para grado asignado (solo para maestros) */}
        {userType === 'maestro' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Grado asignado *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 6A"
              placeholderTextColor="#9CA3AF"
              value={gradoAsignado}
              onChangeText={setGradoAsignado}
            />
          </View>
        )}

        {/* Sección para hijos (solo para tutores) */}
        {userType === 'tutor' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hijos *</Text>
            
            {/* Lista de hijos existentes */}
            {hijos.map(hijo => (
              <View key={hijo.id} style={styles.hijoItem}>
                <TextInput
                  style={[styles.hijoInput, styles.hijoNombreInput]}
                  placeholder="Nombre del hijo"
                  placeholderTextColor="#9CA3AF"
                  value={hijo.nombre}
                  onChangeText={text => actualizarHijo(hijo.id, 'nombre', text)}
                />
                <TextInput
                  style={[styles.hijoInput, styles.hijoGradoInput]}
                  placeholder="Grado"
                  placeholderTextColor="#9CA3AF"
                  value={hijo.grado}
                  onChangeText={text => actualizarHijo(hijo.id, 'grado', text)}
                />
                <TouchableOpacity
                  style={styles.deleteHijoButton}
                  onPress={() => eliminarHijo(hijo.id)}
                >
                  <Icon name="trash-2" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Formulario para agregar nuevo hijo */}
            <View style={styles.nuevoHijoContainer}>
              <Text style={styles.sectionSubtitle}>Agregar nuevo hijo:</Text>
              <View style={styles.nuevoHijoInputs}>
                <TextInput
                  style={[styles.hijoInput, styles.hijoNombreInput]}
                  placeholder="Nombre del hijo"
                  placeholderTextColor="#9CA3AF"
                  value={nuevoHijo.nombre}
                  onChangeText={text => setNuevoHijo({...nuevoHijo, nombre: text})}
                />
                <TextInput
                  style={[styles.hijoInput, styles.hijoGradoInput]}
                  placeholder="Grado"
                  placeholderTextColor="#9CA3AF"
                  value={nuevoHijo.grado}
                  onChangeText={text => setNuevoHijo({...nuevoHijo, grado: text})}
                />
              </View>
              <TouchableOpacity
                style={styles.addHijoButton}
                onPress={agregarHijo}
              >
                <Icon name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.addHijoButtonText}>Agregar Hijo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, {paddingRight: 50}]}
              placeholder="Mínimo 12 caracteres con mayúsculas, números y símbolos"
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
          
          {/* Indicador de fortaleza de contraseña */}
          {password.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <Text style={styles.passwordStrengthText}>
                Fortaleza: 
                <Text style={[
                  styles.strengthIndicator, 
                  validatePassword(password) ? styles.strong : styles.weak
                ]}>
                  {validatePassword(password) ? ' Fuerte' : ' Débil'}
                </Text>
              </Text>
              
              <Text style={styles.passwordHint}>
                • 12+ caracteres
                {'\n'}
                • Al menos una letra mayúscula
                {'\n'}
                • Al menos un número
                {'\n'}
                • Al menos un símbolo (ej: !@#$)
              </Text>
            </View>
          )}
        </View>

        {warning !== '' && <Text style={styles.warning}>{warning}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegistrarUsuario}
            activeOpacity={0.7}
          >
            <Icon name="user-plus" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Registrar Usuario</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFF',
  },
  content: {
    padding: 25,
  },
  header: {
    marginBottom: 30,
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2A4D8F',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
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
  // Estilos para email
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  emailInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#111827',
  },
  emailDomain: {
    paddingHorizontal: 12,
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    height: '100%',
    textAlignVertical: 'center',
  },
  emailFull: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordStrengthContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  passwordStrengthText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  strengthIndicator: {
    fontWeight: '700',
  },
  strong: {
    color: '#10B981',
  },
  weak: {
    color: '#EF4444',
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
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
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
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
  // Toggle selector
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#3A557C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.inactive,
  },
  toggleButtonTextActive: {
    color: COLORS.primary,
  },
  // Estilos para hijos
  hijoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  hijoInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hijoNombreInput: {
    flex: 2,
  },
  hijoGradoInput: {
    flex: 1,
  },
  deleteHijoButton: {
    padding: 8,
  },
  nuevoHijoContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 10,
  },
  nuevoHijoInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addHijoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  addHijoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});