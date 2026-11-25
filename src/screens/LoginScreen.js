import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, resetPassword } = useContext(AuthContext);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ Email và Mật khẩu");
      return;
    }
    setLoading(true);
    triggerHaptic();
    const res = await signIn({ email, password });
    setLoading(false);
    if (!res.ok) {
      Alert.alert("Đăng nhập thất bại", res.error);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Quên mật khẩu", "Vui lòng nhập email của bạn vào ô trống phía trên trước.");
      return;
    }
    Alert.alert(
      "Khôi phục mật khẩu",
      `Gửi mã khôi phục đến email: ${email}?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Gửi ngay", onPress: async () => {
            const res = await resetPassword(email);
            if (res.ok) Alert.alert("Thành công", "Vui lòng kiểm tra hộp thư đến để đặt lại mật khẩu.");
            else Alert.alert("Lỗi", res.error);
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>P</Text>
              </View>
              <Text style={styles.title}>Smart Parking</Text>
              <Text style={styles.subtitle}>Hệ thống quản lý bãi đỗ xe thông minh</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.forgotPass} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signupText}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, justifyContent: 'center', paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 80, height: 80, backgroundColor: '#DBEAFE', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  logoText: { fontSize: 50, fontWeight: '900', color: '#1E3A8A' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, fontSize: 16, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#1E3A8A', fontWeight: '600' },
  button: { backgroundColor: '#1E3A8A', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25, paddingBottom: 20 },
  footerText: { color: '#6B7280' },
  signupText: { color: '#1E3A8A', fontWeight: 'bold' }
});
