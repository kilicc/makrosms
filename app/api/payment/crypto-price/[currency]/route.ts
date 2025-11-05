import { NextRequest, NextResponse } from 'next/server';
import { getCryptoPrice } from '@/lib/utils/cryptoPayment';

// GET /api/payment/crypto-price/:currency - Kripto fiyatı
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ currency: string }> }
) {
  try {
    const { currency } = await params;
    const { searchParams } = new URL(request.url);
    const fiat = searchParams.get('fiat') || 'TRY';

    const result = await getCryptoPrice(currency, fiat);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        currency: currency.toUpperCase(),
        fiatCurrency: fiat,
        price: result.price,
      },
    });
  } catch (error: any) {
    console.error('Crypto price error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Fiyat hatası' },
      { status: 500 }
    );
  }
}

