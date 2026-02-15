
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            deals: {
                Row: {
                    created_at: string
                    extracted_fields: Json | null
                    file_name: string | null
                    file_path: string | null
                    id: string
                    preview_data: Json | null
                    status: string | null
                    user_id: string
                    vehicle_type: string | null
                    zip_code: string | null
                }
                Insert: {
                    created_at?: string
                    extracted_fields?: Json | null
                    file_name?: string | null
                    file_path?: string | null
                    id?: string
                    preview_data?: Json | null
                    status?: string | null
                    user_id: string
                    vehicle_type?: string | null
                    zip_code?: string | null
                }
                Update: {
                    created_at?: string
                    extracted_fields?: Json | null
                    file_name?: string | null
                    file_path?: string | null
                    id?: string
                    preview_data?: Json | null
                    status?: string | null
                    user_id?: string
                    vehicle_type?: string | null
                    zip_code?: string | null
                }
            }
            profiles: {
                Row: {
                    created_at: string
                    credits: number | null
                    email: string | null
                    full_name: string | null
                    id: string
                }
                Insert: {
                    created_at?: string
                    credits?: number | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                }
                Update: {
                    created_at?: string
                    credits?: number | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                }
            }
            reports: {
                Row: {
                    category: string | null
                    created_at: string
                    deal_id: string
                    id: string
                    negotiation_script: Json | null
                    red_flags: Json | null
                    score: number | null
                    summary: string | null
                    target_otd_range: Json | null
                }
                Insert: {
                    category?: string | null
                    created_at?: string
                    deal_id: string
                    id?: string
                    negotiation_script?: Json | null
                    red_flags?: Json | null
                    score?: number | null
                    summary?: string | null
                    target_otd_range?: Json | null
                }
                Update: {
                    category?: string | null
                    created_at?: string
                    deal_id?: string
                    id?: string
                    negotiation_script?: Json | null
                    red_flags?: Json | null
                    score?: number | null
                    summary?: string | null
                    target_otd_range?: Json | null
                }
            }
        }
    }
}
