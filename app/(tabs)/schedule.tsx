import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import "../../global.css";
import { supabase } from '../../src/lib/supabase';

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchSlots();
  }, [selectedDate]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(data);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('timeslots')
      .select('*')
      .gte('start_time', `${selectedDate}T00:00:00Z`)
      .lte('start_time', `${selectedDate}T23:59:59Z`)
      .order('start_time', { ascending: true });
    setSlots(data || []);
    setLoading(false);
  };

  const handleBook = async (slotId: number) => {
    // Interlock Check: Waiver
    if (!userProfile?.waiver_signed) {
      Alert.alert("Waiver Required", "You must sign the digital waiver in the Membership tab before booking.");
      return;
    }

    const { error } = await supabase
      .from('timeslots')
      .update({ is_booked: true, booked_by: userProfile.id })
      .eq('id', slotId)
      .eq('is_booked', false); // Atomic check to prevent double-booking

    if (error) {
      Alert.alert("Error", "Could not book slot. It may have just been taken.");
    } else {
      Alert.alert("Success", "Slot reserved!");
      fetchSlots(); // Refresh UI
    }
  };

  return (
    
    <ScrollView className="flex-1 bg-brand-black p-4">
      <View className="w-full max-w-3xl mx-auto p-4">
        <Calendar
            theme={{
            calendarBackground: '#1A1A1A',
            selectedDayBackgroundColor: '#D4AF37',
            dayTextColor: '#FFFFFF',
            monthTextColor: '#D4AF37',
            arrowColor: '#D4AF37',
            }}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={{ [selectedDate]: { selected: true } }}
        />

        <View className="mt-6">
            <Text className="text-brand-gold font-bold mb-4 uppercase">Available Times</Text>
            {loading ? (
            <ActivityIndicator color="#D4AF37" />
            ) : (
            slots.map((slot) => (
                <View key={slot.id} className="bg-brand-charcoal p-4 rounded-lg mb-3 flex-row justify-between items-center border border-white/5">
                <Text className="text-white font-mono">
                    {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                
                {slot.is_booked ? (
                    <Text className="text-gray-600 italic">Reserved</Text>
                ) : (
                    <TouchableOpacity 
                    onPress={() => handleBook(slot.id)}
                    className="bg-brand-purple px-4 py-2 rounded-md"
                    >
                    <Text className="text-white font-bold">BOOK</Text>
                    </TouchableOpacity>
                )}
                </View>
            ))
            )}
        </View>
      </View>
    </ScrollView>
    
  );
}