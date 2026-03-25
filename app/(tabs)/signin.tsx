import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function resendVerification(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      Alert.alert("Error", "Could not resend email. Please try again later.");
    } else {
      Alert.alert("Sent!", "A new verification link has been sent to your email.");
    }
  }

  async function signInWithEmail() {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });
    
    if (error) {
      console.log("Login error details:", error);

      const isUnconfirmed = error.message.includes("Email not confirmed");
      const title = isUnconfirmed ? "Check Your Inbox" : "Login Failed";
      const message = isUnconfirmed 
        ? "Your account exists, but your email hasn't been verified yet. Please click the link in the email we sent you."
        : error.message;

      // WEB FALLBACK: browser 'window.alert' doesn't support buttons like 'Resend'
      if (Platform.OS === 'web') {
        alert(`${title}: ${message}`);
        // On web, you might want to show a 'Resend' button in the UI instead of an alert
      } else {
        // MOBILE: Standard React Native Alert
        Alert.alert(
          title,
          message,
          isUnconfirmed ? [
            { text: "OK" },
            { text: "Resend Email", onPress: () => resendVerification(email) }
          ] : [{ text: "OK" }]
        );
      }
    } else {
      router.replace('/membership');
    }
    
    setLoading(false);
  }

  return (
    <ScrollView className="flex-1 bg-brand-black p-6">
      <View className="w-full max-w-md mx-auto p-6 mt-10">
        <Text className="text-brand-gold text-3xl font-bold uppercase tracking-tighter">
          Welcome Back
        </Text>
        <Text className="text-gray-400 mt-2 mb-8">
          Sign in to access your membership and bookings.
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-brand-gold mb-2 font-semibold">Email</Text>
            <TextInput
              className="bg-brand-charcoal text-white p-4 rounded-md border border-brand-purple"
              placeholder="email@example.com"
              placeholderTextColor="#666"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />
          </View>

          <View className="mt-4">
            <Text className="text-brand-gold mb-2 font-semibold">Password</Text>
            <TextInput
              className="bg-brand-charcoal text-white p-4 rounded-md border border-brand-purple"
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry={true}
              onChangeText={setPassword}
              value={password}
            />
          </View>

          <TouchableOpacity
            className={`mt-10 py-4 rounded-md shadow-lg ${loading ? 'bg-gray-600' : 'bg-brand-gold'}`}
            onPress={signInWithEmail}
            disabled={loading}
          >
            <Text className="text-brand-black text-center font-bold text-lg uppercase">
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}