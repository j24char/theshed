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
    fetchSlots(selectedDate); // Pass the selectedDate here
  }, [selectedDate]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(data);
    }
  };

  const fetchSlots = async (dateString: string) => {
    const targetDate = dateString || selectedDate; 
    setLoading(true);

    // 1. Create the Local-to-UTC range (same as we did for the Home screen)
    const localDate = new Date(`${dateString}T00:00:00`);
    const start = localDate.toISOString();
    const endDate = new Date(localDate);
    endDate.setHours(endDate.getHours() + 24);
    const end = endDate.toISOString();

    // 2. FETCH WITH EXPLICIT ORDERING
    const { data, error } = await supabase
      .from('timeslots')
      .select('*')
      .gte('start_time', start)
      .lt('start_time', end)
      .order('start_time', { ascending: true }); // <--- THIS IS THE CRITICAL LINE

    if (!error) {
      setSlots(data || []);
    }
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
      Alert.alert("Error", "Could not book slot.");
    } else {
      Alert.alert("Success", "Slot reserved!");
      fetchSlots(selectedDate); // Pass selectedDate to refresh the correct day
    }
  };

  return (
    
    <ScrollView className="flex-1 bg-brand-black p-4">
      <View className="w-full max-w-3xl mx-auto p-4">
        <Calendar
          theme={{
            backgroundColor: '#121212',
            calendarBackground: '#1A1A1A',
            textSectionTitleColor: '#D4AF37',
            
            // Global Theme Defaults
            dayTextColor: '#FFFFFF',
            todayTextColor: '#D4AF37',
            monthTextColor: '#D4AF37',
            arrowColor: '#D4AF37',
            textDayFontWeight: '500',
            
            // This sets the DEFAULT selected style for the whole calendar
            selectedDayBackgroundColor: '#4B0082', // Purple Circle
            selectedDayTextColor: '#FFFFFF',      // Gold Text
          }}
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { 
              selected: true, 
              disableTouchEvent: true, 
              // Explicitly defining the colors here ensures the "Circle" renders
              selectedColor: '#4B0082', 
              textColor: '#FFFFFF' 
            }
          }}
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