import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import db from './db';

interface PaydaySettings {
  type: 'weekly' | 'biweekly' | 'monthly';
  weekly_day?: string;
  biweekly_start?: string;
  monthly_dates?: string[];
}

interface PaydayReminder {
  id: string;
  user_id: string;
  pool_id: string;
  reminder_type: string;
  scheduled_for: string;
  message: string;
  sent: boolean;
}

interface AutoContribution {
  id: string;
  user_id: string;
  pool_id: string;
  amount_cents: number;
  percentage?: number;
  is_active: boolean;
}

// Calculate next payday based on user's settings
function getNextPayday(paydaySettings: PaydaySettings): Date {
  const today = new Date();
  
  if (paydaySettings.type === 'weekly') {
    const dayMap: Record<string, number> = { 
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4, 
      friday: 5, saturday: 6, sunday: 0 
    };
    const targetDay = dayMap[paydaySettings.weekly_day || 'friday'];
    const nextPayday = new Date(today);
    const daysUntilPayday = (targetDay - today.getDay() + 7) % 7;
    nextPayday.setDate(today.getDate() + (daysUntilPayday === 0 ? 7 : daysUntilPayday));
    return nextPayday;
  }
  
  if (paydaySettings.type === 'biweekly') {
    const startDate = new Date(paydaySettings.biweekly_start || today.toISOString());
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksSinceStart = Math.floor(daysSinceStart / 14);
    const nextPayday = new Date(startDate);
    nextPayday.setDate(startDate.getDate() + ((weeksSinceStart + 1) * 14));
    return nextPayday;
  }
  
  if (paydaySettings.type === 'monthly') {
    const dates = paydaySettings.monthly_dates || ['1', '15'];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Find next payday date in current or next month
    for (const dateStr of dates) {
      const date = parseInt(dateStr);
      let nextPayday = new Date(currentYear, currentMonth, date);
      
      if (nextPayday > today) {
        return nextPayday;
      }
    }
    
    // If no dates left in current month, get first date of next month
    const firstDate = parseInt(dates[0]);
    return new Date(currentYear, currentMonth + 1, firstDate);
  }
  
  // Default to weekly Friday if no valid type
  return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
}

// Set up automatic contributions for payday
export function setupAutoContribution(
  userId: string, 
  poolId: string, 
  amountCents: number, 
  percentage?: number
): string {
  const autoContribId = require('uuid').v4();
  
  db.prepare(`
    INSERT INTO auto_contributions (id, user_id, pool_id, amount_cents, percentage, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(autoContribId, userId, poolId, amountCents, percentage || null, 1);
  
  return autoContribId;
}

// Process payday contributions
export function processPaydayContributions(userId: string): void {
  const autoContributions = db.prepare(`
    SELECT * FROM auto_contributions 
    WHERE user_id = ? AND is_active = 1
  `).all(userId) as AutoContribution[];
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return;
  
  autoContributions.forEach((autoContrib: AutoContribution) => {
    let contributionAmount = autoContrib.amount_cents;
    
    // If percentage-based, calculate from user's balance
    if (autoContrib.percentage) {
      contributionAmount = Math.floor(user.balance_cents * (autoContrib.percentage / 100));
    }
    
    // Check if user has sufficient balance
    if (user.balance_cents >= contributionAmount) {
      // Create contribution
      const contributionId = require('uuid').v4();
      db.prepare(`
        INSERT INTO contributions (id, pool_id, user_id, amount_cents, payment_method, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(contributionId, autoContrib.pool_id, userId, contributionAmount, 'auto_payday', 'completed');
      
      // Update user balance
      db.prepare('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?')
        .run(contributionAmount, userId);
      
      // Update pool progress
      db.prepare(`
        UPDATE memberships 
        SET total_contributed_cents = total_contributed_cents + ?
        WHERE user_id = ? AND pool_id = ?
      `).run(contributionAmount, userId, autoContrib.pool_id);
      
      console.log(`Auto-contribution processed: $${(contributionAmount / 100).toFixed(2)} for user ${userId}`);
    } else {
      console.log(`Insufficient funds for auto-contribution: user ${userId}, needed $${(contributionAmount / 100).toFixed(2)}`);
    }
  });
}

// Schedule payday reminders
export function schedulePaydayReminders(userId: string, paydaySettings: PaydaySettings): void {
  const nextPayday = getNextPayday(paydaySettings);
  const reminderDate = new Date(nextPayday.getTime() - 24 * 60 * 60 * 1000); // 1 day before
  
  const reminderId = require('uuid').v4();
  db.prepare(`
    INSERT INTO payday_reminders (id, user_id, reminder_type, scheduled_for, message, sent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    reminderId, 
    userId, 
    'payday_tomorrow',
    reminderDate.toISOString(),
    'Your payday is tomorrow! Don\'t forget to contribute to your savings pools.',
    0
  );
}

// Get user's payday settings
export function getUserPaydaySettings(userId: string): PaydaySettings | null {
  const settings = db.prepare('SELECT payday_settings FROM users WHERE id = ?').get(userId) as any;
  
  if (settings?.payday_settings) {
    try {
      return JSON.parse(settings.payday_settings);
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

// Update user's payday settings
export function updatePaydaySettings(userId: string, settings: PaydaySettings): void {
  db.prepare('UPDATE users SET payday_settings = ? WHERE id = ?')
    .run(JSON.stringify(settings), userId);
  
  // Reschedule reminders with new settings
  schedulePaydayReminders(userId, settings);
}

// Get upcoming paydays for user
export function getUpcomingPaydays(userId: string, days: number = 30): Date[] {
  const settings = getUserPaydaySettings(userId);
  if (!settings) return [];
  
  const paydays: Date[] = [];
  let currentPayday = getNextPayday(settings);
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  while (currentPayday <= endDate) {
    paydays.push(new Date(currentPayday));
    
    // Calculate next payday after current one
    const tempSettings = { ...settings };
    if (settings.type === 'weekly') {
      currentPayday.setDate(currentPayday.getDate() + 7);
    } else if (settings.type === 'biweekly') {
      currentPayday.setDate(currentPayday.getDate() + 14);
    } else if (settings.type === 'monthly') {
      currentPayday.setMonth(currentPayday.getMonth() + 1);
    }
  }
  
  return paydays;
}

// Calculate optimal contribution amount based on payday frequency
export function calculateOptimalContribution(
  poolGoalCents: number, 
  currentAmountCents: number, 
  daysRemaining: number, 
  paydaySettings: PaydaySettings
): number {
  const remainingAmount = poolGoalCents - currentAmountCents;
  const paydays = getUpcomingPaydays('temp', daysRemaining);
  const paydaysRemaining = paydays.length;
  
  if (paydaysRemaining === 0) return remainingAmount;
  
  return Math.ceil(remainingAmount / paydaysRemaining);
}

// Process all pending payday reminders
export function processPendingReminders(): void {
  const now = new Date().toISOString();
  const pendingReminders = db.prepare(`
    SELECT * FROM payday_reminders 
    WHERE sent = 0 AND scheduled_for <= ?
  `).all(now) as PaydayReminder[];
  
  pendingReminders.forEach((reminder: PaydayReminder) => {
    // Send notification (integrate with notifications service)
    console.log(`Sending payday reminder to user ${reminder.user_id}: ${reminder.message}`);
    
    // Mark as sent
    db.prepare('UPDATE payday_reminders SET sent = 1 WHERE id = ?').run(reminder.id);
  });
}

export { getNextPayday };
