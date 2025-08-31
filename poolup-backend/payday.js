const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();

// Initialize database connection
let db;
(async () => {
  db = await open({
    filename: './poolup.db',
    driver: sqlite3.Database
  });
})();

// Calculate next payday based on user's settings
function getNextPayday(paydaySettings) {
  const today = new Date();
  
  if (paydaySettings.type === 'weekly') {
    const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    const targetDay = dayMap[paydaySettings.weekly_day];
    const nextPayday = new Date(today);
    const daysUntilPayday = (targetDay - today.getDay() + 7) % 7;
    nextPayday.setDate(today.getDate() + (daysUntilPayday === 0 ? 7 : daysUntilPayday));
    return nextPayday;
  }
  
  if (paydaySettings.type === 'biweekly') {
    const startDate = new Date(paydaySettings.biweekly_start);
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
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
  
  // Default to weekly Friday if no settings
  const nextFriday = new Date(today);
  const daysUntilFriday = (5 - today.getDay() + 7) % 7;
  nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
  return nextFriday;
}

// Check if contribution is within streak window
function isWithinStreakWindow(contributionDate, payday, windowDays = 3) {
  const contribution = new Date(contributionDate);
  const paydate = new Date(payday);
  
  // Allow contributions 1 day before payday to 3 days after
  const windowStart = new Date(paydate);
  windowStart.setDate(paydate.getDate() - 1);
  
  const windowEnd = new Date(paydate);
  windowEnd.setDate(paydate.getDate() + windowDays);
  
  return contribution >= windowStart && contribution <= windowEnd;
}

// Calculate user's current streak
async function calculateStreak(userId) {
  try {
    const paydaySettings = await getPaydaySettings(userId);
    if (!paydaySettings || !paydaySettings.enable_streaks) {
      return { streak: 0, nextPayday: null };
    }
    
    const contributions = await db.all(
      'SELECT * FROM contributions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    
    if (contributions.length === 0) {
      return { streak: 0, nextPayday: getNextPayday(paydaySettings) };
    }
    
    let streak = 0;
    let currentPayday = getNextPayday(paydaySettings);
    
    // Work backwards from current payday to count streak
    for (let i = 0; i < 10; i++) { // Check last 10 pay periods
      const payPeriodStart = new Date(currentPayday);
      if (paydaySettings.type === 'weekly') {
        payPeriodStart.setDate(currentPayday.getDate() - 7);
      } else if (paydaySettings.type === 'biweekly') {
        payPeriodStart.setDate(currentPayday.getDate() - 14);
      } else if (paydaySettings.type === 'monthly') {
        payPeriodStart.setMonth(currentPayday.getMonth() - 1);
      }
      
      // Check if user contributed in this pay period
      const contributionInPeriod = contributions.find(c => 
        isWithinStreakWindow(c.created_at, currentPayday)
      );
      
      if (contributionInPeriod) {
        streak++;
        // Move to previous pay period
        currentPayday = new Date(payPeriodStart);
      } else {
        break; // Streak broken
      }
    }
    
    return { 
      streak, 
      nextPayday: getNextPayday(paydaySettings),
      paydaySettings 
    };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return { streak: 0, nextPayday: null };
  }
}

// Get user's payday settings
async function getPaydaySettings(userId) {
  try {
    const settings = await db.get(
      'SELECT * FROM payday_settings WHERE user_id = ?',
      [userId]
    );
    
    if (settings) {
      return {
        type: settings.type,
        weekly_day: settings.weekly_day,
        biweekly_start: settings.biweekly_start,
        monthly_dates: JSON.parse(settings.monthly_dates || '["1", "15"]'),
        enable_streaks: settings.enable_streaks === 1,
        reminder_days: settings.reminder_days || 1
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting payday settings:', error);
    return null;
  }
}

// Update user's payday settings
async function updatePaydaySettings(userId, settings) {
  try {
    await db.run(`
      INSERT OR REPLACE INTO payday_settings 
      (user_id, type, weekly_day, biweekly_start, monthly_dates, enable_streaks, reminder_days, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      userId,
      settings.type,
      settings.weekly_day,
      settings.biweekly_start,
      JSON.stringify(settings.monthly_dates),
      settings.enable_streaks ? 1 : 0,
      settings.reminder_days
    ]);
    
    return true;
  } catch (error) {
    console.error('Error updating payday settings:', error);
    throw error;
  }
}

// Get users who need reminders today
async function getUsersNeedingReminders() {
  try {
    const users = await db.all(`
      SELECT u.id, u.name, u.email, ps.*
      FROM users u
      JOIN payday_settings ps ON u.id = ps.user_id
      WHERE ps.enable_streaks = 1
    `);
    
    const usersToRemind = [];
    
    for (const user of users) {
      const paydaySettings = {
        type: user.type,
        weekly_day: user.weekly_day,
        biweekly_start: user.biweekly_start,
        monthly_dates: JSON.parse(user.monthly_dates || '["1", "15"]'),
        enable_streaks: user.enable_streaks === 1,
        reminder_days: user.reminder_days || 1
      };
      
      const nextPayday = getNextPayday(paydaySettings);
      const today = new Date();
      const daysUntilPayday = Math.ceil((nextPayday - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilPayday === paydaySettings.reminder_days) {
        usersToRemind.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          nextPayday,
          paydaySettings
        });
      }
    }
    
    return usersToRemind;
  } catch (error) {
    console.error('Error getting users needing reminders:', error);
    return [];
  }
}

module.exports = {
  getNextPayday,
  isWithinStreakWindow,
  calculateStreak,
  getPaydaySettings,
  updatePaydaySettings,
  getUsersNeedingReminders
};
