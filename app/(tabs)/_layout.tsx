import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs, useRouter, useSegments } from 'expo-router'; // Add Link
import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native'; // Add Pressable
import "../../global.css";
import { supabase } from '../../src/lib/supabase';

export default function TabLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 1. Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hasSession = !!session;
      setIsLoggedIn(hasSession);
      setUserEmail(session?.user?.email || null);
      
      if (session?.user?.id) {
        fetchRole(session.user.id);
      }
    });

    // 2. Listen for auth changes (Login, Logout, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const hasSession = !!session;
      setIsLoggedIn(hasSession);
      setUserEmail(session?.user?.email || null);

      if (hasSession && session.user.id) {
        fetchRole(session.user.id);
      } else {
        setRole(null); // Clear role on sign out
      }

      if (event === 'SIGNED_OUT') router.replace('/');
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setRole(data?.role || 'user');
  };

  useEffect(() => {
    async function checkWaiver() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('waiver_signed')
        .eq('id', user.id)
        .single();

      // If they haven't signed and aren't already on the waiver page, redirect them
      const inWaiverGroup = segments[0] === 'waiver';
      if (profile && !profile.waiver_signed && !inWaiverGroup) {
        router.replace('/waiver');
      }
    }
    checkWaiver();
  }, [segments]);

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
      
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <Ionicons name="bell" size={24} color={color} /> }} />
      <Tabs.Screen name="membership" options={{ title: 'Membership', href: isLoggedIn ? '/membership' : null, tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Book', href: isLoggedIn ? '/schedule' : null, tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} /> }} />
      <Tabs.Screen name="signup" options={{ title: 'Join', href: isLoggedIn ? null : '/signup' }} />
      <Tabs.Screen name="signin" options={{ title: 'Sign In', href: isLoggedIn ? null : '/signin' }} />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: role === 'admin' ? '/admin' : null, // This hides the tab button
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}