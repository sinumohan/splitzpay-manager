export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  owner_id: string
  is_active: boolean
  created_at: string
}

export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: 'admin' | 'manager' | 'member'
  invited_by: string | null
  joined_at: string
  profiles?: Profile
  companies?: Company
}

export interface ChitFund {
  id: string
  company_id: string
  name: string
  description: string | null
  duration_months: number
  monthly_amount: number
  total_amount: number
  max_members: number
  commission_rate: number
  start_date: string | null
  end_date: string | null
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  is_listed: boolean
  created_by: string | null
  created_at: string
  fund_members?: { count: number }[]
  fund_manager_assignments?: FundManagerAssignment[]
  marketplace_listings?: MarketplaceListing[]
}

export interface FundMember {
  id: string
  fund_id: string
  user_id: string
  status: 'invited' | 'pending' | 'approved' | 'rejected'
  slot_number: number | null
  joined_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: Profile
}

export interface FundManagerAssignment {
  id: string
  fund_id: string
  manager_id: string
  assigned_by: string | null
  created_at: string
  profiles?: Profile
}

export interface Auction {
  id: string
  fund_id: string
  month_number: number
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  min_bid: number | null
  created_by: string | null
  auction_bids?: AuctionBid[]
  auction_winners?: AuctionWinner[]
  chit_funds?: ChitFund
}

export interface AuctionBid {
  id: string
  auction_id: string
  member_id: string
  bid_amount: number
  is_withdrawn: boolean
  created_at: string
  profiles?: Profile
}

export interface AuctionWinner {
  id: string
  auction_id: string
  fund_id: string
  winner_id: string
  winning_bid: number
  total_pool: number
  commission_amount: number
  profit_per_member: number
  payout_amount: number
  announced_at: string
  profiles?: Profile
}

export interface Document {
  id: string
  user_id: string
  fund_id: string | null
  document_type: string
  file_url: string
  file_name: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: Profile
}

export interface FundJoinRequest {
  id: string
  fund_id: string
  user_id: string
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: Profile
}

export interface MarketplaceListing {
  id: string
  fund_id: string
  is_active: boolean
  featured: boolean
  tags: string[]
  listed_at: string
}

export interface NotificationConfig {
  id: string
  fund_id: string
  event_type: string
  is_enabled: boolean
  email_template: string | null
  configured_by: string | null
  updated_at: string
}
