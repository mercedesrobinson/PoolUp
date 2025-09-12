function publicUser(u) {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    profile_image_url: u.profile_image_url || null,
  };
}

module.exports = { publicUser };
