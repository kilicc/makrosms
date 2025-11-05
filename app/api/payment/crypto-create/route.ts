import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';
import {
  PAYMENT_PACKAGES,
  CRYPTO_CURRENCIES,
  getCryptoPrice,
  calculateCryptoAmount,
  getWalletAddress,
} from '@/lib/utils/cryptoPayment';
import QRCode from 'qrcode';

// POST /api/payment/crypto-create - Kripto ödeme oluşturma
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId, cryptoCurrency, fiatAmount, fiatCurrency } = body;

    // Validation
    if (!packageId || !cryptoCurrency || !fiatAmount) {
      return NextResponse.json(
        { success: false, message: 'Paket, kripto para ve fiat tutar gerekli' },
        { status: 400 }
      );
    }

    // Get package
    const packageData = PAYMENT_PACKAGES.find((p) => p.id === packageId);
    if (!packageData) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz paket' },
        { status: 400 }
      );
    }

    // Get crypto currency info
    const crypto = CRYPTO_CURRENCIES[cryptoCurrency.toUpperCase()];
    if (!crypto) {
      return NextResponse.json(
        { success: false, message: 'Desteklenmeyen kripto para' },
        { status: 400 }
      );
    }

    // Get crypto price
    const priceResult = await getCryptoPrice(cryptoCurrency, fiatCurrency || 'TRY');
    if (!priceResult.success || !priceResult.price) {
      return NextResponse.json(
        { success: false, message: priceResult.error || 'Fiyat alınamadı' },
        { status: 400 }
      );
    }

    // Calculate crypto amount
    const cryptoAmount = calculateCryptoAmount(
      fiatAmount,
      priceResult.price,
      crypto.decimals
    );

    // Check minimum amount
    if (cryptoAmount < crypto.minAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum tutar: ${crypto.minAmount} ${crypto.symbol}`,
        },
        { status: 400 }
      );
    }

    // Get wallet address
    const walletAddress = getWalletAddress(cryptoCurrency);

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(walletAddress);

    // Create payment record - Prisma otomatik UUID oluşturacak
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 dakika

    const payment = await prisma.payment.create({
      data: {
        // id alanı otomatik UUID oluşturulacak (schema'da @default(dbgenerated("gen_random_uuid()")))
        userId: auth.user.userId,
        amount: fiatAmount,
        currency: fiatCurrency || 'TRY',
        paymentMethod: `crypto-${cryptoCurrency}`,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        currency: cryptoCurrency.toUpperCase(),
        cryptoAmount,
        fiatAmount,
        walletAddress,
        qrCodeData,
        expiresAt: expiresAt.toISOString(),
        credits: packageData.credits,
        bonus: packageData.bonus,
        totalCredits: packageData.credits + packageData.bonus,
      },
    });
  } catch (error: any) {
    console.error('Crypto payment create error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Ödeme oluşturma hatası' },
      { status: 500 }
    );
  }
}

