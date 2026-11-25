import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin ứng dụng</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
                <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.appName}>Smart Parking Hub</Text>
            <Text style={styles.appVersion}>Phiên bản 4.0.0 · Vận hành</Text>
        </View>

        <View style={styles.infoSection}>
            <Text style={styles.description}>
                Ứng dụng quản lý bãi đỗ, vé điện tử, thu tiền mặt tại quầy và lịch sử giao dịch qua Firebase. Nhân viên xác nhận xe và tiền thực tế.
            </Text>
        </View>

        <Text style={styles.description}>Chưa tích hợp cảm biến, nhận diện biển số, barrier tự động hoặc cổng thanh toán ngân hàng.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutLink({ title, isLast }) {
    return (
        <TouchableOpacity style={[styles.linkItem, isLast && { borderBottomWidth: 0 }]}>
            <Text style={styles.linkText}>{title}</Text>
            <Ionicons name="arrow-forward-circle-outline" size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  content: { alignItems: 'center', padding: 25 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoIcon: { width: 90, height: 90, backgroundColor: '#1E3A8A', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowRadius: 10 },
  logoText: { color: '#FFF', fontSize: 50, fontWeight: '900' },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 15 },
  appVersion: { fontSize: 13, color: '#94A3B8', marginTop: 5 },
  infoSection: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 25, elevation: 2 },
  description: { textAlign: 'center', color: '#475569', lineHeight: 22, fontSize: 14 },
  menuBox: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 15, elevation: 2 },
  linkItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  linkText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  footerText: { marginTop: 40, color: '#CBD5E1', fontSize: 12 }
});
