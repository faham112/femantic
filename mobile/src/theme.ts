import { StyleSheet } from "react-native";

export const colors = { bg: "#07131f", panel: "#102536", panelAlt: "#173244", line: "#294a63", text: "#eaf7ff", muted: "#8eaac0", accent: "#62dcff", green: "#49e6a8", orange: "#f8c75b", red: "#ff7b72" };

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 110 },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  panel: { backgroundColor: colors.panel, borderColor: colors.line, borderRadius: 18, borderWidth: 1, padding: 17 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 7 },
  input: { backgroundColor: colors.panelAlt, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, paddingHorizontal: 14, paddingVertical: 13 },
  button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14 },
  buttonText: { color: colors.bg, fontSize: 15, fontWeight: "900" },
  outlineButton: { alignItems: "center", borderColor: colors.line, borderRadius: 12, borderWidth: 1, paddingVertical: 13 },
  outlineText: { color: colors.text, fontWeight: "800" },
});
