import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { PokemonCatalogScreen } from '../screens/PokemonCatalogScreen';
import { PokemonCollectionScreen } from '../screens/PokemonCollectionScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { TradesScreen } from '../screens/TradesScreen';
import { TrainerSearchScreen } from '../screens/TrainerSearchScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  TrainerSearch: undefined;
  PokemonCatalog: undefined;
  PokemonCollection: { username?: string } | undefined;
  Search: undefined;
  Trades: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { status } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'authenticated' ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="TrainerSearch" component={TrainerSearchScreen} />
            <Stack.Screen name="PokemonCatalog" component={PokemonCatalogScreen} />
            <Stack.Screen name="PokemonCollection" component={PokemonCollectionScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Trades" component={TradesScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
