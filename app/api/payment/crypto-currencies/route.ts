import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET /api/payment/crypto-currencies - Desteklenen kripto paralar (sadece aktif olanlar)
export async function GET() {
  try {
    // Veritabanından sadece aktif kripto paraları çek
    const { data: currencies, error } = await supabaseServer
      .from('crypto_currencies')
      .select('*')
      .eq('is_active', true) // Sadece aktif kripto paralar
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    // Format currencies
    const formattedCurrencies = (currencies || []).map((curr: any) => ({
      id: curr.id,
      symbol: curr.symbol,
      name: curr.name,
      decimals: curr.decimals,
      minAmount: Number(curr.min_amount),
      networkFee: Number(curr.network_fee),
      confirmations: curr.confirmations,
      walletAddress: curr.wallet_address,
      isActive: curr.is_active ?? true,
      displayOrder: curr.display_order || 0,
    }));

    return NextResponse.json({
      success: true,
      data: { currencies: formattedCurrencies },
    });
  } catch (error: any) {
    console.error('Crypto currencies error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kripto para listesi hatası' },
      { status: 500 }
    );
  }
}

