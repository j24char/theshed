import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { supabase } from '../src/lib/supabase';

export default function WaiverScreen() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signWaiver = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profiles')
      .update({ waiver_signed: true })
      .eq('id', user?.id);

    if (!error) {
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-black p-8 justify-center">
      <View className="bg-brand-charcoal border border-brand-gold/30 p-8 rounded-2xl shadow-2xl">
        <Text className="text-brand-gold text-4xl font-black uppercase tracking-tighter mb-2">
          Safety Protocol
        </Text>
        <Text className="text-white/50 uppercase text-xs tracking-widest mb-6">
          Hawks Shed Digital Waiver
        </Text>

        <ScrollView className="h-72 mb-8 bg-black/40 p-4 rounded-lg">
          <Text className="text-white/80 leading-relaxed">
            By signing this waiver, you acknowledge that precision athletic training involves physical exertion and inherent risks.
            {"\n\n"}
            I understand that my invovlvement in the program is voluntary and I assume all risks associated with it. The Hawks Shed and its affiliates are not liable for any injuries or damages that may occur during my training sessions.
            {"\n\n"}
            I agree to utilize the facility hardware as intended and follow all conduct guidelines. 
            {"\n\n"}
            I have read and fully understand the terms of this waiver and agree to abide by them.
          </Text>
        </ScrollView>

        <Pressable 
          onPress={() => setAgreed(!agreed)}
          className="flex-row items-center mb-8"
        >
          <View className={`w-6 h-6 border-2 rounded mr-3 items-center justify-center ${agreed ? 'bg-brand-gold border-brand-gold' : 'border-white/20'}`}>
            {agreed && <Text className="text-black font-bold">✓</Text>}
          </View>
          <Text className="text-white font-medium">I accept the Terms of Training</Text>
        </Pressable>

        <Pressable 
          disabled={!agreed || loading}
          onPress={signWaiver}
          className={`h-16 rounded-xl items-center justify-center ${agreed ? 'bg-brand-gold' : 'bg-white/10'}`}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className={`font-black uppercase tracking-widest ${agreed ? 'text-black' : 'text-white/20'}`}>
              Complete Enrollment
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}