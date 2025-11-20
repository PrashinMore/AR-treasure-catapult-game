import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Reward redemption functions
export async function saveRewardRedemption(reward, deviceId) {
  try {
    const { data, error } = await supabase
      .from('redemptions')
      .insert({
        reward_id: reward.id,
        reward_name: reward.name,
        reward_value: reward.value,
        redemption_code: reward.redemptionCode,
        device_id: deviceId,
        redeemed: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving redemption:', error)
    return null
  }
}

export async function checkDailyPlayLimit(deviceId) {
  try {
    // Skip if Supabase is not configured (using placeholder URL)
    if (supabaseUrl.includes('your-project')) {
      return false
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('plays')
      .select('*')
      .eq('device_id', deviceId)
      .gte('created_at', today)
      .limit(1)

    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    // Silently fail if Supabase is not configured
    return false
  }
}

export async function recordPlay(deviceId) {
  try {
    // Skip if Supabase is not configured (using placeholder URL)
    if (supabaseUrl.includes('your-project')) {
      return null
    }
    
    const { data, error } = await supabase
      .from('plays')
      .insert({
        device_id: deviceId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    // Silently fail if Supabase is not configured
    return null
  }
}

export async function redeemReward(code) {
  try {
    const { data, error } = await supabase
      .from('redemptions')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('redemption_code', code)
      .eq('redeemed', false)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error redeeming reward:', error)
    return null
  }
}

// Get device ID (simple implementation)
export function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('deviceId', deviceId)
  }
  return deviceId
}

