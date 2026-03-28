import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, BookOpen, User } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
          } else if (route.name === 'Explore') {
            return <Compass size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
          } else if (route.name === 'Library') {
            return <BookOpen size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
          } else if (route.name === 'Profile') {
            return <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
          }
        },
        tabBarActiveTintColor: '#78350f', // Amber-900/800 approximation for active
        tabBarInactiveTintColor: '#a8a29e', // Stone-400
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e7e5e4', // Stone-200
          paddingTop: 5,
          paddingBottom: 10,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarLabel: 'Explorer' }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: 'Biblio' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};
