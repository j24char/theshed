import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

type DayHour = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminScreen() {
  const router = useRouter();

  // --- 1. ALL HOOKS MUST BE AT THE TOP ---
  const [hours, setHours] = useState<DayHour[]>([]);
  const [editingDay, setEditingDay] = useState<DayHour | null>(null);
  const [adminSlots, setAdminSlots] = useState<any[]>([]);
  const [adminDate, setAdminDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // --- 2. DATA FETCHING LOGIC ---
  const fetchHours = async () => {
    const { data } = await supabase.from('facility_hours').select('*').order('day_of_week');
    if (data) setHours(data);
  };

  const fetchAdminSlots = useCallback(async (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('timeslots')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true });

    if (!error) setAdminSlots(data || []);
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.replace('/');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (data?.role === 'admin') {
      setIsAdmin(true);
      // Initialize data only after admin confirm
      await fetchHours();
      await fetchAdminSlots(adminDate);
      setLoading(false);
    } else {
      setIsAdmin(false);
      router.replace('/');
    }
  };

  // --- 3. LIFECYCLE EFFECTS ---
  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminSlots(adminDate);
    }
  }, [adminDate, isAdmin, fetchAdminSlots]);

  // --- 4. INTERACTION HANDLERS ---
  const changeDate = (offset: number) => {
    const newDate = new Date(adminDate);
    newDate.setDate(newDate.getDate() + offset);
    setAdminDate(newDate);
  };

  const forceGenerateSlots = async () => {
    setActionLoading(true);

    // Use a format that ignores timezone offsets entirely
    const year = adminDate.getFullYear();
    const month = String(adminDate.getMonth() + 1).padStart(2, '0');
    const day = String(adminDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; 

    console.log("Generating for Date String:", dateString); // Should be '2026-03-18'

    const { error } = await supabase.rpc('generate_slots_for_date', { 
      target_date: dateString 
    });

    if (error) {
      Alert.alert("Sync Failed", error.message);
    } else {
      // Clear old local state so the new (correct) hours show up
      setAdminSlots([]); 
      await fetchAdminSlots(adminDate);
    }
    setActionLoading(false);
  };

  const saveHours = async () => {
    if (!editingDay) return;
    const { error } = await supabase
      .from('facility_hours')
      .update(editingDay)
      .eq('day_of_week', editingDay.day_of_week);

    if (!error) {
      setEditingDay(null);
      fetchHours();
    } else {
      Alert.alert("Error", "Could not save hours.");
    }
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase.from('timeslots').delete().eq('id', id);
    if (!error) {
      setAdminSlots(prev => prev.filter(s => s.id !== id));
    }
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { label: `${hour}:00`, value: `${hour}:00:00` };
  });

  // --- 5. CONDITIONAL RENDERING (MUST BE AT THE BOTTOM) ---
  if (isAdmin === null || (loading && isAdmin)) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (isAdmin === false) return null;

  return (
    <ScrollView className="flex-1 bg-black px-6 pt-12">
      <Text className="text-brand-gold text-3xl font-black uppercase mb-6">Facility Admin</Text>

      <Pressable 
        onPress={forceGenerateSlots}
        disabled={actionLoading}
        className="bg-brand-gold/10 border border-brand-gold/40 p-5 rounded-2xl mb-10 flex-row justify-center items-center"
      >
        {actionLoading ? <ActivityIndicator color="#D4AF37" /> : (
          <Text className="text-brand-gold font-bold uppercase tracking-widest">
            Generate {DAYS[adminDate.getDay()]} Slots
          </Text>
        )}
      </Pressable>

      <View className="mb-12">
        <View className="flex-row justify-between items-center bg-brand-charcoal p-4 rounded-2xl mb-4">
          <Pressable onPress={() => changeDate(-1)} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#D4AF37" />
          </Pressable>
          <Text className="text-white font-bold">
            {adminDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Pressable onPress={() => changeDate(1)} className="p-2">
            <Ionicons name="chevron-forward" size={24} color="#D4AF37" />
          </Pressable>
        </View>

        {adminSlots.length > 0 ? (
          adminSlots.map((slot) => (
            <View key={slot.id} className="flex-row justify-between items-center bg-white/5 p-4 rounded-xl mb-2 border border-white/5">
              <Text className="text-white font-bold">
                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Pressable onPress={() => handleDeleteSlot(slot.id)}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </Pressable>
            </View>
          ))
        ) : (
          <Text className="text-white/30 text-center py-4 italic">No slots for this date</Text>
        )}
      </View>

      <View className="mb-20">
        <Text className="text-white/50 uppercase text-xs mb-4">Recurring Hours</Text>
        {hours.map((day) => (
          <Pressable key={day.day_of_week} onPress={() => setEditingDay(day)} className="bg-brand-charcoal mb-2 p-4 rounded-xl flex-row justify-between">
            <Text className="text-white font-bold">{DAYS[day.day_of_week]}</Text>
            <Text className="text-brand-gold">{day.is_closed ? "Closed" : (day.open_time.slice(0,5) + " - " + day.close_time.slice(0,5))}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={!!editingDay} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-brand-charcoal p-8 rounded-t-3xl border-t border-brand-gold/30">
            
            {/* Header */}
            <View className="flex-row justify-between mb-6">
              <Text className="text-brand-gold text-2xl font-black uppercase">
                {editingDay ? DAYS[editingDay.day_of_week] : ""}
              </Text>
              <Pressable onPress={() => setEditingDay(null)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
            
            {/* Open/Closed Toggle */}
            <View className="flex-row justify-between items-center mb-6 bg-black/40 p-4 rounded-xl">
              <Text className="text-white font-bold text-lg">Facility Open</Text>
              <Switch 
                value={!editingDay?.is_closed}
                onValueChange={(val) => setEditingDay(prev => prev ? {...prev, is_closed: !val} : null)}
                trackColor={{ false: "#333", true: "#D4AF37" }}
                thumbColor={!editingDay?.is_closed ? "#FFFFFF" : "#999"}
              />
            </View>

            {!editingDay?.is_closed && (
              <View className="flex-row justify-between items-center mb-8">
                {/* Open Time Picker */}
                <View className="w-[45%]">
                  <Text className="text-brand-gold/70 text-[10px] uppercase font-bold mb-2 text-center">Open</Text>
                  <View className="bg-black/40 rounded-xl overflow-hidden border border-white/10">
                    <Picker
                      selectedValue={editingDay?.open_time}
                      onValueChange={(itemValue) => setEditingDay(prev => prev ? {...prev, open_time: itemValue} : null)}
                      dropdownIconColor="#D4AF37"
                      style={{ color: '#444' }} // Fixes the black-on-black text
                    >
                      {timeOptions.map(opt => (
                        <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#444" />
                      ))}
                    </Picker>
                  </View>
                </View>

                <Ionicons name="arrow-forward" size={20} color="#D4AF37" style={{ marginTop: 20 }} />

                {/* Close Time Picker */}
                <View className="w-[45%]">
                  <Text className="text-brand-gold/70 text-[10px] uppercase font-bold mb-2 text-center">Close</Text>
                  <View className="bg-black/40 rounded-xl overflow-hidden border border-white/10">
                    <Picker
                      selectedValue={editingDay?.close_time}
                      onValueChange={(itemValue) => setEditingDay(prev => prev ? {...prev, close_time: itemValue} : null)}
                      dropdownIconColor="#D4AF37"
                      style={{ color: '#444' }}
                    >
                      {timeOptions.map(opt => (
                        <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#444" />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            )}

            <Pressable 
              onPress={saveHours} 
              className="bg-brand-gold p-5 rounded-2xl items-center active:bg-white"
            >
              <Text className="text-black font-black uppercase tracking-widest text-lg">
                Update Schedule
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}