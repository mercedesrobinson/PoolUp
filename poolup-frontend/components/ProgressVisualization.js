import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const THEME_CONFIGS = {
  beach_vacation: {
    colors: ['#4ECDC4', '#44A08D'],
    component: BeachVisualization
  },
  house_fund: {
    colors: ['#8B4513', '#D2691E'],
    component: HouseVisualization
  },
  travel_adventure: {
    colors: ['#FF6B6B', '#4ECDC4'],
    component: SuitcaseVisualization
  },
  emergency_fund: {
    colors: ['#6C5CE7', '#A29BFE'],
    component: FortressVisualization
  },
  roadmap_journey: {
    colors: ['#00B894', '#00CEC9'],
    component: RoadmapVisualization
  },
  concert_tickets: {
    colors: ['#E17055', '#FDCB6E'],
    component: ConcertVisualization
  }
};

// Beach Vacation - Water fills up the beach
function BeachVisualization({ progress, isAnimating }) {
  const waveAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isAnimating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnimation, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(waveAnimation, { toValue: 0, duration: 2000, useNativeDriver: true })
        ])
      ).start();
    }
  }, [isAnimating]);

  const waterHeight = progress * 60; // Max 60% of container
  
  return (
    <View style={styles.visualContainer}>
      <Svg width="100%" height="200" viewBox="0 0 300 200">
        {/* Beach background */}
        <Rect x="0" y="120" width="300" height="80" fill="#F4D03F" />
        
        {/* Palm tree */}
        <Rect x="250" y="80" width="8" height="40" fill="#8B4513" />
        <Circle cx="254" cy="75" r="15" fill="#27AE60" />
        
        {/* Water that fills up */}
        <Rect 
          x="0" 
          y={200 - waterHeight} 
          width="300" 
          height={waterHeight} 
          fill="#4ECDC4" 
          opacity="0.8"
        />
        
        {/* Waves animation */}
        <Animated.View style={{ transform: [{ translateY: waveAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5]
        })}] }}>
          <Path 
            d={`M0,${200 - waterHeight} Q75,${200 - waterHeight - 10} 150,${200 - waterHeight} T300,${200 - waterHeight}`}
            stroke="#44A08D" 
            strokeWidth="2" 
            fill="none"
          />
        </Animated.View>
      </Svg>
      
      <Text style={styles.progressText}>
        🌊 {Math.round(progress * 100)}% to paradise!
      </Text>
    </View>
  );
}

// House Fund - House gets built brick by brick
function HouseVisualization({ progress }) {
  const houseStages = [
    { threshold: 0.25, element: 'foundation' },
    { threshold: 0.5, element: 'walls' },
    { threshold: 0.75, element: 'roof' },
    { threshold: 1.0, element: 'details' }
  ];
  
  return (
    <View style={styles.visualContainer}>
      <Svg width="100%" height="200" viewBox="0 0 300 200">
        {/* Foundation */}
        {progress >= 0.25 && (
          <Rect x="50" y="160" width="200" height="20" fill="#8B4513" />
        )}
        
        {/* Walls */}
        {progress >= 0.5 && (
          <>
            <Rect x="60" y="100" width="180" height="60" fill="#D2691E" />
            <Rect x="100" y="120" width="30" height="40" fill="#654321" />
          </>
        )}
        
        {/* Roof */}
        {progress >= 0.75 && (
          <Polygon points="50,100 150,50 250,100" fill="#8B0000" />
        )}
        
        {/* Details */}
        {progress >= 1.0 && (
          <>
            <Rect x="200" y="120" width="20" height="20" fill="#87CEEB" />
            <Circle cx="115" cy="140" r="2" fill="#FFD700" />
          </>
        )}
      </Svg>
      
      <Text style={styles.progressText}>
        🏠 {Math.round(progress * 100)}% built!
      </Text>
    </View>
  );
}

// Travel Adventure - Suitcase gets packed
function SuitcaseVisualization({ progress }) {
  const items = [
    { x: 80, y: 120, emoji: '👕', threshold: 0.2 },
    { x: 120, y: 110, emoji: '👖', threshold: 0.4 },
    { x: 160, y: 125, emoji: '👟', threshold: 0.6 },
    { x: 200, y: 115, emoji: '📱', threshold: 0.8 },
    { x: 140, y: 140, emoji: '🕶️', threshold: 1.0 }
  ];
  
  return (
    <View style={styles.visualContainer}>
      <Svg width="100%" height="200" viewBox="0 0 300 200">
        {/* Suitcase */}
        <Rect x="60" y="100" width="180" height="80" fill="#8B4513" stroke="#654321" strokeWidth="3" rx="10" />
        <Rect x="70" y="110" width="160" height="60" fill="#D2691E" />
        
        {/* Handle */}
        <Rect x="130" y="85" width="40" height="8" fill="#654321" rx="4" />
        
        {/* Items that appear as progress increases */}
        {items.map((item, index) => 
          progress >= item.threshold && (
            <text key={index} x={item.x} y={item.y} fontSize="16" textAnchor="middle">
              {item.emoji}
            </text>
          )
        )}
      </Svg>
      
      <Text style={styles.progressText}>
        ✈️ {Math.round(progress * 100)}% packed!
      </Text>
    </View>
  );
}

// Emergency Fund - Fortress/shield builds up
function FortressVisualization({ progress }) {
  return (
    <View style={styles.visualContainer}>
      <Svg width="100%" height="200" viewBox="0 0 300 200">
        {/* Base */}
        {progress >= 0.25 && (
          <Rect x="100" y="150" width="100" height="30" fill="#6C5CE7" />
        )}
        
        {/* Walls */}
        {progress >= 0.5 && (
          <Rect x="110" y="120" width="80" height="30" fill="#A29BFE" />
        )}
        
        {/* Tower */}
        {progress >= 0.75 && (
          <Rect x="130" y="90" width="40" height="30" fill="#6C5CE7" />
        )}
        
        {/* Shield */}
        {progress >= 1.0 && (
          <Path d="M150,70 L140,85 L150,100 L160,85 Z" fill="#FFD700" />
        )}
      </Svg>
      
      <Text style={styles.progressText}>
        🛡️ {Math.round(progress * 100)}% protected!
      </Text>
    </View>
  );
}

// Roadmap Journey - Duolingo-style path
function RoadmapVisualization({ progress }) {
  const pathPoints = [
    { x: 50, y: 180, milestone: 0.0 },
    { x: 100, y: 150, milestone: 0.25 },
    { x: 150, y: 120, milestone: 0.5 },
    { x: 200, y: 90, milestone: 0.75 },
    { x: 250, y: 60, milestone: 1.0 }
  ];
  
  return (
    <View style={styles.visualContainer}>
      <Svg width="100%" height="200" viewBox="0 0 300 200">
        {/* Path line */}
        <Path 
          d="M50,180 Q100,150 150,120 Q200,90 250,60" 
          stroke="#DDD" 
          strokeWidth="6" 
          fill="none"
        />
        
        {/* Progress line */}
        <Path 
          d="M50,180 Q100,150 150,120 Q200,90 250,60" 
          stroke="#00B894" 
          strokeWidth="6" 
          fill="none"
          strokeDasharray={`${progress * 200} 200`}
        />
        
        {/* Milestone circles */}
        {pathPoints.map((point, index) => (
          <Circle 
            key={index}
            cx={point.x} 
            cy={point.y} 
            r="12" 
            fill={progress >= point.milestone ? "#00B894" : "#DDD"}
            stroke="white"
            strokeWidth="3"
          />
        ))}
        
        {/* Flag at the end */}
        {progress >= 1.0 && (
          <Polygon points="250,45 270,50 270,65 250,60" fill="#E74C3C" />
        )}
      </Svg>
      
      <Text style={styles.progressText}>
        🗺️ {Math.round(progress * 100)}% of the journey!
      </Text>
    </View>
  );
}

// Concert Fund - Stage builds up
function ConcertVisualization({ progress }) {
  return (
    <View style={styles.visualContainer}>
      <Svg width="100%" height="200" viewBox="0 0 300 200">
        {/* Stage */}
        {progress >= 0.25 && (
          <Rect x="50" y="150" width="200" height="20" fill="#E17055" />
        )}
        
        {/* Speakers */}
        {progress >= 0.5 && (
          <>
            <Rect x="30" y="120" width="20" height="30" fill="#2D3436" />
            <Rect x="250" y="120" width="20" height="30" fill="#2D3436" />
          </>
        )}
        
        {/* Lights */}
        {progress >= 0.75 && (
          <>
            <Circle cx="100" cy="100" r="8" fill="#FDCB6E" />
            <Circle cx="150" cy="100" r="8" fill="#FDCB6E" />
            <Circle cx="200" cy="100" r="8" fill="#FDCB6E" />
          </>
        )}
        
        {/* Performer */}
        {progress >= 1.0 && (
          <>
            <Circle cx="150" cy="130" r="10" fill="#FFEAA7" />
            <Rect x="145" y="140" width="10" height="15" fill="#74B9FF" />
          </>
        )}
      </Svg>
      
      <Text style={styles.progressText}>
        🎵 {Math.round(progress * 100)}% to showtime!
      </Text>
    </View>
  );
}

export default function ProgressVisualization({ theme, progress, goalAmount, currentAmount, isAnimating = false }) {
  const config = THEME_CONFIGS[theme] || THEME_CONFIGS.beach_vacation;
  const VisualizationComponent = config.component;
  
  return (
    <LinearGradient
      colors={[...config.colors, 'rgba(255,255,255,0.1)']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <VisualizationComponent progress={progress} isAnimating={isAnimating} />
      
      <View style={styles.progressInfo}>
        <Text style={styles.amountText}>
          ${(currentAmount / 100).toFixed(2)} / ${(goalAmount / 100).toFixed(2)}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginVertical: 15,
    minHeight: 280,
  },
  visualContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressInfo: {
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
});
