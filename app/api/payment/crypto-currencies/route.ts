import { NextResponse } from 'next/server';
import { CRYPTO_CURRENCIES } from '@/lib/utils/cryptoPayment';

// GET /api/payment/crypto-currencies - Desteklenen kripto paralar
export async function GET() {
  try {
    const currencies = Object.values(CRYPTO_CURRENCIES);

    return NextResponse.json({
      success: true,
      data: { currencies },
    });
  } catch (error: any) {
    console.error('Crypto currencies error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kripto para listesi hatası' },
      { status: 500 }
    );
  }
}

