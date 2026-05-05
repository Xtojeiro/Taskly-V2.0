import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TasklyLayout } from '@/constants/taskly-design';
import { useTasklyTheme } from '@/hooks/use-taskly-theme';
import { useI18n } from '@/lib/i18n';

export default function TabLayout() {
  const { colors, shadow } = useTasklyTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          marginHorizontal: 20,
          marginBottom: TasklyLayout.tabBarBottomOffset,
          height: TasklyLayout.tabBarHeight,
          position: "absolute",
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.tabSurface,
          boxShadow: shadow.card,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "900",
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.today"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: t("tabs.plan"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t("tabs.stats"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
