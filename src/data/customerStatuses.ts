export interface StatusPermissions {
  login: 'yes' | 'no' | 'limited';
  accrue: 'yes' | 'no' | 'bonus';
  redeem: 'yes' | 'no' | 'limited' | 'bonus';
  purchase: 'yes' | 'no' | 'limited';
  campaign: string;
  cshk: string;
}

export interface CustomerStatusConfig {
  code: string;
  systemStatus: 'New' | 'Active' | 'Suspended' | 'Inactive';
  classification: string;
  definition: string;
  triggerCondition: string;
  permissions: StatusPermissions;
  riskLevel: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất cao' | 'None';
  automation: string;
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
}

export const CUSTOMER_STATUSES: CustomerStatusConfig[] = [
  {
    code: 'NEW_MEMBER',
    systemStatus: 'New',
    classification: 'Thành viên mới',
    definition: 'Khách hàng vừa đăng ký tài khoản không phát sinh đơn hàng',
    triggerCondition: 'Tạo tài khoản mới',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'limited',
      purchase: 'yes',
      campaign: 'Welcome Campaign',
      cshk: '✅'
    },
    riskLevel: 'Thấp',
    automation: 'Welcome Journey',
    color: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/5',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20 dark:border-blue-500/10',
      badge: 'bg-blue-500 text-white'
    }
  },
  {
    code: 'ACTIVE',
    systemStatus: 'Active',
    classification: 'Hoạt động',
    definition: 'Khách hàng đang hoạt động bình thường',
    triggerCondition: 'Có giao dịch/tương tác trong thời gian quy định',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'yes',
      purchase: 'yes',
      campaign: '✅',
      cshk: '✅'
    },
    riskLevel: 'Thấp',
    automation: 'Loyalty, Upsell, Cross-sell',
    color: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20 dark:border-emerald-500/10',
      badge: 'bg-emerald-500 text-white'
    }
  },
  {
    code: 'VERIFIED',
    systemStatus: 'Active',
    classification: 'Đã xác minh',
    definition: 'Đã xác thực OTP/email/danh tính',
    triggerCondition: 'Hoàn tất xác minh',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'yes',
      purchase: 'yes',
      campaign: '✅',
      cshk: '✅'
    },
    riskLevel: 'Thấp',
    automation: 'Full Loyalty',
    color: {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/5',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-500/20 dark:border-cyan-500/10',
      badge: 'bg-cyan-500 text-white'
    }
  },
  {
    code: 'ACTIVE_LOYALTY',
    systemStatus: 'Active',
    classification: 'Loyalty hoạt động',
    definition: 'Đang tham gia loyalty',
    triggerCondition: 'Có điểm & membership',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'yes',
      purchase: 'yes',
      campaign: 'Loyalty Campaign',
      cshk: '✅'
    },
    riskLevel: 'Thấp',
    automation: 'Loyalty Automation',
    color: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/5',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-500/20 dark:border-indigo-500/10',
      badge: 'bg-indigo-500 text-white'
    }
  },
  {
    code: 'VIP',
    systemStatus: 'Active',
    classification: 'Khách hàng VIP',
    definition: 'Khách có CLV cao hoặc tier VIP',
    triggerCondition: 'Đạt điều kiện VIP',
    permissions: {
      login: 'yes',
      accrue: 'bonus',
      redeem: 'bonus',
      purchase: 'yes',
      campaign: 'VIP Campaign',
      cshk: 'Priority (Ưu tiên)'
    },
    riskLevel: 'Thấp',
    automation: 'VIP Journey',
    color: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/5',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20 dark:border-purple-500/10',
      badge: 'bg-purple-500 text-white'
    }
  },
  {
    code: 'INACTIVE',
    systemStatus: 'Active',
    classification: 'Không hoạt động',
    definition: 'Không mua hàng/tương tác thời gian dài',
    triggerCondition: '365 ngày không hoạt động',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'limited',
      purchase: 'yes',
      campaign: 'Giảm tần suất',
      cshk: 'Có'
    },
    riskLevel: 'Trung bình',
    automation: 'Reactivation Campaign',
    color: {
      bg: 'bg-zinc-500/10 dark:bg-zinc-500/5',
      text: 'text-zinc-600 dark:text-zinc-400',
      border: 'border-zinc-500/20 dark:border-zinc-500/10',
      badge: 'bg-zinc-500 text-white'
    }
  },
  {
    code: 'DORMANT',
    systemStatus: 'Active',
    classification: 'Khách ngủ quên',
    definition: 'Từng active/VIP nhưng lâu không quay lại',
    triggerCondition: '>180 ngày không mua (trước đó 30 / 60 CS sẽ liên hệ và tương tác nhiều lần nhưng không kết nối được)',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'limited',
      purchase: 'yes',
      campaign: 'Win-back Campaign',
      cshk: 'Ưu tiên kết nối'
    },
    riskLevel: 'Trung bình',
    automation: 'Recovery Flow',
    color: {
      bg: 'bg-orange-500/10 dark:bg-orange-500/5',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500/20 dark:border-orange-500/10',
      badge: 'bg-orange-500 text-white'
    }
  },
  {
    code: 'CHURN_RISK',
    systemStatus: 'Active',
    classification: 'Nguy cơ rời bỏ',
    definition: 'Có dấu hiệu giảm tương tác mạnh',
    triggerCondition: 'Giảm tần suất mua/ticket xấu',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'yes',
      purchase: 'yes',
      campaign: 'Retention Campaign',
      cshk: 'Ưu tiên CS khách hàng vụ việc'
    },
    riskLevel: 'Trung bình',
    automation: 'Retention Campaign',
    color: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/5',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20 dark:border-rose-500/10',
      badge: 'bg-rose-500 text-white'
    }
  },
  {
    code: 'MERGED',
    systemStatus: 'Active',
    classification: 'Gộp thông tin thành viên lại',
    definition: 'Khách hàng đang hoạt động bình thường',
    triggerCondition: 'Có giao dịch/tương tác trong thời gian quy định',
    permissions: {
      login: 'yes',
      accrue: 'yes',
      redeem: 'yes',
      purchase: 'yes',
      campaign: '✅',
      cshk: '✅'
    },
    riskLevel: 'Thấp',
    automation: 'Merged Account Handling',
    color: {
      bg: 'bg-teal-500/10 dark:bg-teal-500/5',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-500/20 dark:border-teal-500/10',
      badge: 'bg-teal-500 text-white'
    }
  },
  {
    code: 'PENDING_VERIFICATION',
    systemStatus: 'Suspended',
    classification: 'Chờ xác minh',
    definition: 'Chưa xác thực tài khoản',
    triggerCondition: 'Chưa verify OTP/email',
    permissions: {
      login: 'limited',
      accrue: 'no',
      redeem: 'no',
      purchase: 'limited',
      campaign: 'Verify Reminder',
      cshk: '✅'
    },
    riskLevel: 'Trung bình',
    automation: 'Verify Flow',
    color: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/5',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20 dark:border-amber-500/10',
      badge: 'bg-amber-500 text-white'
    }
  },
  {
    code: 'TEMP_LOCK',
    systemStatus: 'Suspended',
    classification: 'Tạm khóa',
    definition: 'Tạm khóa do nghi ngờ bất thường',
    triggerCondition: 'Login/fraud bất thường',
    permissions: {
      login: 'no',
      accrue: 'no',
      redeem: 'no',
      purchase: 'no',
      campaign: '❌',
      cshk: 'Escalation (Báo cáo khẩn)'
    },
    riskLevel: 'Cao',
    automation: 'Fraud Review',
    color: {
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/5',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-500/20 dark:border-yellow-500/10',
      badge: 'bg-yellow-500 text-white font-bold'
    }
  },
  {
    code: 'SUSPENDED',
    systemStatus: 'Suspended',
    classification: 'Đình chỉ',
    definition: 'Vi phạm chính sách loyalty',
    triggerCondition: 'Abuse/refund fraud',
    permissions: {
      login: 'no',
      accrue: 'no',
      redeem: 'no',
      purchase: 'no',
      campaign: '❌',
      cshk: 'Compliance Review (Xem xét tuân thủ)'
    },
    riskLevel: 'Cao',
    automation: 'Compliance Review',
    color: {
      bg: 'bg-red-500/10 dark:bg-red-500/5',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/20 dark:border-red-500/10',
      badge: 'bg-red-500 text-white'
    }
  },
  {
    code: 'DEACTIVATED',
    systemStatus: 'Inactive',
    classification: 'Ngưng hoạt động',
    definition: 'Khách yêu cầu đóng tài khoản',
    triggerCondition: 'Request từ khách/admin',
    permissions: {
      login: 'no',
      accrue: 'no',
      redeem: 'no',
      purchase: 'no',
      campaign: '❌',
      cshk: 'Giới hạn hỗ trợ'
    },
    riskLevel: 'Thấp',
    automation: 'Archive Process',
    color: {
      bg: 'bg-gray-500/10 dark:bg-gray-500/5',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-500/20 dark:border-gray-500/10',
      badge: 'bg-gray-500 text-white'
    }
  },
  {
    code: 'BLACKLISTED',
    systemStatus: 'Inactive',
    classification: 'Danh sách đen',
    definition: 'Gian lận/nguy cơ cao',
    triggerCondition: 'Fraud/scam/social attack',
    permissions: {
      login: 'no',
      accrue: 'no',
      redeem: 'no',
      purchase: 'no',
      campaign: '❌',
      cshk: 'An ninh / Security Block'
    },
    riskLevel: 'Rất cao',
    automation: 'Security Block Workflow',
    color: {
      bg: 'bg-slate-900/10 dark:bg-slate-900/40',
      text: 'text-slate-900 dark:text-slate-300',
      border: 'border-slate-950/20 dark:border-slate-800/10',
      badge: 'bg-slate-900 dark:bg-slate-800 text-white'
    }
  },
  {
    code: 'DELETED',
    systemStatus: 'Inactive',
    classification: 'Xóa dữ liệu',
    definition: 'Xóa dữ liệu theo yêu cầu',
    triggerCondition: 'GDPR/PDP request',
    permissions: {
      login: 'no',
      accrue: 'no',
      redeem: 'no',
      purchase: 'no',
      campaign: '❌',
      cshk: '❌'
    },
    riskLevel: 'None',
    automation: 'Data Removal Script',
    color: {
      bg: 'bg-stone-500/10 dark:bg-stone-500/5',
      text: 'text-stone-600 dark:text-stone-400',
      border: 'border-stone-500/20 dark:border-stone-500/10',
      badge: 'bg-stone-500 text-white'
    }
  }
];
