import 'react-native-gesture-handler';
import React, { useContext, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import các màn hình chức năng
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import StaffScreen from './src/screens/StaffScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfStack = createNativeStackNavigator();

// Cấu hình hiển thị thông báo ngay cả khi đang mở ứng dụng
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Luồng điều hướng riêng cho tab Cá nhân (Để truy cập được Cài đặt & Thông tin)
function ProfileNavigator() {
  return (
    <ProfStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfStack.Screen name="Settings" component={SettingsScreen} />
      <ProfStack.Screen name="About" component={AboutScreen} />
    </ProfStack.Navigator>
  );
}

function MainTabs() {
  const { staff } = useContext(AuthContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Trang chủ') iconName = focused ? 'car-sport' : 'car-sport-outline';
          else if (route.name === 'Lịch sử') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Vận hành') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'Cá nhân') iconName = focused ? 'person-circle' : 'person-circle-outline';

          return (
            <View style={focused ? styles.activeTabIconContainer : null}>
              <Ionicons name={iconName} size={focused ? size + 4 : size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Trang chủ" component={HomeScreen} />
      <Tab.Screen name="Lịch sử" component={HistoryScreen} />
      {staff && <Tab.Screen name="Vận hành" component={StaffScreen} />}
      <Tab.Screen name="Cá nhân" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (Platform.OS === "web") return;
    // Lắng nghe sự kiện thông báo đẩy
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Hệ thống nhận thông báo:", notification.request.content.title);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    // Lắng nghe tương tác người dùng với thông báo
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Người dùng nhấn vào thông báo");
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 75,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    paddingTop: 12,
    elevation: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    borderTopWidth: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activeTabIconContainer: {
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 20,
    marginTop: -10,
  }
});