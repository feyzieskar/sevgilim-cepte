// Eski rota uyumluluğu: push bildirimleri ve eski linkler surprizler → duygular yönlendirir.
import { Redirect } from "expo-router";

export default function SurprizlerYonlendirme() {
  return <Redirect href="/(tabs)/duygular" />;
}
