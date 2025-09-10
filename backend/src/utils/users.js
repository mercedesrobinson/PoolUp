function getUserByEmail(db, email) {
  const e = String(email || '').toLowerCase();
  return db.users.find((u) => (u.email || '').toLowerCase() === e);
}

function publicUser(u) {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    profile_image_url: u.profile_image_url || null,
  };
}

module.exports = { getUserByEmail, publicUser };

