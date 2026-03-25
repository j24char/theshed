import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../src/lib/supabase';

const WAIVER_TEXT = `
HAWKS SHED - RELEASE OF LIABILITY
1. I recognize that baseball training involves physical risk...
2. I agree to follow all safety protocols, including wearing helmets...
3. I release the facility from all claims of injury...
[Insert Full Legal Text Here]
`;

export function WaiverModal({ visible, onSign }: { visible: boolean, onSign: () => void }) {
  const [loading, setLoading] = useState(false);
  const [activeWaiver, setActiveWaiver] = useState<any>(null);

  useEffect(() => {
    const getWaiver = async () => {
      const { data } = await supabase
        .from('waiver_versions')
        .select('*')
        .eq('is_active', true)
        .single();
      setActiveWaiver(data);
    };
    getWaiver();
  }, []);

  const handleSign = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('signed_waivers')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || 'User', // Pull from profile
          waiver_version_id: activeWaiver?.id || null,
          ip_address: 'mobile_app_client' // Simplified for Expo
        });

      if (error) throw error;
      
      onSign(); // Close modal and refresh app state
    } catch (error: any) {
      Alert.alert("Error signing waiver", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-brand-black p-6">
        <Text className="text-brand-gold text-2xl font-black mb-4">LEGAL RELEASE</Text>
        
        <ScrollView className="flex-1 bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
          <Text className="text-gray-300 leading-6">
            {WAIVER_TEXT}
          </Text>
        </ScrollView>

        <TouchableOpacity 
          onPress={handleSign}
          disabled={loading}
          className="bg-brand-gold py-4 rounded-xl items-center shadow-lg"
        >
          <Text className="text-brand-black font-bold text-lg">
            {loading ? "PROCESSING..." : "I AGREE & SIGN"}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}