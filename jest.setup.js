// Default test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";

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
