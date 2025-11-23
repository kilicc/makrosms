import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { getProgress } from '@/lib/utils/smsProgress';

/**
 * GET /api/sms/progress/[jobId]
 * SMS gönderim ilerlemesini kontrol et
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID gerekli' },
        { status: 400 }
      );
    }

    const progress = getProgress(jobId);

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Job bulunamadı' },
        { status: 404 }
      );
    }

    // İlerleme yüzdesi hesapla
    const percentage = progress.total > 0 
      ? Math.round((progress.completed / progress.total) * 100) 
      : 0;

    // Kalan süre tahmini (eğer başladıysa)
    let estimatedTimeRemaining: number | null = null;
    if (progress.completed > 0 && progress.status === 'processing') {
      const elapsed = Date.now() - progress.startedAt.getTime();
      const rate = progress.completed / elapsed; // SMS per millisecond
      const remaining = progress.total - progress.completed;
      estimatedTimeRemaining = Math.round(remaining / rate / 1000); // seconds
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: progress.jobId,
        total: progress.total,
        completed: progress.completed,
        successCount: progress.successCount,
        failCount: progress.failCount,
        currentBatch: progress.currentBatch,
        totalBatches: progress.totalBatches,
        percentage,
        status: progress.status,
        startedAt: progress.startedAt.toISOString(),
        completedAt: progress.completedAt?.toISOString(),
        estimatedTimeRemaining,
        error: progress.error,
      },
    });
  } catch (error: any) {
    console.error('Progress check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'İlerleme kontrolü hatası' },
      { status: 500 }
    );
  }
}

