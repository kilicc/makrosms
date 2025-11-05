import axios from 'axios';
import https from 'https';

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || '17aa5b111c584455912e0242e7dee2ce';
const COLD_WALLET_DEFAULT = process.env.COLD_WALLET_DEFAULT || 'TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5';

// HTTPS agent - SSL sertifika doğrulamasını atla (development için)
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
});

export interface CryptoCurrency {
  symbol: string;
  name: string;
  decimals: number;
  minAmount: number;
  networkFee: number;
  confirmations: number;
}

export const CRYPTO_CURRENCIES: Record<string, CryptoCurrency> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    minAmount: 0.0001,
    networkFee: 0.0001,
    confirmations: 3,
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    minAmount: 0.001,
    networkFee: 0.005,
    confirmations: 12,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
    minAmount: 1,
    networkFee: 1,
    confirmations: 3,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    minAmount: 1,
    networkFee: 1,
    confirmations: 3,
  },
  TRX: {
    symbol: 'TRX',
    name: 'TRON',
    decimals: 6,
    minAmount: 10,
    networkFee: 1,
    confirmations: 20,
  },
};

export interface PaymentPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  bonus: number;
}

export const PAYMENT_PACKAGES: PaymentPackage[] = [
  {
    id: 'starter',
    name: 'Başlangıç Paketi',
    credits: 1000,
    price: 1500,
    currency: 'TRY',
    bonus: 100,
  },
  {
    id: 'pro',
    name: 'Pro Paketi',
    credits: 5000,
    price: 7000,
    currency: 'TRY',
    bonus: 500,
  },
  {
    id: 'premium',
    name: 'Premium Paketi',
    credits: 10000,
    price: 13000,
    currency: 'TRY',
    bonus: 1500,
  },
];

/**
 * Kripto para fiyatını CoinMarketCap API'den al
 */
export async function getCryptoPrice(
  currency: string,
  fiat: string = 'TRY'
): Promise<{ success: boolean; price?: number; error?: string }> {
  try {
    const currencyMap: Record<string, string> = {
      BTC: '1',
      ETH: '1027',
      USDT: '825',
      USDC: '3408',
      TRX: '1958',
    };

    const currencyId = currencyMap[currency.toUpperCase()];
    if (!currencyId) {
      return { success: false, error: 'Desteklenmeyen kripto para' };
    }

    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`,
      {
        params: {
          id: currencyId,
          convert: fiat,
        },
        headers: {
          'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
        },
        httpsAgent: httpsAgent,
        timeout: 30000, // 30 saniye timeout
      }
    );

    const data = response.data.data[currencyId];
    const price = data.quote[fiat].price;

    return { success: true, price };
  } catch (error: any) {
    console.error('Crypto price error:', error);
    return { success: false, error: error.message || 'Fiyat alınamadı' };
  }
}

/**
 * Kripto para miktarını hesapla
 */
export function calculateCryptoAmount(
  fiatAmount: number,
  cryptoPrice: number,
  decimals: number
): number {
  const amount = fiatAmount / cryptoPrice;
  return parseFloat(amount.toFixed(decimals));
}

/**
 * Cüzdan adresini al
 */
export function getWalletAddress(currency: string): string {
  return COLD_WALLET_DEFAULT;
}

