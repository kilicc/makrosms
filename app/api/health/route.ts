import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Health check endpoint - deployment doğrulaması için
    return NextResponse.json(
      {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}

