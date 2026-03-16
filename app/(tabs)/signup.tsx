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
        // This maps to the "full_name" in our SQL trigger
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email for the confirmation link!');
      router.replace('/'); // Redirect to home after success
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