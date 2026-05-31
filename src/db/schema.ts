import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, decimal, boolean } from 'drizzle-orm/pg-core';

// Define the 'users' table (Firebase users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  role: text('role').default('Manager'), // Admin, Manager, Support
  status: text('status').default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define 'loyalty_tiers'
export const loyaltyTiers = pgTable('loyalty_tiers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // Silver, Gold, etc.
  threshold: decimal('threshold', { precision: 20, scale: 2 }).notNull(),
  multiplier: decimal('multiplier', { precision: 5, scale: 2 }).default('1.00'),
  color: text('color'),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'customers'
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // For omnichannel link if needed
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  tierId: integer('tier_id').references(() => loyaltyTiers.id),
  pointsBalance: integer('points_balance').default(0),
  lifetimeSpend: decimal('lifetime_spend', { precision: 20, scale: 2 }).default('0.00'),
  customFields: text('custom_fields'), // JSON string or text block
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define 'transactions'
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
  pointsEarned: integer('points_earned').default(0),
  type: text('type').default('purchase'), // purchase, redemption, adjustment
  storeId: text('store_id'),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'campaigns'
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ruleType: text('rule_type').notNull(),
  bonusPoints: integer('bonus_points').default(0),
  rewardType: text('reward_type'),
  rewardValue: decimal('reward_value', { precision: 20, scale: 2 }),
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define Relationships
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  tiers: many(loyaltyTiers),
  campaigns: many(campaigns),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  tier: one(loyaltyTiers, {
    fields: [customers.tierId],
    references: [loyaltyTiers.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
}));
