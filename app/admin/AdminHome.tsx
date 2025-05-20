// app/admin/AdminHome.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Footer from '../../components/Footer';
import HeaderAuth from '../../components/HeaderAuth';
import { auth, db } from '../../lib/firebase';

type AdminRoutes =
  | '/admin/Herramientas'
  | '/admin/AccesoTutor';

const COLORS = {
  primary: '#3A557C',
  background: '#FFFFFF',
  lightText: '#666666',
  border: '#E0E0E0',
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
};

const ADMIN_OPTIONS: OptionItem[] = [
  { label: 'Herramientas de Administrador', icon: 'calendar', route: '/admin/Herramientas' },
  { label: 'Acceso de Tutor', icon: 'moon', route: '/admin/AccesoTutor' },
];

const OptionCard = ({ item, onPress }: { item: OptionItem; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.optionCard, styles.regularCard]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Icon name={item.icon} size={32} color={COLORS.primary} />
    <Text style={styles.cardLabel}>{item.label}</Text>
  </TouchableOpacity>
);

export default function AdminHome() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nombreUsuario, setNombreUsuario] = useState<string | null>(null);
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    const obtenerNombre = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = db.doc(`users/${user.uid}`);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const data = docSnap.data();
          const nombreCompleto = data?.nombreCompleto || '';
          const partes = nombreCompleto.trim().split(' ');
          const nombreYApellido = partes.slice(0, 2).join(' ');
          setNombreUsuario(nombreYApellido);
        }
      }
    };

    obtenerNombre();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % carouselImages.length;
      scrollRef.current?.scrollTo({ x: nextIndex * windowWidth, animated: true });
      setActiveIndex(nextIndex);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, windowWidth]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    setActiveIndex(index);
  };

  const handleNavigation = (route: AdminRoutes) => {
    router.push(route);
  };

  const currentDate = new Date();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  return (
    <View style={styles.container}>
      <HeaderAuth />

      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Hola de Nuevo {nombreUsuario ?? ''}
            </Text>
            <Text style={styles.subtitle}>Panel de administración</Text>
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
          >
            {carouselImages.map((img, index) => (
              <View key={index} style={[styles.imageWrapper, { width: windowWidth - 32 }]}>
                <Image source={img} style={styles.kidsImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>

          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{currentDate.getDate()}</Text>
            <Text style={styles.dateMonth}>{monthNames[currentDate.getMonth()].substring(0, 3)}</Text>
          </View>

          <View style={styles.pagination}>
            {carouselImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {ADMIN_OPTIONS.map((item, index) => (
              <OptionCard
                key={index}
                item={item}
                onPress={() => handleNavigation(item.route)}
              />
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              “Un buen administrador inspira confianza y guía con el ejemplo.” – Anónimo
            </Text>
          </View>

          <Footer />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 16 },
  welcomeSection: { marginTop: 20, marginBottom: 16 },
  welcomeContainer: { marginLeft: 8 },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 16, color: COLORS.lightText, fontWeight: '300' },
  carouselContainer: { height: 190, marginBottom: 24, position: 'relative' },
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
  optionsContainer: { paddingBottom: 40 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  regularCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 20,
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
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});
