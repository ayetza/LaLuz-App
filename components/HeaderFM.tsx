import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function HeaderFM() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Escuela La Luz</Text>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="help-circle" size={24} color="white" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* 🌟 Modal con información */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Información de la App</Text>
            <Text style={styles.modalText}>
              Esta aplicación fue desarrollada para apoyar la comunicación entre
              padres y docentes de la Escuela La Luz, ubicada en Guadalajara,
              Jalisco. Aquí podrás gestionar citas, recibir notificaciones y
              mantenerte al tanto del progreso académico de tus hijos.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3A557C',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    height: 140,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    position: 'relative',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  appName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  iconContainer: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 70,
    padding: 8,
  },
  icon: {
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    padding: 25,
    borderRadius: 12,
    elevation: 6,
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3A557C',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'justify',
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#3A557C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
