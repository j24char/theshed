import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../src/lib/supabase';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data?.role === 'admin') setIsAdmin(true);
    }
    setLoading(false);
  }

  async function generateDaySlots() {
    setProcessing(true);
    const newSlots = [];
    // Generate hourly slots from 8 AM to 8 PM (20:00)
    for (let hour = 8; hour < 20; hour++) {
      const startTime = new Date(`${selectedDate}T${hour.toString().padStart(2, '0')}:00:00Z`);
      const endTime = new Date(`${selectedDate}T${(hour + 1).toString().padStart(2, '0')}:00:00Z`);
      
      newSlots.push({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_booked: false
      });
    }

    const { error } = await supabase.from('timeslots').insert(newSlots);

    if (error) {
      Alert.alert("Error", "Could not generate slots. They might already exist.");
    } else {
      Alert.alert("Success", `12 slots generated for ${selectedDate}`);
    }
    setProcessing(false);
  }

  if (loading) return <ActivityIndicator className="mt-20" color="#D4AF37" />;

  if (!isAdmin) {
    return (
      <View className="flex-1 bg-brand-black justify-center items-center p-6">
        <Text className="text-brand-gold text-xl font-bold uppercase">Access Denied</Text>
        <Text className="text-gray-400 text-center mt-2">Administrative privileges required.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-brand-black p-6">
      <Text className="text-brand-gold text-2xl font-bold uppercase mb-6">Facility Management</Text>
      
      <View className="bg-brand-charcoal p-4 rounded-xl mb-6">
        <Text className="text-white font-bold mb-4">Provision Timeslots</Text>
        <Calendar
          theme={{
            calendarBackground: '#1A1A1A',
            dayTextColor: '#FFFFFF',
            monthTextColor: '#D4AF37',
            selectedDayBackgroundColor: '#4B0082',
          }}
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={{ [selectedDate]: { selected: true } }}
        />
        
        <TouchableOpacity 
          onPress={generateDaySlots}
          disabled={processing}
          className="bg-brand-purple mt-6 py-4 rounded-lg"
        >
          <Text className="text-white text-center font-bold uppercase">
            {processing ? 'Generating...' : `Generate 8am-8pm for ${selectedDate}`}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-brand-charcoal p-4 rounded-xl">
        <Text className="text-white font-bold mb-2">Member Audit</Text>
        <Text className="text-gray-400 text-sm">Future feature: View all users and toggle Platinum status or Waiver manually.</Text>
      </View>
    </ScrollView>
  );
}