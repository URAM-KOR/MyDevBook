/**
 * 간단한 토큰 암호화/복호화 유틸리티
 * 프로덕션에서는 더 강력한 암호화 사용 권장
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-me';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * 토큰 암호화
 */
function encryptToken(token) {
  if (!token) return null;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // iv:authTag:encrypted 형식으로 저장
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * 토큰 복호화
 */
function decryptToken(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return null;
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

module.exports = { encryptToken, decryptToken };

