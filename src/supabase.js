import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://echfmsvswrnvdhmsfrly.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_oDm3PY6_NH22pQiVucSMqw_lEz0mcLU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Convert base64 data URL to Blob and upload to Supabase Storage
export async function uploadFileFromBase64(base64DataUrl, bucket, originalName) {
  if (!base64DataUrl || !base64DataUrl.startsWith('data:')) return base64DataUrl

  const arr = base64DataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  const blob = new Blob([u8arr], { type: mime })

  const ext = (originalName || '').split('.').pop() || mime.split('/')[1] || 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: mime,
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
