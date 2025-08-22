import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

function TabIcon({
  focused,
  source,
}: {
  focused: boolean;
  source: any;
}) {
  const ICON = 24;
  
  if (focused) {
    return (
      <View
        style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: '#F45F62',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={source}
          style={{
            width: ICON, height: ICON, tintColor: 'white'}}
            resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={{ width: ICON, height: ICON, tintColor: '#7A7A7A' }}
      resizeMode="contain"
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {height: 60, backgroundColor: 'white', paddingTop: 4, paddingBottom: 4, borderTopWidth: 0, elevation: 0},
        }),
      }}>
      <Tabs.Screen
        name="calendar"
        options={{
          title: '내 일정',
          headerShown: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {fontSize: 24, fontWeight: 'bold', color: '#000000ff'},
          headerStyle: { backgroundColor: '#ffffff' },
          tabBarIcon: ({ focused }) => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <TabIcon
                focused={focused}
                source={require('../../assets/images/calendar.png')}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="eventlist"
        options={{
          title: '이벤트',
          headerShown: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {fontSize: 24, fontWeight: 'bold', color: '#000000ff'},
          headerStyle: { backgroundColor: '#ffffff' },
          tabBarIcon: ({ focused }) => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <TabIcon
                focused={focused}
                source={require('../../assets/images/eventlist.png')}
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="newevent"
        options={{
          title: '이벤트 추가',
          headerShown: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {fontSize: 24, fontWeight: 'bold', color: '#000000ff'},
          headerStyle: { backgroundColor: '#ffffff' },
          tabBarIcon: ({ focused }) => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <TabIcon
                focused={focused}
                source={require('../../assets/images/newevent.png')}
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="friendNgroup"
        options={{
          title: '친구 및 그룹',
          headerShown: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {fontSize: 24, fontWeight: 'bold', color: '#000000ff'},
          headerStyle: { backgroundColor: '#ffffff' },
          tabBarIcon: ({ focused }) => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <TabIcon
                focused={focused}
                source={require('../../assets/images/friendNgroup.png')}
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          headerShown: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {fontSize: 24, fontWeight: 'bold', color: '#000000ff'},
          headerStyle: { backgroundColor: '#ffffff' },
          tabBarIcon: ({ focused }) => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <TabIcon
                focused={focused}
                source={require('../../assets/images/profile.png')}
              />
            </View>
          )
        }}
      />
    </Tabs>
  );
}
