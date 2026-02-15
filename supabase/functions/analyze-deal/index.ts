
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

        const { deal_id } = await req.json()

        if (!deal_id) throw new Error('Missing deal_id')

        // 模拟分析延迟
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 模拟生成的报告数据
        const reportData = {
            deal_id: deal_id,
            score: 42,
            category: 'Risky', // Excellent, Fair, Risky, Bad
            red_flags: [
                {
                    name: "GPS 追踪器费用",
                    severity: 'high',
                    description: "经销商添加了 ¥899 的 GPS 设备，这是不必要的。",
                    suggested_action: "要求移除。这通常是预装项目，可以禁用。",
                    estimated_savings: 899
                },
                {
                    name: "整备费 (Reconditioning Fee)",
                    severity: 'high',
                    description: "收取 ¥1,200 的车辆检查费，这部分成本应已包含在车价中。",
                    suggested_action: "拒绝支付。广告价格应包含车辆可销售状态的成本。",
                    estimated_savings: 1200
                },
                {
                    name: "文档处理费 (Doc Fee)",
                    severity: 'medium',
                    description: "文档费 (¥699) 高于平均水平 (¥150)。",
                    suggested_action: "要求降低售价以抵消此费用。",
                    estimated_savings: 550
                }
            ],
            target_otd_range: {
                min: 24500,
                max: 25200
            },
            summary: "这项二手车交易包含许多“垃圾费用”。整备费和 GPS 追踪器完全是经销商的额外利润。你可能面临多支付超过 ¥2,600 的风险。",
            negotiation_script: {
                email: `您好，\n\n我准备购买这辆车，但我不能接受 ¥899 的 GPS 费用或 ¥1,200 的整备费。这些项目在网上报价中并未披露。\n\n我出价 ¥25,000 落地价，这是该 VIN 的公平市场价值。如果您能接受这个价格并移除附加项，我今天就可以签约。\n\n谢谢`,
                in_person: `我喜欢这辆车，但我注意到这个“整备费”。检查车辆不是由于商家的经营成本吗？我不应该为车辆达到可销售状态额外付费。另外，我不需要这个 GPS 设备。如果我们能去掉这些并达成 ¥25,000 的落地价，我们就成交。`
            }
        }

        // 插入 Reports 表
        const { data, error: insertError } = await supabaseClient
            .from('reports')
            .insert(reportData)
            .select()
            .single()

        if (insertError) throw insertError

        // 更新 Deal 状态
        await supabaseClient
            .from('deals')
            .update({ status: 'analyzed' })
            .eq('id', deal_id)

        return new Response(
            JSON.stringify({ success: true, data: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
