import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import "../global.css";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  
  useEffect(() => {
    async function checkUserStatus() {
      // 1. Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Not logged in? Handled by your Auth flow

      // 2. Fetch the specific "Waiver" bit from the profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('waiver_signed')
        .eq('id', user.id)
        .single();

      const inWaiverScreen = segments[0] === 'waiver';

      // 3. Logic Gate: If not signed and not already on the waiver page, force redirect
      if (profile && !profile.waiver_signed && !inWaiverScreen) {
        router.replace('/waiver');
      } 
      // 4. Reverse Gate: If they ARE signed but try to go back to waiver, send them home
      else if (profile?.waiver_signed && inWaiverScreen) {
        router.replace('/(tabs)');
      }
    }

    checkUserStatus();
  }, [segments]);
  
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Stack
        screenOptions={{
          headerShown: false, // Hide the root header so the Tab header takes over
          contentStyle: { backgroundColor: '#000000' }, 
        }}
      >
        {/* Point to the tab group, not 'index' */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}