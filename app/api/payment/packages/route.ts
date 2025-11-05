import { NextResponse } from 'next/server';
import { PAYMENT_PACKAGES } from '@/lib/utils/cryptoPayment';

// GET /api/payment/packages - Kredi paketleri
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: { packages: PAYMENT_PACKAGES },
    });
  } catch (error: any) {
    console.error('Payment packages error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Paket listesi hatası' },
      { status: 500 }
    );
  }
}

