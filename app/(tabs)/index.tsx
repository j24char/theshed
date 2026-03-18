import { endOfDay, format, startOfDay } from 'date-fns';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import "../../global.css";
import { supabase } from '../../src/lib/supabase';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
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


  //const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today

  const fetchSlots = async (date: Date) => {
    setLoading(true);
    
    // Define the start and end of the chosen day in ISO format
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();

    const { data, error } = await supabase
      .from('timeslots')
      .select('*')
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching slots:", error.message);
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  // Re-run whenever the user changes the date
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

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
        <View className="p-6">
        <Text className="text-brand-gold text-2xl font-bold uppercase mb-4">
          Available Sessions — {format(selectedDate, 'MMM do')}
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
                  {format(new Date(slot.start_time), 'h:mm a')}
                </Text>
                <Text className="text-xs text-brand-gold/60 uppercase tracking-widest mt-1">
                  {slot.is_booked ? 'Reserved' : 'Available'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="py-20 items-center border border-dashed border-white/10 rounded-2xl">
            <Text className="text-white/40 font-medium">No sessions scheduled for this date.</Text>
          </View>
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