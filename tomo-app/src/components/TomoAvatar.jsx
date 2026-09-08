import { Text } from 'react-native';

export default function TomoAvatar({ animationState = 'idle' }) {
  return <Text>Tomo: {animationState}</Text>;
}
