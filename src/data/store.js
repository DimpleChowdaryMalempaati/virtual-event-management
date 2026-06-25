const users = [];
const events = [];
const tokenBlacklist = new Map();

let userIdCounter = 1;
let eventIdCounter = 1;

function generateUserId() {
  return userIdCounter++;
}

function generateEventId() {
  return eventIdCounter++;
}

function blacklistToken(jti, expiresAt) {
  tokenBlacklist.set(jti, expiresAt);
}

function isTokenBlacklisted(jti) {
  if (!jti) {
    return false;
  }

  const expiresAt = tokenBlacklist.get(jti);

  if (!expiresAt) {
    return false;
  }

  if (Date.now() >= expiresAt * 1000) {
    tokenBlacklist.delete(jti);
    return false;
  }

  return true;
}

function cleanupExpiredTokens() {
  const now = Date.now();

  for (const [jti, expiresAt] of tokenBlacklist.entries()) {
    if (now >= expiresAt * 1000) {
      tokenBlacklist.delete(jti);
    }
  }
}

function resetStore() {
  users.length = 0;
  events.length = 0;
  tokenBlacklist.clear();
  userIdCounter = 1;
  eventIdCounter = 1;
}

module.exports = {
  users,
  events,
  tokenBlacklist,
  generateUserId,
  generateEventId,
  blacklistToken,
  isTokenBlacklisted,
  cleanupExpiredTokens,
  resetStore,
};
