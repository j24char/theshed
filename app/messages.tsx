import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { supabase } from '../src/lib/supabase';

interface Message {
  id: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

export default function MessageBoard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setMessages(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  if (loading) return <ActivityIndicator className="mt-20" color="#D4AF37" />;

  return (
    <ScrollView 
      className="flex-1 bg-brand-black p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMessages} tintColor="#D4AF37" />}
    >
      <Text className="text-brand-gold text-2xl font-bold uppercase mb-6 tracking-widest">
        Facility Announcements
      </Text>

      {messages.map((msg) => (
        <View key={msg.id} className="bg-brand-charcoal p-5 rounded-xl border-l-4 border-brand-purple mb-4 shadow-md">
          <Text className="text-brand-gold font-bold text-lg">{msg.title}</Text>
          <Text className="text-gray-300 mt-2 leading-5">{msg.content}</Text>
          <View className="mt-4 flex-row justify-between border-t border-white/10 pt-2">
            <Text className="text-gray-500 text-xs italic">By: {msg.author_name || 'Staff'}</Text>
            <Text className="text-gray-500 text-xs">
              {new Date(msg.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ))}
      
      {messages.length === 0 && (
        <Text className="text-gray-500 text-center mt-10 italic">No announcements at this time.</Text>
      )}
    </ScrollView>
  );
}