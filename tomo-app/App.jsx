import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import ChatScreen from './src/screens/ChatScreen.jsx';
import EvolutionScreen from './src/screens/EvolutionScreen.jsx';
import MemoryScreen from './src/screens/MemoryScreen.jsx';
import OnboardingScreen from './src/screens/OnboardingScreen.jsx';
import SettingsScreen from './src/screens/SettingsScreen.jsx';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Evolution" component={EvolutionScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Memory" component={MemoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
