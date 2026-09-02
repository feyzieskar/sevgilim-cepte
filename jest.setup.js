// Default test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";

// Mock WebSocket for Supabase Realtime in Node/Jest test environment
if (typeof globalThis.WebSocket === "undefined") {
  class MockWebSocket {
    constructor() {
      this.readyState = 1;
    }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  global.WebSocket = MockWebSocket;
  globalThis.WebSocket = MockWebSocket;
}

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      allowSignup: true,
      eas: { projectId: "mock-project-id" },
    },
  },
}));
