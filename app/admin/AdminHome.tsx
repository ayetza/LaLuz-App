// app/admin/AdminHome.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

type AdminRoutes =
  | '/admin/AdminToolsMenu'
  | '/admin/CitasAgendadas' 
  | '/admin/CitasAnteriores'
  | '/admin/Buzon'
  | '/admin/Herramientas'
  | '/admin/Stats';

const COLORS = {
  primary: '#3A557C',
  secondary: '#8FC027',
  background: '#FFFFFF',
  text: '#1A1A1A',
  lightText: '#666666',
  border: '#E0E0E0',
  error: '#E74C3C'
};

const carouselImages = [
  require('../../assets/kids1.png'),
  require('../../assets/kids2.png'),
  require('../../assets/kids3.png'),
];

type OptionItem = {
  label: string;
  icon: string;
  route: AdminRoutes;
  description?: string;
};

const ADMIN_BASE_OPTIONS: OptionItem[] = [
  { 
    label: 'Contactar Usuario', 
    icon: 'message-square', 
    route: '/admin/AdminToolsMenu',
    description: 'Comunicación con maestros y tutores'
  },
  { 
    label: 'Citas', 
    icon: 'calendar', 
    route: '/admin/CitasAgendadas', 
    description: 'Administrar citas programadas'
  },
  { 
    label: 'Citas Anteriores', 
    icon: 'corner-up-left', 
    route: '/admin/CitasAnteriores',
    description: 'Historial de citas pasadas'
  },
  { 
    label: 'Buzón', 
    icon: 'mail', 
    route: '/admin/Buzon',
    description: 'Mensajes recibidos y enviados'
  },
];

const ADMIN_EXTRA_OPTIONS: OptionItem[] = [
  { 
    label: 'Herramientas de Admin', 
    icon: 'tool', 
    route: '/admin/Herramientas',
    description: 'Funciones avanzadas de administración'
  },
  { 
    label: 'Estadísticas', 
    icon: 'bar-chart-2', 
    route: '/admin/Stats',
    description: 'Reportes y métricas del sistema'
  },
];

const ALL_ADMIN_OPTIONS = [...ADMIN_BASE_OPTIONS, ...ADMIN_EXTRA_OPTIONS];

const OptionCard = ({ item, onPress }: { item: OptionItem; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.optionCard, styles.regularCard]}
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityLabel={`Botón ${item.label}`}
    accessibilityHint={`Navegar a ${item.label}`}
  >
    <Icon name={item.icon} size={28} color={COLORS.primary} />
    <Text style={styles.cardLabel}>{item.label}</Text>
    {item.description && (
      <Text style={styles.cardDescription}>{item.description}</Text>
    )}
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nombreUsuario, setNombreUsuario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const windowWidth = Dimensions.get('window').width;
  const currentDate = new Date();
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % carouselImages.length;
      scrollRef.current?.scrollTo({ x: nextIndex * windowWidth, animated: true });
      setActiveIndex(nextIndex);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeIndex, windowWidth]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    setActiveIndex(index);
  };

  const handleNavigation = (route: AdminRoutes) => {
    router.push(route);
  };

  useEffect(() => {
    const obtenerNombre = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          setError('Usuario no autenticado');
          setLoading(false);
          return;
        }
        
        const docRef = db.doc(`users/${user.uid}`);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const data = docSnap.data();
          const nombreCompleto = data?.nombreCompleto || '';
          
          const partes = nombreCompleto.trim().split(/\s+/);
          const nombreYApellido = partes.slice(0, 2).join(' ');
          setNombreUsuario(nombreYApellido);
        } else {
          setError('Perfil de usuario no encontrado');
        }
      } catch (err) {
        setError('Error al cargar datos del usuario');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    obtenerNombre();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando panel de administración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="Panel de Administración">
      <HeaderAuth />
      
      {/* Contenedor principal con ScrollView único */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Sección de bienvenida */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Bienvenido {nombreUsuario ?? 'Administrador'}
            </Text>
            <Text style={styles.subtitle}>Panel de Administración Escolar</Text>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        </View>

        {/* Carrusel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
            accessibilityLabel="Carrusel de imágenes"
          >
            {carouselImages.map((img, index) => (
              <View 
                key={index} 
                style={[styles.imageWrapper, { width: windowWidth - 32 }]}
                accessibilityLabel={`Imagen ${index + 1} de ${carouselImages.length}`}
              >
                <Image 
                  source={img} 
                  style={styles.kidsImage} 
                  resizeMode="cover" 
                  accessibilityIgnoresInvertColors
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.dateBadge} accessibilityLabel="Fecha actual">
            <Text style={styles.dateDay}>{currentDate.getDate()}</Text>
            <Text style={styles.dateMonth}>
              {monthNames[currentDate.getMonth()].substring(0, 3)}
            </Text>
          </View>

          <View style={styles.pagination}>
            {carouselImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index ? styles.dotActive : null,
                ]}
                accessibilityLabel={`Indicador ${index + 1} de ${carouselImages.length}`}
              />
            ))}
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Herramientas Disponibles</Text>
          <View style={styles.grid}>
            {ALL_ADMIN_OPTIONS.map((item, index) => (
              <OptionCard
                key={index}
                item={item}
                onPress={() => handleNavigation(item.route)}
              />
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              “La excelencia administrativa es el arte de hacer posible lo necesario.” 
            </Text>
          </View>
        </View>
        
        {/* Footer dentro del ScrollView */}
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30, // Espacio para que no quede pegado al final
  },
  welcomeSection: { 
    marginTop: 20, 
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  welcomeContainer: { marginLeft: 8 },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: { 
    fontSize: 16, 
    color: COLORS.lightText, 
    fontWeight: '400'
  },
  errorText: {
    color: COLORS.error,
    marginTop: 8,
    fontSize: 14
  },
  carouselContainer: { 
    height: 190, 
    marginBottom: 24, 
    position: 'relative',
    paddingHorizontal: 16,
  },
  carousel: { borderRadius: 12, overflow: 'hidden' },
  imageWrapper: {
    height: 180,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  kidsImage: { width: '100%', height: '100%' },
  dateBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateDay: { fontSize: 24, fontWeight: '300', color: COLORS.primary },
  dateMonth: { fontSize: 14, color: COLORS.lightText, marginTop: -4 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -12,
    width: '100%',
  },
  dot: {
    height: 8,
    width: 8,
    backgroundColor: '#ccc',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: COLORS.primary },
  optionsContainer: { 
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
    marginTop: 8,
    width: '100%'
  },
  regularCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionCard: {},
  cardLabel: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600'
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.lightText,
    textAlign: 'center',
    marginTop: 4
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.primary,
    fontSize: 16
  }
});
