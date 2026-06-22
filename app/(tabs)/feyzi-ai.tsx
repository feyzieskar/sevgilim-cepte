// ====================================================================
// FEYZİ AI SEKMESİ  (Metin Sohbeti)
// ====================================================================
// - Üstte avatar + isim, sağda sohbeti temizleme
// - Mod seçici (Normal / Moral / Plan / Anı) + pasif "Sesli/Video"
// - Mesaj balonları (Feyzi solda gradyan, kullanıcı sağda nötr)
// - "Feyzi yazıyor..." göstergesi, alt mesaj girişi
// Sohbet geçmişi cihazda kalıcıdır (Zustand + AsyncStorage).
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeyziAvatar } from "@/components/chat/FeyziAvatar";
import { MesajBalonu } from "@/components/chat/MesajBalonu";
import { ModSecici } from "@/components/chat/ModSecici";
import { RADIUS } from "@/constants/theme";
import { ChatMessage, useChatStore } from "@/store/chatStore";
import { usePalet } from "@/store/useThemeStore";

export default function FeyziAiEkrani() {
  const palet = usePalet();

  const messages = useChatStore((s) => s.messages);
  const currentMode = useChatStore((s) => s.currentMode);
  const isLoading = useChatStore((s) => s.isLoading);
  const setMode = useChatStore((s) => s.setMode);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearChat = useChatStore((s) => s.clearChat);

  const [metin, setMetin] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Ters liste (inverted) için en yeni mesaj başta
  const tersMesajlar = useMemo(() => [...messages].reverse(), [messages]);

  const gonder = () => {
    const t = metin.trim();
    if (t === "" || isLoading) return;
    setMetin("");
    sendMessage(t);
  };

  const temizleOnayi = () => {
    if (messages.length === 0) return;
    Alert.alert("Sohbeti temizle", "Tüm mesaj geçmişi silinsin mi?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Temizle", style: "destructive", onPress: () => clearChat() },
    ]);
  };

  const gonderilebilir = metin.trim() !== "" && !isLoading;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      {/* Başlık */}
      <View
        className="flex-row items-center px-5 pb-3 pt-2"
        style={{ borderBottomWidth: 1, borderBottomColor: palet.kenarlik }}
      >
        <FeyziAvatar size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-xl font-bold" style={{ color: palet.metin }}>
            Feyzi
          </Text>
          <Text className="text-sm" style={{ color: palet.metinIkincil }}>
            Her zaman buradayım 💕
          </Text>
        </View>
        <Pressable
          onPress={temizleOnayi}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: palet.yuzeyIkincil }}
        >
          <Ionicons name="trash-outline" size={20} color={palet.metinIkincil} />
        </Pressable>
      </View>

      {/* Mod seçici */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: palet.kenarlik }}>
        <ModSecici secili={currentMode} onChange={setMode} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {messages.length === 0 && !isLoading ? (
          // ---- Boş durum / karşılama ----
          <View className="flex-1 items-center justify-center px-10">
            <FeyziAvatar size={84} />
            <Text className="mt-4 text-center text-lg font-bold" style={{ color: palet.metin }}>
              Merhaba aşkım 💕
            </Text>
            <Text className="mt-2 text-center" style={{ color: palet.metinIkincil }}>
              Aklında ne varsa yazabilirsin. Yukarıdan bir mod seçip sohbete
              başlayabilirsin.
            </Text>
          </View>
        ) : (
          <FlatList
            data={tersMesajlar}
            keyExtractor={(m: ChatMessage) => m.id}
            renderItem={({ item }) => <MesajBalonu message={item} />}
            inverted
            contentContainerStyle={{ paddingVertical: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            // inverted listede header görsel olarak EN ALTTA görünür
            ListHeaderComponent={
              isLoading ? (
                <View className="mb-3 flex-row items-end px-4">
                  <View className="mr-2">
                    <FeyziAvatar size={32} />
                  </View>
                  <View
                    className="flex-row items-center"
                    style={{
                      backgroundColor: palet.yuzeyIkincil,
                      borderRadius: RADIUS.lg,
                      borderBottomLeftRadius: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <ActivityIndicator size="small" color={palet.primary} />
                    <Text className="ml-2" style={{ color: palet.metinIkincil }}>
                      Feyzi yazıyor...
                    </Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Mesaj girişi */}
        <View
          className="flex-row items-end px-3 pb-2 pt-2"
          style={{ borderTopWidth: 1, borderTopColor: palet.kenarlik }}
        >
          <TextInput
            ref={inputRef}
            value={metin}
            onChangeText={setMetin}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor={palet.metinIkincil}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              backgroundColor: palet.yuzeyIkincil,
              borderRadius: RADIUS.lg,
              color: palet.metin,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 16,
            }}
          />
          <Pressable
            onPress={gonder}
            disabled={!gonderilebilir}
            className="ml-2 h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: gonderilebilir ? palet.primary : palet.kenarlik,
            }}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
