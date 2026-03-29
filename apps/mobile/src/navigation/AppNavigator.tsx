import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { BookDetailScreen } from '../screens/BookDetailScreen';
import { GoogleBookItem } from '../services/googleBooksService';
import { PartialGoogleBook } from '../services/userBookService';

export type AppStackParamList = {
  MainTabs: undefined;
  BookDetail: { book: GoogleBookItem | PartialGoogleBook };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="BookDetail" 
        component={BookDetailScreen} 
        options={{ 
            presentation: 'modal',
            title: 'Détails du livre'
        }} 
      />
    </Stack.Navigator>
  );
};
