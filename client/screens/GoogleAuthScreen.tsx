import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootStackNavigator';
import { signInWithGoogleCredential } from '@/lib/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'GoogleAuth'>;

// 🔥 ANDROID CLIENT ID ONLY (NOT WEB)
const ANDROID_GOOGLE_CLIENT_ID =
  '758670350516-klcf3ihsk2ij2315hmg1phu1g5f7a8q0.apps.googleusercontent.com';

export default function GoogleAuthScreen({ navigation }: Props) {
  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      androidClientId: ANDROID_GOOGLE_CLIENT_ID,
    });

  useEffect(() => {
    if (request) {
      promptAsync();
    }
  }, [request, promptAsync]);

  useEffect(() => {
    if (response?.type === 'success') {
      (async () => {
        try {
          const idToken = response.params.id_token;
          if (!idToken) throw new Error('No ID token');

          await signInWithGoogleCredential(idToken);
          navigation.replace('MainTabs');
        } catch {
          Alert.alert('Google login failed');
          navigation.replace('SignIn');
        }
      })();
    }

    if (response?.type === 'dismiss') {
      navigation.replace('SignIn');
    }
  }, [response, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
