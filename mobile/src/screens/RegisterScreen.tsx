import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "../AuthContext";
import { colors, ui } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;
export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() { if (password.length < 6) return Alert.alert("Password too short", "Use at least 6 characters."); try { setBusy(true); await signUp(email, password, name); } catch (error: any) { Alert.alert("Unable to register", error?.response?.data?.detail || "Please check your details."); } finally { setBusy(false); } }
  return <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled"><Text style={ui.eyebrow}>GET STARTED</Text><Text style={ui.title}>See the signal.</Text><Text style={ui.subtitle}>Create your Femantic account and connect your first website.</Text><View style={[ui.panel, { marginTop: 28 }]}><Text style={ui.label}>FULL NAME</Text><TextInput placeholder="Your name" placeholderTextColor={colors.muted} style={ui.input} value={name} onChangeText={setName} /><Text style={[ui.label, { marginTop: 17 }]}>EMAIL</Text><TextInput autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" placeholderTextColor={colors.muted} style={ui.input} value={email} onChangeText={setEmail} /><Text style={[ui.label, { marginTop: 17 }]}>PASSWORD</Text><TextInput secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.muted} style={ui.input} value={password} onChangeText={setPassword} /><Pressable style={[ui.button, { marginTop: 22, opacity: busy ? 0.6 : 1 }]} disabled={busy} onPress={submit}><Text style={ui.buttonText}>{busy ? "CREATING..." : "CREATE ACCOUNT"}</Text></Pressable></View><Pressable onPress={() => navigation.goBack()} style={{ alignItems: "center", marginTop: 22 }}><Text style={{ color: colors.muted }}>Already have an account? <Text style={{ color: colors.accent, fontWeight: "800" }}>Sign in</Text></Text></Pressable></ScrollView></KeyboardAvoidingView>;
}
