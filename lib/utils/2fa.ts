import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * 2FA secret oluştur
 */
export function generate2FASecret(username: string): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = speakeasy.generateSecret({
    name: `SMS Verification System (${username})`,
    issuer: 'SMS Verification System',
    length: 32,
  });

  return {
    secret: secret.base32 || '',
    otpauthUrl: secret.otpauth_url || '',
  };
}

/**
 * QR kod oluştur (otpauth URL'den)
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeData = await QRCode.toDataURL(otpauthUrl);
    return qrCodeData;
  } catch (error) {
    throw new Error('QR kod oluşturulamadı');
  }
}

/**
 * 2FA kodunu doğrula
 */
export function verify2FACode(secret: string, token: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // 2 adım tolerans
    });
  } catch (error) {
    return false;
  }
}

