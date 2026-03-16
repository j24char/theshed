import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import "../../global.css";
import { supabase } from '../../src/lib/supabase';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch slots for the selected day
  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timeslots')
      .select('*')
      .gte('start_time', `${selectedDate}T00:00:00Z`)
      .lte('start_time', `${selectedDate}T23:59:59Z`)
      .order('start_time', { ascending: true });

    if (!error) setSlots(data || []);
    setLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-brand-black">
      {/* Hero Section */}
      <View className="py-12 px-6 items-center bg-brand-purple">
        <Text className="text-brand-gold text-4xl font-extrabold text-center uppercase">Hawks Performance</Text>
        <Text className="text-white text-base mt-2">Chaska Shed Training Facility</Text>
      </View>

      {/* Calendar Section */}
      <View className="w-full max-w-3xl mx-auto p-4">
        <Text className="text-brand-gold text-xl font-bold mb-4 uppercase tracking-wider">Facility Schedule</Text>
        
        <Calendar
          theme={{
            backgroundColor: '#121212',
            calendarBackground: '#1A1A1A',
            textSectionTitleColor: '#D4AF37',
            selectedDayBackgroundColor: '#D4AF37',
            selectedDayTextColor: '#000000',
            todayTextColor: '#4B0082',
            dayTextColor: '#FFFFFF',
            monthTextColor: '#D4AF37',
            arrowColor: '#D4AF37',
          }}
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, disableTouchEvent: true }
          }}
        />

        {/* Timeslot List */}
        <View className="mt-6">
          <Text className="text-white font-bold mb-4">Availability for {selectedDate}</Text>
          
          {loading ? (
            <ActivityIndicator color="#D4AF37" />
          ) : slots.length > 0 ? (
            slots.map((slot) => (
              <View key={slot.id} className="flex-row items-center justify-between bg-brand-charcoal p-4 rounded-lg mb-2 border-l-4 border-brand-purple">
                <Text className="text-white font-mono">
                  {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View className={`px-3 py-1 rounded-full ${slot.is_booked ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
                  <Text className={slot.is_booked ? 'text-red-400' : 'text-green-400'}>
                    {slot.is_booked ? 'Taken' : 'Available'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic">No slots listed for this date.</Text>
          )}
        </View>
      </View>

      {/* Footer Info */}
      <View className="w-full max-w-3xl mx-auto p-8 bg-brand-charcoal">
        <Text className="text-brand-gold font-bold">LOCATION</Text>
        <Text className="text-gray-400">123 Performance Way, Suite 100</Text>
        <Text className="text-brand-gold font-bold mt-4">OPERATING HOURS</Text>
        <Text className="text-gray-400">Daily: 6:00 AM - 10:00 PM</Text>
      </View>
    </ScrollView>
  );
}