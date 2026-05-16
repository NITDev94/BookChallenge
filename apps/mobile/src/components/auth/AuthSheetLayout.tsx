import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface AuthSheetLayoutProps {
  children: React.ReactNode;
  /** Offset used to adjust the layout when the keyboard is visible */
  keyboardOffset?: number;
}

/**
 * A reusable layout component for authentication screens that provides
 * a "Bottom Sheet" appearance with native-like gestures and animations.
 * 
 * Features:
 * - Entrance animation (slide up)
 * - Backdrop with fade-in effect
 * - Slide-to-dismiss gesture using PanResponder
 * - Keyboard avoidance
 * - Tap backdrop to close
 */
export const AuthSheetLayout: React.FC<AuthSheetLayoutProps> = ({ 
  children, 
  keyboardOffset = 0 
}) => {
  const navigation = useNavigation();
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current; // Starts off-screen at the bottom

  // Handle entry animation on mount
  useEffect(() => {
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [panY]);

  /**
   * Animates the sheet downwards and navigates back.
   */
  const handleClose = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  /**
   * Configures the PanResponder to handle the slide-to-dismiss gesture.
   * Only triggers if the vertical movement is downwards.
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Trigger only on downward movement
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Track the gesture movement if sliding down
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Dismiss if the swipe distance is significant
        if (gestureState.dy > 120) {
          handleClose();
        } else {
          // Snap back to initial position if swipe was not long enough
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={keyboardOffset}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View 
              style={[
                styles.sheet, 
                { transform: [{ translateY: panY }] }
              ]}
            >
              {/* Invisible touch area to facilitate grabbing the sheet */}
              <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
                <View style={styles.handle} />
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  dragHandleArea: {
    paddingTop: 12,
    paddingBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 0,
  },
});
