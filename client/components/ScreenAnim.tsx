import React, { useCallback } from 'react';
import { Dimensions, ViewStyle, StyleProp } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  Easing 
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  direction?: 'down' | 'up';
  distance?: number;
}

export function ScreenAnim({ children, delay = 0, style, direction = 'down', distance = height }: Props) {
  const initialOffset = direction === 'down' ? -distance : distance;
  
  const translateY = useSharedValue(initialOffset);
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // Reset state instantly when focus starts
      translateY.value = initialOffset;
      opacity.value = 0;
      
      // Animate to final position
      translateY.value = withDelay(delay, withSpring(0, {
        mass: 0.8,
        damping: 14,
        stiffness: 90,
        overshootClamping: false,
      }));
      opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));

      return () => {
        // Reset state instantly on blur to ensure it re-animates every time
        translateY.value = initialOffset;
        opacity.value = 0;
      };
    }, [delay, initialOffset])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
