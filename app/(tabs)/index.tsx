import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import "../../global.css";
import { supabase } from '../../src/lib/supabase';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const videoSource = '/videos/0316.mp4';
  
  const player = useVideoPlayer(videoSource, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    // Listen for the status property within the payload object
    const subscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        player.play();
      }
    });

    // Check initial state in case it's ready before the listener attaches
    if (player.status === 'readyToPlay') {
      player.play();
    }

    return () => {
      subscription.remove();
    };
  }, [player]);

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('timeslots')
      .select('id, start_time, end_time, is_booked') // Explicitly exclude 'booked_by'
      // .gte(...) <-- Comment these out for one refresh
      // .lte(...)
      
    if (error) {
      console.error("DEBUG - Supabase Error:", error);
    } else {
      console.log("DEBUG - Data Received:", data);
      setSlots(data || []);
    }
    setLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-brand-black">
      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <View className="relative h-[400px] w-full overflow-hidden justify-center items-right">
        <VideoView
          player={player}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          contentFit="cover" // cover, contain, or fill
          nativeControls={false}
          allowsFullscreen={false}
        />
        
        {/* Dark Overlay to make text readable */}
        <View className="absolute top-0 left-0 w-full h-full bg-black/60" />

        <View className="z-10 px-6 items-center">
          <Text className="text-brand-gold text-5xl font-extrabold text-center uppercase tracking-tighter">
            The Hawks Shed
          </Text>
          <Text className="text-white text-lg mt-2 font-semibold tracking-widest uppercase">
            Precision Training
          </Text>
        </View>
      </View>

      {/* CONTENT WRAPPER (Centered for large screens) */}
      <View className="w-full max-w-4xl mx-auto p-4 mt-6">
        <Text className="text-brand-gold text-xl font-bold mb-4 uppercase tracking-wider">Facility Schedule</Text>
        
        <View className="rounded-xl overflow-hidden shadow-2xl border border-white/5">
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
            markedDates={{ [selectedDate]: { selected: true } }}
          />
        </View>

        {/* Timeslot List */}
        <View className="mt-8">
          {loading ? (
            <ActivityIndicator color="#D4AF37" />
          ) : (
            slots.map((slot) => (
              <View key={slot.id} className="flex-row items-center justify-between bg-brand-charcoal p-5 rounded-xl mb-3 border-l-4 border-brand-purple">
                <Text className="text-white font-mono text-lg">
                  {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View className={`px-4 py-1 rounded-full ${slot.is_booked ? 'bg-red-900/30' : 'bg-green-900/30'}`}>
                  <Text className={slot.is_booked ? 'text-red-400' : 'text-green-400'}>
                    {slot.is_booked ? 'Taken' : 'Available'}
                  </Text>
                </View>
              </View>
            ))
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