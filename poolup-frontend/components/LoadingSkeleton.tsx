import React from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

interface LoadingSkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ width = '100%', height = 20, borderRadius = 4, style = {} }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e9ecef', '#f8f9fa'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const PoolCardSkeleton = () => (
  <View style={{
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
    borderRadius: radius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <LoadingSkeleton width="60%" height={20} borderRadius={4} />
      <LoadingSkeleton width="25%" height={16} borderRadius={8} />
    </View>
    <LoadingSkeleton width="100%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <LoadingSkeleton width="40%" height={14} borderRadius={4} />
      <LoadingSkeleton width="20%" height={14} borderRadius={4} />
    </View>
  </View>
);

export const ActivityCardSkeleton = () => (
  <View style={{
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <LoadingSkeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <LoadingSkeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
        <LoadingSkeleton width="30%" height={12} borderRadius={4} />
      </View>
      <LoadingSkeleton width={32} height={32} borderRadius={16} />
    </View>
    <LoadingSkeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <LoadingSkeleton width="50%" height={12} borderRadius={6} />
  </View>
);

export default LoadingSkeleton;
