import bcrypt from 'bcryptjs';

// Şifre: 123 için hash oluştur
async function generateHash() {
  const password = '123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Password:', password);
  console.log('Hash:', hash);
}

generateHash();

