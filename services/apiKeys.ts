// ====================================================================
// API ANAHTARI YÖNETİMİ
// ====================================================================
// OpenAI anahtarını güvenli biçimde yönetir:
//  1) Önce expo-secure-store'a bakılır (cihazda şifreli saklanır).
//  2) Yoksa .env -> app.config.js -> Constants.extra'dan okunur ve
//     ilk seferde secure-store'a yazılır.
// Böylece anahtar bir kez güvenli depoya alınır, sonra oradan okunur.
// ====================================================================

import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const OPENAI_KEY_ADI = "openai_api_key";

// .env üzerinden gelen (app.config.js -> extra) anahtar
function envdenKey(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { openaiApiKey?: string | null }
    | undefined;
  return extra?.openaiApiKey ?? null;
}

// OpenAI anahtarını döndürür (yoksa null).
export async function getOpenAiKey(): Promise<string | null> {
  // 1) Güvenli depodan dene
  const kayitli = await SecureStore.getItemAsync(OPENAI_KEY_ADI);
  if (kayitli && kayitli.trim() !== "") return kayitli;

  // 2) .env'den gelen anahtarı güvenli depoya taşı
  const env = envdenKey();
  if (env && env.trim() !== "") {
    await SecureStore.setItemAsync(OPENAI_KEY_ADI, env);
    return env;
  }

  return null;
}

// Anahtarı elle ayarlamak için (örn. uygulama içi ayar ekranı).
export async function setOpenAiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(OPENAI_KEY_ADI, key);
}

// Anahtarı siler.
export async function clearOpenAiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(OPENAI_KEY_ADI);
}
