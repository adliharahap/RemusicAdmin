// utils/serializeUser.js
export const serializeUser = (u) => {
  if (!u) return null;
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified,
    accessToken: u.accessToken, // kalau butuh
  };
};
