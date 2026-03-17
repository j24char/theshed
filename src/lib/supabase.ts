import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Replace these with your actual Supabase URL and Anon Key from your dashboard
const supabaseUrl = 'https://nejojscszdbbaipgycfc.supabase.co';
const supabaseAnonKey = 'sb_publishable_f4D_tqGRGiVF4Hm6wFIX1g_JQNw_uvL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);