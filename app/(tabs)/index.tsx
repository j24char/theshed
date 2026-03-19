import { format, parseISO } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import "../../global.css";
import { supabase } from '../../src/lib/supabase';

// Using the absolute path from the public root
const videoSource = { uri: '/videos/0316.mp4' };

export default function HomeScreen() {
  // Calendar uses 'YYYY-MM-DD' strings, so we initialize with today's string
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const player = useVideoPlayer(videoSource, (p) => {
    p.muted = true;
    p.loop = false;
  });

  useFocusEffect(
    useCallback(() => {
      fetchSlots(selectedDate);
    }, [selectedDate])
  );

  useEffect(() => {
    if (player) {
      player.play();
    }
  }, [player]);
    
  const fetchSlots = async (dateString: string) => {
    setLoading(true);
    
    // 1. Create a "Wall Clock" date for the start of the selected day in Chicago
    // We use the 'America/Chicago' timezone to ensure the UTC conversion 
    // accounts for Daylight Savings (CDT vs CST).
    const localDate = new Date(`${dateString}T00:00:00`);
    
    // 2. Convert that local midnight to a UTC string for the DB query
    // This will naturally result in something like "2026-03-18T05:00:00Z"
    const start = localDate.toISOString(); 

    // 3. Add 24 hours to get the end of that local day
    const endDate = new Date(localDate);
    endDate.setHours(endDate.getHours() + 24);
    const end = endDate.toISOString();

    const { data, error } = await supabase
      .from('timeslots')
      .select('*')
      .gte('start_time', start)
      .lt('start_time', end) // Use 'less than' the start of the next day
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching slots:", error.message);
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  // Re-run whenever the user picks a new day on the calendar
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  return (
    <ScrollView className="flex-1 bg-brand-black">
      {/* HERO SECTION */}
      <View className="relative h-[400px] w-full overflow-hidden justify-center">
        <VideoView
          player={player}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          // CRITICAL MOBILE FLAGS:
          allowsVideoFrameAnalysis={false} 
          startsPictureInPictureAutomatically={false}
        />
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

      <View className="w-full max-w-4xl mx-auto p-4 mt-6">
        <Text className="text-brand-gold text-xl font-bold mb-4 uppercase tracking-wider">Facility Schedule</Text>
        
        {/* CALENDAR */}
        <View className="rounded-xl overflow-hidden shadow-2xl border border-white/5">
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
        </View>

        {/* TIMESLOT LIST */}
        <View className="p-6">
          <Text className="text-brand-gold text-2xl font-bold uppercase mb-4">
            {/* format() handles the parseISO'd string for the title */}
            Sessions — {format(parseISO(selectedDate), 'MMM do')}
          </Text>

          {loading ? (
            <ActivityIndicator color="#D4AF37" />
          ) : slots.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {slots.map((slot) => (
                <Pressable 
                  key={slot.id}
                  disabled={slot.is_booked}
                  className={`w-[48%] mb-4 p-4 rounded-xl border ${
                    slot.is_booked 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-brand-charcoal border-brand-gold/50'
                  }`}
                >
                  <Text className={`text-lg font-bold ${slot.is_booked ? 'text-white/20' : 'text-white'}`}>
                    {/* Instead of new Date(), which shifts to local system time, 
                      we use parseISO to handle the string directly. 
                    */}
                    {format(parseISO(slot.start_time), 'h:mm a')}
                  </Text>
                  <Text className="text-xs text-brand-gold/60 uppercase tracking-widest mt-1">
                    {slot.is_booked ? 'Reserved' : 'Available'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="py-20 items-center border border-dashed border-white/10 rounded-2xl">
              <Text className="text-white/40 font-medium italic">No sessions scheduled.</Text>
            </View>
          )}
        </View>
      </View>

      <View className="w-full max-w-3xl mx-auto p-8 bg-brand-charcoal">
        <Text className="text-brand-gold font-bold uppercase text-xs tracking-widest">Location</Text>
        <Text className="text-gray-400 mt-1">123 Performance Way, Suite 100</Text>
        <Text className="text-brand-gold font-bold mt-6 uppercase text-xs tracking-widest">Base Operating Hours</Text>
        <Text className="text-gray-400 mt-1">Check calendar for specific daily availability.</Text>
      </View>
    </ScrollView>
  );
}