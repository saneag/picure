import { LogBox } from 'react-native';

// Dev-only warning raised by a navigation dependency while it loads, not by app code.
// Loaded from index.ts so it runs before expo-router and the warning fire.
LogBox.ignoreLogs(['ImageBackground is deprecated']);
