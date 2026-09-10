import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import ChatScreen from './src/screens/ChatScreen.jsx';
import { useAppStore } from './src/store/useAppStore.js';

const Stack = createNativeStackNavigator();

export default function App() {
  const hydrate = useAppStore((state) => state.hydrate);

  // Phase 2 mở thẳng Chat để kiểm chứng chat/memory/evolution points; gate onboarded thuộc Phase 3.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Chat" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Chat" component={ChatScreen} />
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
