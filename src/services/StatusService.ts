import { CustomerStatusConfig, CUSTOMER_STATUSES } from "@/data/customerStatuses";

export interface CustomerActivityMetrics {
  lastInteractionDays: number;
  lastPurchaseDays: number;
  totalOrders: number;
  isVerified: boolean;
  isLoyaltyMember: boolean;
  clv: number;
  isVip: boolean;
  hasHighRiskFlags: boolean;
}

export class StatusService {
  /**
   * Determines the best status for a customer based on their metrics
   */
  static determineStatus(metrics: CustomerActivityMetrics): CustomerStatusConfig {
    // 14. BLACKLISTED / 12. SUSPENDED (Priority for fraud/security)
    if (metrics.hasHighRiskFlags) {
      return CUSTOMER_STATUSES.find(s => s.code === 'BLACKLISTED') || CUSTOMER_STATUSES[1];
    }

    // 1. NEW MEMBER
    if (metrics.totalOrders === 0 && metrics.lastInteractionDays <= 30) {
      if (!metrics.isVerified) return CUSTOMER_STATUSES.find(s => s.code === 'PENDING_VERIFICATION') || CUSTOMER_STATUSES[0];
      return CUSTOMER_STATUSES.find(s => s.code === 'NEW_MEMBER') || CUSTOMER_STATUSES[0];
    }

    // 5. VIP
    if (metrics.isVip || metrics.clv > 50000000) { // Example threshold: 50M VND
      return CUSTOMER_STATUSES.find(s => s.code === 'VIP') || CUSTOMER_STATUSES[4];
    }

    // 6. INACTIVE (365 days)
    if (metrics.lastInteractionDays > 365) {
      return CUSTOMER_STATUSES.find(s => s.code === 'INACTIVE') || CUSTOMER_STATUSES[5];
    }

    // 7. DORMANT (> 180 days)
    if (metrics.lastInteractionDays > 180) {
      return CUSTOMER_STATUSES.find(s => s.code === 'DORMANT') || CUSTOMER_STATUSES[6];
    }

    // 8. CHURN RISK (Signs of decreasing interaction)
    if (metrics.lastInteractionDays > 60 && metrics.lastInteractionDays <= 180) {
      return CUSTOMER_STATUSES.find(s => s.code === 'CHURN_RISK') || CUSTOMER_STATUSES[7];
    }

    // 4. ACTIVE LOYALTY
    if (metrics.isLoyaltyMember) {
      return CUSTOMER_STATUSES.find(s => s.code === 'ACTIVE_LOYALTY') || CUSTOMER_STATUSES[3];
    }

    // 3. VERIFIED
    if (metrics.isVerified) {
      return CUSTOMER_STATUSES.find(s => s.code === 'VERIFIED') || CUSTOMER_STATUSES[2];
    }

    // 2. ACTIVE (Default)
    return CUSTOMER_STATUSES.find(s => s.code === 'ACTIVE') || CUSTOMER_STATUSES[1];
  }

  /**
   * Returns valid next status transitions for UI
   */
  static getNextTransitions(currentCode: string): string[] {
    const transitions: Record<string, string[]> = {
      'NEW_MEMBER': ['ACTIVE', 'VERIFIED', 'PENDING_VERIFICATION', 'DEACTIVATED'],
      'PENDING_VERIFICATION': ['VERIFIED', 'DEACTIVATED', 'BLACKLISTED'],
      'ACTIVE': ['VIP', 'CHURN_RISK', 'INACTIVE', 'TEMP_LOCK', 'DEACTIVATED', 'MERGED'],
      'VERIFIED': ['ACTIVE_LOYALTY', 'VIP', 'CHURN_RISK', 'TEMP_LOCK'],
      'ACTIVE_LOYALTY': ['VIP', 'CHURN_RISK', 'DORMANT'],
      'VIP': ['ACTIVE_LOYALTY', 'CHURN_RISK', 'DORMANT'],
      'CHURN_RISK': ['ACTIVE', 'DORMANT', 'INACTIVE'],
      'DORMANT': ['ACTIVE', 'WINBACK_ACTIVE', 'INACTIVE'],
      'INACTIVE': ['ACTIVE', 'DELETED'],
      'TEMP_LOCK': ['ACTIVE', 'SUSPENDED', 'BLACKLISTED'],
      'SUSPENDED': ['ACTIVE', 'BLACKLISTED', 'DEACTIVATED'],
    };

    return transitions[currentCode] || ['ACTIVE', 'DEACTIVATED'];
  }
}
