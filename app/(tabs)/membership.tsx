import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { WaiverModal } from '../../components/WaiverModal';
import { supabase } from '../../src/lib/supabase';

export default function Membership() {
  const [profile, setProfile] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWaiver, setShowWaiver] = useState(false);
  //const [hasWaiverRecord, setHasWaiverRecord] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // 3. NEW: Check the 'signed_waivers' table directly
      const { data: waiverData } = await supabase
        .from('signed_waivers')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const signed = waiverData && waiverData.length > 0;
      //setHasWaiverRecord(signed);
      if (!signed) setShowWaiver(true);

      // Fetch User's Bookings
      const { data: bookingData } = await supabase
        .from('timeslots')
        .select('*')
        .eq('booked_by', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
      setMyBookings(bookingData || []);
    }
    setLoading(false);
  };

  const handleCancel = async (slotId: number) => {
    Alert.alert("Cancel Booking", "Are you sure you want to release this timeslot?", [
      { text: "No", style: "cancel" },
      { 
        text: "Yes, Cancel", 
        onPress: async () => {
          const { error } = await supabase
            .from('timeslots')
            .update({ is_booked: false, booked_by: null })
            .eq('id', slotId);
          
          if (!error) {
            Alert.alert("Cancelled", "Timeslot is now available for others.");
            fetchData();
          }
        }
      }
    ]);
  };

  if (loading) return <ActivityIndicator className="mt-20" color="#D4AF37" />;

  return (
    <ScrollView className="flex-1 bg-brand-black p-6">
      <WaiverModal 
        visible={showWaiver} 
        onSign={() => {
          setShowWaiver(false);
          //setHasWaiverRecord(true);
        }} 
      />
      <View className="w-full max-w-md mx-auto p-6 mt-10">
      {/* User Status Card */}
      <View className="bg-brand-charcoal p-6 rounded-2xl border border-brand-purple mb-8">
        <Text className="text-brand-gold text-xs uppercase tracking-widest font-bold">Member Profile</Text>
        <Text className="text-white text-2xl font-bold mt-1">{profile?.email}</Text>
        
        <View className="flex-row mt-4 space-x-4">
          <View className="bg-black/50 px-3 py-1 rounded-full border border-brand-gold/30">
            <Text className="text-brand-gold text-xs uppercase">{profile?.role}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full border ${profile?.waiver_signed ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <Text className={profile?.waiver_signed ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
              {profile?.waiver_signed ? 'Waiver Active' : 'Waiver Missing'}
            </Text>
          </View>
        </View>
      </View>

      {/* My Bookings Section */}
      <Text className="text-brand-gold text-xl font-bold uppercase mb-4 tracking-tight">My Upcoming Sessions</Text>
      
      {myBookings.length > 0 ? (
        myBookings.map((slot) => (
          <View key={slot.id} className="bg-brand-charcoal p-5 rounded-xl mb-4 flex-row justify-between items-center border-l-4 border-brand-gold shadow-lg">
            <View>
              <Text className="text-white font-bold text-lg">
                {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <Text className="text-gray-400 font-mono">
                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleCancel(slot.id)}
              className="bg-red-900/20 border border-red-900 px-4 py-2 rounded-md"
            >
              <Text className="text-red-400 font-bold text-xs uppercase">Cancel</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View className="p-10 border-2 border-dashed border-white/10 rounded-xl items-center">
          <Text className="text-gray-500 italic">No sessions booked yet.</Text>
        </View>
      )}

      {/* Logout Button (Functional) */}
      <TouchableOpacity 
        onPress={() => supabase.auth.signOut()}
        className="mt-10 py-4 border border-brand-purple rounded-lg"
      >
        <Text className="text-brand-purple text-center font-bold uppercase">Sign Out</Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
}