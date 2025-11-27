import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET /api/payment/packages - Kredi paketleri (sadece aktif olanlar)
export async function GET() {
  try {
    // Veritabanından sadece aktif paketleri çek
    const { data: packages, error } = await supabaseServer
      .from('payment_packages')
      .select('*')
      .eq('is_active', true) // Sadece aktif paketler
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    // Format packages
    const formattedPackages = (packages || []).map((pkg: any) => ({
      id: pkg.id,
      packageId: pkg.package_id,
      name: pkg.name,
      credits: pkg.credits,
      price: Number(pkg.price),
      currency: pkg.currency || 'TRY',
      bonus: pkg.bonus || 0,
      isActive: pkg.is_active ?? true,
      displayOrder: pkg.display_order || 0,
    }));

    return NextResponse.json({
      success: true,
      data: { packages: formattedPackages },
    });
  } catch (error: any) {
    console.error('Payment packages error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Paket listesi hatası' },
      { status: 500 }
    );
  }
}

