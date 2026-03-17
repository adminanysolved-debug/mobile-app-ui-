declare module 'firebase/auth/react-native' {
  import { Persistence } from 'firebase/auth';
  import { AsyncStorage } from '@react-native-async-storage/async-storage';
  export function getReactNativePersistence(storage: any): Persistence;
}
