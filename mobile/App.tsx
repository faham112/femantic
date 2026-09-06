import "react-native-gesture-handler";
import React from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { SitesScreen } from "./src/screens/SitesScreen";
import { AnalyticsScreen } from "./src/screens/AnalyticsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

export type RootStackParamList = { Login: undefined; Register: undefined; App: undefined };
export type AppTabParamList = { Overview: undefined; Sites: undefined; Analytics: undefined; Profile: undefined };
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: "#62dcff", background: "#07131f", card: "#102536", text: "#eaf7ff", border: "#294a63" } };

function MainTabs() {
  return <Tabs.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: "#62dcff", tabBarInactiveTintColor: "#7894a8", tabBarLabelStyle: styles.tabLabel }}>
    <Tabs.Screen name="Overview" component={DashboardScreen} options={{ title: "Overview", tabBarIcon: () => null }} />
    <Tabs.Screen name="Sites" component={SitesScreen} options={{ title: "Sites", tabBarIcon: () => null }} />
    <Tabs.Screen name="Analytics" component={AnalyticsScreen} options={{ title: "Live", tabBarIcon: () => null }} />
    <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile", tabBarIcon: () => null }} />
  </Tabs.Navigator>;
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator color="#62dcff" size="large" /></View>;
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    {user ? <Stack.Screen name="App" component={MainTabs} /> : <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </>}
  </Stack.Navigator>;
}

export default function App() {
  return <AuthProvider><NavigationContainer theme={theme}><StatusBar barStyle="light-content" /><RootNavigator /></NavigationContainer></AuthProvider>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#07131f", alignItems: "center", justifyContent: "center" },
  tabBar: { backgroundColor: "#102536", borderTopColor: "#294a63", height: 66, paddingBottom: 8, paddingTop: 8 },
  tabLabel: { fontSize: 11, fontWeight: "700" },
});
