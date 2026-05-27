export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  facebook?: string;
  zalo?: string;
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
  points?: number;
  lastTransactionAt?: any;
  activityStatus?: 'active' | 'inactive' | 'churn_risk';
  companyId?: string;
  userId: string;
  customFields?: Record<string, any>;
  createdAt: any; // ServerTimestamp
  updatedAt: any; // ServerTimestamp
}

export interface AttributeDefinition {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'time';
  userId: string;
  createdAt: any;
  placeholder?: string;
  isRequired?: boolean;
  defaultValue?: string;
  options?: string[]; // for select, radio, checkbox
}

export interface TierCondition {
  field: 'points' | 'spend' | 'orders' | 'referrals' | 'days_since_join' | 'custom_attribute';
  operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq';
  value: any;
  attributeKey?: string; // used if field is 'custom_attribute'
}

export interface TierConfig {
  id: string;
  name: string;
  threshold: number;
  multiplier?: number;
  conditions?: TierCondition[];
  color?: string;
  userId: string;
  createdAt: any;
}

export interface RedemptionRule {
  id: string;
  name: string;
  pointsRequired: number;
  rewardValue: number;
  rewardType: 'discount' | 'voucher' | 'item';
  userId: string;
  createdAt: any;
}

export interface EarnRule {
  id: string;
  name: string;
  type: 'purchase' | 'review' | 'referral' | 'checkin' | 'birthday' | 'ai_styling' | 'social_share';
  value?: number; // per unit (e.g. per 100k)
  points: number; // points awarded
  isActive: boolean;
  userId: string;
  createdAt: any;
}

export interface LoyaltyCampaign {
  id: string;
  name: string;
  type: 'birthday' | 'anniversary' | 'winback' | 'milestone' | 'event';
  description?: string;
  rewardType: 'points' | 'voucher' | 'gift';
  rewardValue: number;
  isActive: boolean;
  userId: string;
  createdAt: any;
}

export interface LoyaltySettings {
  id: string;
  inactiveThresholdDays: number;
  churnThresholdDays: number;
  autoApplyStatus: boolean;
  userId: string;
  updatedAt: any;
}

export interface SegmentationRule {
  id: string;
  name: string;
  tag: string;
  color: string;
  criteriaType: 'total_spend' | 'time_since_last_purchase' | 'points_balance';
  operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq';
  value: number; // value can represent points, spend in VND, or space/days in inactivity
  isActive: boolean;
  userId: string;
  createdAt: any;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  userId: string;
  createdAt: any;
}
