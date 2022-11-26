import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import {Icon} from 'react-native-elements';

import HomeScreen from '../HomeScreen';
import ExploreScreen from '../ExploreScreen';
import ProfileScreen from '../ProfileScreen';
import MapScreen from '../MapScreen';
import UpdateProfileScreen from '../UpdateProfileScreen';
import SingleProfileScreen from '../SingleProfileScreen';
import RideScreen from '../RideScreen';
import NotificationScreen from '../NotificationScreen';

const HomeStack = createStackNavigator();
const ExploreStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const Stack = createStackNavigator();
const Tab = createMaterialBottomTabNavigator();

const MainTabScreen = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      activeColor="#1e293b"
      inactiveColor="#94a3b8"
      screenOptions={{
        tabBarHideOnKeyboard: true,
      }}
      barStyle={{
        backgroundColor: '#e2e8f0',
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        // height: 55,
        // position: 'absolute',
        // bottom: 10,
        // left: 10,
        // right: 10,
        // elevation: 2,
        // borderRadius: 14,
        // margin: 10,
        // borderTopLeftRadius: 14,
        // borderTopRightRadius: 14,
        // borderBottomLeftRadius: 14,
        // borderBottomRightRadius: 14,
        // borderLeftWidth: 0.2,
        // borderRightWidth: 0.2,
        // position: 'absolute',
        // overflow: 'hidden',
        // opacity: 0.8,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarStyle: {display: 'none'},
          tabBarIcon: ({color, focused}) => (
            <Icon
              name={focused ? 'home' : 'home-outline'}
              type="ionicon"
              color={color}
              size={26}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={ExploreStackScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({color, focused}) => (
            <Icon
              name={focused ? 'search' : 'search-outline'}
              type="ionicon"
              color={color}
              size={26}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Ride"
        component={RideScreen}
        options={{
          tabBarLabel: 'Rides',
          tabBarIcon: ({color, focused}) => (
            <Icon
              name={focused ? 'car' : 'car-outline'}
              type="ionicon"
              color={color}
              size={26}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          tabBarLabel: 'Bells',
          tabBarIcon: ({color, focused}) => (
            <Icon
              name={focused ? 'ios-notifications' : 'ios-notifications-outline'}
              type="ionicon"
              color={color}
              size={26}
              //on focused slanting
              style={focused ? {transform: [{rotate: '15deg'}]} : null}
            />
          ),
          tabBarBadge: 5,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          // tabBarLabel: 'Profile',
          tabBarIcon: ({color, focused}) => (
            <Icon
              name={focused ? 'person' : 'person-outline'}
              type="ionicon"
              color={color}
              size={26}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabScreen;

const MainStackComponent = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainStack"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const ProfileStackComponent = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileStack1"
        component={ProfileScreen}
        options={{headerShown: false}}></Stack.Screen>
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
    </Stack.Navigator>
  );
};

const ExploreStackComponent = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ExploreStack"
        component={ExploreScreen}
        options={{headerShown: false}}></Stack.Screen>
      <Stack.Screen
        name="SingleProfile"
        component={SingleProfileScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const HomeStackScreen = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="HomeStack"
      component={MainStackComponent}
      options={{headerShown: false}}
    />
  </HomeStack.Navigator>
);

const ExploreStackScreen = () => (
  <ExploreStack.Navigator>
    <ExploreStack.Screen
      name="ExploreStackScreen"
      component={ExploreStackComponent}
      options={{headerShown: false}}
    />
  </ExploreStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="ProfileStack"
      component={ProfileStackComponent}
      options={{
        headerShown: false,
      }}
    />
  </ProfileStack.Navigator>
);
