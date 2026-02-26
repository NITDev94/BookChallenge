import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingSlide } from '../../components/OnboardingSlide';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Transforme ta lecture en aventure',
    subtitle: 'Participe à des challenges de lecture, suis ta progression et découvre de nouveaux livres.',
    image: require('../../assets/images/onboarding1.png'),
  },
  {
    id: '2',
    title: 'Relève des challenges adaptés à toi',
    subtitle: 'Choisis des défis selon tes envies, ton rythme et tes genres préférés.',
    image: require('../../assets/images/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Suis tes progrès et reste motivé(e)',
    subtitle: 'Visualise tes lectures, gagne des badges et découvre de nouveaux livres.',
    image: require('../../assets/images/onboarding3.png'),
  },
];

type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll logic (every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= SLIDES.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false } // Width animation doesn't support native driver easily
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={handleScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <OnboardingSlide
            title={item.title}
            subtitle={item.subtitle}
            image={item.image}
          />
        )}
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          const dotWidth = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={index.toString()}
              style={[
                styles.dot,
                { opacity, width: dotWidth },
              ]}
            />
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title="S'inscrire gratuitement"
          onPress={() => navigation.navigate('Signup')}
          style={styles.signupButton}
        />
        <Button
          title="Se connecter"
          variant="outline"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48, // safe area spacing approximation if not using SafeAreaView
  },
  signupButton: {
    marginBottom: 16,
  },
});
