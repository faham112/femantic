import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "../AuthContext";
import { colors, ui } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;
export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() { try { setBusy(true); await signIn(email, password); } catch (error: any) { Alert.alert("Unable to sign in", error?.response?.data?.detail || "Check your email and password."); } finally { setBusy(false); } }
  return <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
    <Text style={ui.eyebrow}>FEMANTIC MOBILE</Text><Text style={ui.title}>Your traffic, in your pocket.</Text><Text style={ui.subtitle}>Monitor real visitors, pageviews and live activity from anywhere.</Text>
    <View style={[ui.panel, { marginTop: 28 }]}><Text style={ui.label}>EMAIL</Text><TextInput autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" placeholderTextColor={colors.muted} style={ui.input} value={email} onChangeText={setEmail} /><Text style={[ui.label, { marginTop: 17 }]}>PASSWORD</Text><TextInput secureTextEntry placeholder="Your password" placeholderTextColor={colors.muted} style={ui.input} value={password} onChangeText={setPassword} /><Pressable style={[ui.button, { marginTop: 22, opacity: busy ? 0.6 : 1 }]} disabled={busy} onPress={submit}><Text style={ui.buttonText}>{busy ? "SIGNING IN..." : "SIGN IN"}</Text></Pressable></View>
    <Pressable onPress={() => navigation.navigate("Register")} style={{ alignItems: "center", marginTop: 22 }}><Text style={{ color: colors.muted }}>New to Femantic? <Text style={{ color: colors.accent, fontWeight: "800" }}>Create account</Text></Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}
