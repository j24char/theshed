import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/');
    };
    checkUser();
  }, []);

  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      // If email exists, Supabase throws an error here. 
      // This alert will now definitely show because there is no navigation.
      Alert.alert('Sign Up Failed', error.message);
    } else if (data.user && data.session === null) {
      // This is the "Confirmation Required" state
      Alert.alert(
        'Verify Your Email',
        `A link has been sent to ${email}. Please click it to activate your account before logging in.`,
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/') // ONLY move after they click OK
          }
        ]
      );
    } else {
      // This handles the rare case where confirmation is off
      router.replace('/membership');
    }
    setLoading(false);
  }

  return (
    <ScrollView className="flex-1 bg-brand-black p-6">
      <View className="w-full max-w-md mx-auto p-6 mt-10">
        <Text className="text-brand-gold text-3xl font-bold uppercase tracking-tighter">
          Join the Team
        </Text>
        <Text className="text-gray-400 mt-2 mb-8">
          Create your profile to start booking sessions.
        </Text>

        <View className="space-y-4">
          {/* Full Name Input */}
          <View>
            <Text className="text-brand-gold mb-2 font-semibold">Full Name</Text>
            <TextInput
              className="bg-brand-charcoal text-white p-4 rounded-md border border-brand-purple"
              placeholder="John Doe"
              placeholderTextColor="#666"
              onChangeText={setFullName}
              value={fullName}
            />
          </View>

          {/* Email Input */}
          <View className="mt-4">
            <Text className="text-brand-gold mb-2 font-semibold">Email Address</Text>
            <TextInput
              className="bg-brand-charcoal text-white p-4 rounded-md border border-brand-purple"
              placeholder="email@example.com"
              placeholderTextColor="#666"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />
          </View>

          {/* Password Input */}
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

          {/* Signup Button */}
          <TouchableOpacity
            className={`mt-10 py-4 rounded-md shadow-lg ${loading ? 'bg-gray-600' : 'bg-brand-gold'}`}
            onPress={signUpWithEmail}
            disabled={loading}
          >
            <Text className="text-brand-black text-center font-bold text-lg uppercase">
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}