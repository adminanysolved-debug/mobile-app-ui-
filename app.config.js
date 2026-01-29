module.exports = {
  expo: {
    name: "Real Dream",
    slug: "real-dream",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/app-logo.png",
    scheme: "realdream",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.realdream.app"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/app-logo.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.realdream.app",
      versionCode: 1
    },
    web: {
      output: "single",
      favicon: "./assets/images/app-logo.png"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/app-logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            backgroundColor: "#1A1040"
          }
        }
      ],
      "expo-web-browser"
    ],
    experiments: {
      reactCompiler: true
    },
    extra: {
      eas: {
        projectId: "9b3b2b97-a3f7-4a66-9069-cde06ead3148"
      },
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ]
  }
};
