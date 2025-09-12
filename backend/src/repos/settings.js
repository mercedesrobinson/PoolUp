const { query } = require('../db/pg');

async function getPrivacy(userId) {
  const { rows } = await query('SELECT is_public, allow_encouragement FROM privacy WHERE user_id = $1', [userId]);
  return rows[0] || { isPublic: true, allowEncouragement: true };
}

async function setPrivacy(userId, patch) {
  const current = await getPrivacy(userId);
  const is_public = typeof patch.isPublic === 'boolean' ? patch.isPublic : current.is_public ?? true;
  const allow_encouragement = typeof patch.allowEncouragement === 'boolean' ? patch.allowEncouragement : current.allow_encouragement ?? true;
  await query(
    `INSERT INTO privacy (user_id, is_public, allow_encouragement)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET is_public = EXCLUDED.is_public, allow_encouragement = EXCLUDED.allow_encouragement`,
    [userId, is_public, allow_encouragement]
  );
}

async function setPushToken(userId, pushToken) {
  await query(
    `INSERT INTO notification_tokens (user_id, push_token)
     VALUES ($1,$2)
     ON CONFLICT (user_id) DO UPDATE SET push_token = EXCLUDED.push_token`,
    [userId, pushToken || null]
  );
}

async function setNotificationPreferences(userId, prefs) {
  await query(
    `INSERT INTO notification_preferences (user_id, prefs)
     VALUES ($1,$2)
     ON CONFLICT (user_id) DO UPDATE SET prefs = EXCLUDED.prefs`,
    [userId, prefs || {}]
  );
}

module.exports = { getPrivacy, setPrivacy, setPushToken, setNotificationPreferences };

