const { SignJWT, jwtVerify } = require('jose');

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function createToken(payload) {
  // JWT 만료 시간: 30일 (더 길게 설정)
  const expirationTime = process.env.JWT_EXPIRATION || '30d';
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret);
  
  return token;
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

module.exports = { createToken, verifyToken };

