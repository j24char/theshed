import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

type DayHour = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminDashboard() {
  // --- State ---
  const [hours, setHours] = useState<DayHour[]>([]);
  const [editingDay, setEditingDay] = useState<DayHour | null>(null);
  const [adminSlots, setAdminSlots] = useState<any[]>([]);
  const [adminDate, setAdminDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAdminSlots(adminDate);
  }, [adminDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    await fetchHours();
    await fetchAdminSlots(adminDate);
    setLoading(false);
  };

  // --- Data Fetching ---
  const fetchHours = async () => {
    const { data } = await supabase.from('facility_hours').select('*').order('day_of_week');
    if (data) setHours(data);
  };

  const fetchAdminSlots = async (date: Date) => {
    // Create non-mutating start/end of day
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
  };

  // --- Handlers ---
  const changeDate = (offset: number) => {
    const newDate = new Date(adminDate);
    newDate.setDate(newDate.getDate() + offset);
    setAdminDate(newDate);
  };

  const forceGenerateSlots = async () => {
    setActionLoading(true);
    
    // Format the adminDate to a simple YYYY-MM-DD string for Postgres
    const dateString = adminDate.toISOString().split('T')[0];

    const { error } = await supabase.rpc('generate_slots_for_date', { 
      target_date: dateString 
    });

    if (error) {
      Alert.alert("Generation Failed", error.message);
    } else {
      // Re-fetch the slots for the current view immediately
      fetchAdminSlots(adminDate);
      Alert.alert("Success", `Slots generated for ${dateString}`);
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
    // 1. Optimistic Update: Remove it from the local state immediately
    const originalSlots = [...adminSlots];
    setAdminSlots(prev => prev.filter(slot => slot.id !== id));

    const { error } = await supabase
      .from('timeslots')
      .delete()
      .eq('id', id);

    console.log("Delete Status:", status);

    if (error) {
      // 2. Rollback: If the DB rejected the delete, put the slots back
      setAdminSlots(originalSlots);
      Alert.alert("Delete Failed", error.message);
      console.error("Delete Error:", error);
    } else {
      // 3. Hard Sync: Refresh just to be 100% sure we are in sync with the server
      fetchAdminSlots(adminDate);
    }
  };

  const handleBulkDelete = async () => {
    const start = new Date(adminDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(adminDate);
    end.setHours(23, 59, 59, 999);

    // We ask once before wiping the whole day
    const confirmed = confirm("Wipe all slots for this day?"); 
    if (!confirmed) return;

    const { error } = await supabase
      .from('timeslots')
      .delete()
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString());

    if (!error) {
      fetchAdminSlots(adminDate);
    } else {
      console.error("Bulk Delete Error:", error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black px-6 pt-12">
      {/* Header & Global Sync */}
      <View className="mb-8">
        <Text className="text-brand-gold text-4xl font-black uppercase tracking-tighter">Admin Panel</Text>
        <Text className="text-white/40 uppercase text-xs tracking-widest mt-1">Shed App Facility Control</Text>
      </View>      

      {/* 1. Daily Slot Manager Section */}
      <View className="mb-12">
        <View className="mt-8 mb-4 flex-row justify-between items-end">
          <View>
            <Text className="text-brand-gold text-2xl font-black uppercase">Daily Manager</Text>
            <Text className="text-white/30 text-[10px] uppercase tracking-widest">Edit available time slots for the selected day</Text>
          </View>
          
          <Pressable 
            onPress={handleBulkDelete}
            className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg"
          >
            <Text className="text-red-500 text-xs font-bold uppercase">Wipe Day</Text>
          </Pressable>
        </View>

        {/* Date Scrubber */}
        <View className="flex-row justify-between items-center bg-brand-charcoal p-4 rounded-2xl mb-4 border border-white/5 shadow-xl">
          <Pressable onPress={() => changeDate(-1)} className="p-2 bg-white/5 rounded-full">
            <Ionicons name="chevron-back" size={20} color="#D4AF37" />
          </Pressable>
          <View className="items-center">
            <Text className="text-white font-bold text-lg">{adminDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            <Text className="text-brand-gold/50 text-[10px] uppercase tracking-tighter">Change Date</Text>
          </View>
          <Pressable onPress={() => changeDate(1)} className="p-2 bg-white/5 rounded-full">
            <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
          </Pressable>
        </View>

        {/* Slots List */}
        {adminSlots.length > 0 ? (
          adminSlots.map((slot) => (
            <View key={slot.id} className="flex-row justify-between items-center bg-white/5 p-5 rounded-2xl mb-3 border border-white/5">
              <View>
                <Text className="text-white font-bold text-lg">
                  {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text className={slot.is_booked ? "text-brand-gold" : "text-white/40"}>
                  {slot.is_booked ? "• Booked" : "Available"}
                </Text>
              </View>
              <Pressable 
                //onPress={() => Alert.alert("Delete?", "Remove this slot?", [{text: "No"}, {text: "Delete", style: 'destructive', onPress: () => handleDeleteSlot(slot.id)}])}
                onPress={() => handleDeleteSlot(slot.id)}
                className="bg-red-500/10 p-3 rounded-full"
              >
                <Ionicons name="trash" size={18} color="#ef4444" />
              </Pressable>
            </View>
          ))
        ) : (
          <View className="p-10 items-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Text className="text-white/20 italic">No slots for this date</Text>
          </View>
        )}
      </View>

      <Pressable 
        onPress={forceGenerateSlots}
        className="bg-brand-gold/10 border border-brand-gold/40 p-5 rounded-2xl mb-10 flex-row justify-center items-center"
      >
        <Ionicons name="flash" size={18} color="#D4AF37" />
        <Text className="text-brand-gold font-bold uppercase tracking-widest ml-2">
          Generate Slots for {adminDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </Pressable>

      {/* 2. Facility Rules Section */}
      <View className="mb-20">
        <Text className="text-white text-xl font-bold uppercase tracking-tight mb-4">Recurring Hours</Text>
        {hours.map((day) => (
          <Pressable 
            key={day.day_of_week}
            onPress={() => setEditingDay(day)}
            className="bg-brand-charcoal mb-3 p-5 rounded-2xl flex-row justify-between items-center border border-white/5"
          >
            <View>
              <Text className="text-white font-bold text-lg">{DAYS[day.day_of_week]}</Text>
              <Text className={day.is_closed ? "text-red-500" : "text-brand-gold/80"}>
                {day.is_closed ? "Closed" : `${day.open_time.slice(0,5)} - ${day.close_time.slice(0,5)}`}
              </Text>
            </View>
            <Ionicons name="settings-outline" size={18} color="#D4AF37" />
          </Pressable>
        ))}
      </View>

      {/* Edit Modal (Bottom Sheet Style) */}
      <Modal visible={!!editingDay} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-brand-charcoal p-8 rounded-t-[40px] border-t border-brand-gold/30">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-brand-gold text-2xl font-black uppercase">{editingDay ? DAYS[editingDay.day_of_week] : ""}</Text>
              <Pressable onPress={() => setEditingDay(null)} className="bg-white/10 p-2 rounded-full">
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <View className="flex-row justify-between items-center mb-8 bg-black/30 p-5 rounded-2xl">
              <Text className="text-white font-bold text-lg">Facility Open</Text>
              <Switch 
                value={!editingDay?.is_closed}
                onValueChange={(val) => setEditingDay(prev => prev ? {...prev, is_closed: !val} : null)}
                trackColor={{ false: "#333", true: "#D4AF37" }}
              />
            </View>

            {!editingDay?.is_closed && (
              <View className="flex-row justify-between mb-8">
                <View className="w-[47%]">
                  <Text className="text-white/40 uppercase text-[10px] tracking-widest mb-2 font-bold">Open</Text>
                  <TextInput 
                    className="bg-black text-white p-5 rounded-2xl border border-white/10 font-bold"
                    value={editingDay?.open_time}
                    onChangeText={(t) => setEditingDay(prev => prev ? {...prev, open_time: t} : null)}
                  />
                </View>
                <View className="w-[47%]">
                  <Text className="text-white/40 uppercase text-[10px] tracking-widest mb-2 font-bold">Close</Text>
                  <TextInput 
                    className="bg-black text-white p-5 rounded-2xl border border-white/10 font-bold"
                    value={editingDay?.close_time}
                    onChangeText={(t) => setEditingDay(prev => prev ? {...prev, close_time: t} : null)}
                  />
                </View>
              </View>
            )}

            <Pressable onPress={saveHours} className="bg-brand-gold p-6 rounded-2xl items-center shadow-lg">
              <Text className="text-black font-black uppercase tracking-widest text-lg">Apply Changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}