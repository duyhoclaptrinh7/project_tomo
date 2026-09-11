import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import ChatScreen from './src/screens/ChatScreen.jsx';
import OnboardingScreen from './src/screens/OnboardingScreen.jsx';
import SettingsScreen from './src/screens/SettingsScreen.jsx';
import { useAppStore } from './src/store/useAppStore.js';

const Stack = createNativeStackNavigator();

const transparentNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

export default function App(props) {
  const isOverlayMode = Boolean(props?.isOverlayMode);
  const onboarded = useAppStore((state) => state.onboarded);
  const isHydrated = useAppStore((state) => state.isHydrated);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View style={[styles.loadingContainer, isOverlayMode && styles.transparentBg]}>
        <ActivityIndicator size="large" color="#6b5cff" />
      </View>
    );
  }

  // Khi ở chế độ Overlay và đã hoàn tất Onboarding:
  // Render trực tiếp ChatScreen trên nền trong suốt hoàn toàn, không qua NavigationContainer
  // để tránh React Navigation và Native Stack Screen tạo nền trắng đục che mất app bên dưới
  if (isOverlayMode && onboarded) {
    return (
      <View style={styles.overlayRootContainer}>
        <ChatScreen route={{ params: { isOverlay: true } }} />
        <StatusBar style="light" />
      </View>
    );
  }

  // Màn hình khởi đầu: Nếu đã hoàn tất Onboarding thì vào thẳng Chat, ngược lại vào Onboarding
  const initialRouteName = onboarded ? 'Chat' : 'Onboarding';

  return (
    <View style={[styles.container, isOverlayMode && styles.transparentBg]}>
      <NavigationContainer theme={isOverlayMode ? transparentNavTheme : DefaultTheme}>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: isOverlayMode ? 'transparent' : '#fbfbff',
            },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            initialParams={{ isOverlay: isOverlayMode }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbff',
  },
  overlayRootContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fbfbff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
