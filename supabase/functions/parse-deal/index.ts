
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { deal_id, file_path, zip_code } = await req.json()

    if (!deal_id) throw new Error('Missing deal_id')

    // 模拟OCR解析延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟提取的数据
    const extracted_fields = {
      vehicle_name: "2021 Honda CR-V EX-L",
      selling_price: 26500,
      fees: 900,
      add_ons: 2100,
      otd_price: 29500,
      apr: 8.5,
      term: 60,
      monthly_payment: 605,
      mileage: 32000,
      vin: "1HKRW2H87ME000000"
    }

    const preview_data = {
      risk_count: 3,
      potential_savings_range: "¥10,000 - ¥20,000",
      risk_message: "此交易包含高利润附加项和虚高费用。"
    }

    // 更新 Deals 表
    const { error: updateError } = await supabaseClient
      .from('deals')
      .update({
        status: 'parsed',
        extracted_fields,
        preview_data
      })
      .eq('id', deal_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, data: extracted_fields }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
