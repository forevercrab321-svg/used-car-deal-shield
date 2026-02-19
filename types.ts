export enum VehicleType {
  NEW = 'new',
  USED = 'used',
  LEASE = 'lease'
}

export enum DealStatus {
  UPLOADED = 'uploaded',
  PARSED = 'parsed',
  ANALYZED = 'analyzed'
}

export interface ExtractedFields {
  msrp?: number;
  selling_price: number;
  fees: number;
  add_ons: number;
  otd_price: number;
  apr?: number;
  term?: number;
  monthly_payment?: number;
  vehicle_name: string;
  vin?: string;
  mileage?: number;
}

export interface Deal {
  deal_id: string;
  user_id: string;
  vehicle_type: VehicleType;
  file_id: string;
  zip_code: string;
  extracted_fields: ExtractedFields;
  status: DealStatus;
  created_at: string;
  preview?: {
    risk_count: number;
    potential_savings_range: string; // e.g. "$1,500 - $3,000"
    risk_message: string;
  };
}

export interface RedFlag {
  name: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggested_action: string;
  estimated_savings: number;
}

export interface NegotiationScripts {
  email: string;
  in_person: string;
}

export interface Report {
  report_id: string;
  deal_id: string;
  deal_score: number; // 0-100
  score_category: 'Excellent' | 'Fair' | 'Risky' | 'Bad';
  red_flags: RedFlag[];
  target_otd_range: {
    min: number;
    max: number;
  };
  negotiation_script: NegotiationScripts;
  summary: string;
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  credits: number;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Review {
  id: string;
  user_id: string;
  deal_id: string;
  rating: number; // 1-5
  comment: string;
  is_verified: boolean;
  created_at: string;
  user_name?: string;
}