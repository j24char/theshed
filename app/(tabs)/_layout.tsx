import { Link, Tabs, useRouter } from 'expo-router'; // Add Link
import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native'; // Add Pressable
import "../../global.css";
import { supabase } from '../../src/lib/supabase';

export default function TabLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check current session and get email
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);
      if (event === 'SIGNED_OUT') router.replace('/');
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#D4AF37',
        tabBarStyle: { backgroundColor: '#000000', borderTopColor: '#4B0082' },
        tabBarActiveTintColor: '#D4AF37',
        // --- ADD THIS SECTION ---
        headerRight: () => (
          isLoggedIn && userEmail ? (
            <Link href="/membership" asChild>
              <Pressable className="mr-4 bg-brand-charcoal px-3 py-1 rounded-full border border-brand-purple/50 active:opacity-70">
                <Text className="text-brand-gold text-xs font-bold uppercase">
                  {userEmail.split('@')[0]} {/* Shows just the username part of the email */}
                </Text>
              </Pressable>
            </Link>
          ) : null
        ),
      }}>
      
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="messages" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="membership" options={{ title: 'Membership', href: isLoggedIn ? '/membership' : null }} />
      <Tabs.Screen name="schedule" options={{ title: 'Book', href: isLoggedIn ? '/schedule' : null }} />
      <Tabs.Screen name="signup" options={{ title: 'Join', href: isLoggedIn ? null : '/signup' }} />
      <Tabs.Screen name="signin" options={{ title: 'Sign In', href: isLoggedIn ? null : '/signin' }} />
      <Tabs.Screen name="admin" options={{ title: 'Admin', href: isLoggedIn ? '/admin' : null }} />
    </Tabs>
  );
}