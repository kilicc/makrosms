/**
 * SMS Gönderim İlerleme Takibi
 * In-memory progress store - production'da Redis kullanılabilir
 */

interface SMSProgress {
  jobId: string;
  total: number;
  completed: number;
  successCount: number;
  failCount: number;
  currentBatch: number;
  totalBatches: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  results?: Array<{ phone: string; success: boolean; messageId?: string; error?: string }>;
}

// In-memory progress store
const progressStore = new Map<string, SMSProgress>();

/**
 * Yeni bir SMS gönderim job'u oluştur
 */
export function createSMSJob(jobId: string, total: number, totalBatches: number): SMSProgress {
  const progress: SMSProgress = {
    jobId,
    total,
    completed: 0,
    successCount: 0,
    failCount: 0,
    currentBatch: 0,
    totalBatches,
    status: 'pending',
    startedAt: new Date(),
  };

  progressStore.set(jobId, progress);
  return progress;
}

/**
 * İlerleme güncelle
 */
export function updateProgress(
  jobId: string,
  updates: {
    completed?: number;
    successCount?: number;
    failCount?: number;
    currentBatch?: number;
    status?: SMSProgress['status'];
    error?: string;
  }
): SMSProgress | null {
  const progress = progressStore.get(jobId);
  if (!progress) {
    return null;
  }

  if (updates.completed !== undefined) {
    progress.completed = updates.completed;
  }
  if (updates.successCount !== undefined) {
    progress.successCount = updates.successCount;
  }
  if (updates.failCount !== undefined) {
    progress.failCount = updates.failCount;
  }
  if (updates.currentBatch !== undefined) {
    progress.currentBatch = updates.currentBatch;
  }
  if (updates.status !== undefined) {
    progress.status = updates.status;
    if (updates.status === 'completed' || updates.status === 'failed') {
      progress.completedAt = new Date();
    }
  }
  if (updates.error !== undefined) {
    progress.error = updates.error;
  }

  progressStore.set(jobId, progress);
  return progress;
}

/**
 * İlerleme bilgisini al
 */
export function getProgress(jobId: string): SMSProgress | null {
  return progressStore.get(jobId) || null;
}

/**
 * Sonuçları kaydet
 */
export function saveResults(jobId: string, results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }>): void {
  const progress = progressStore.get(jobId);
  if (progress) {
    progress.results = results;
    progressStore.set(jobId, progress);
  }
}

/**
 * Eski job'ları temizle (24 saatten eski)
 */
export function cleanupOldJobs(): void {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const [jobId, progress] of progressStore.entries()) {
    if (progress.completedAt && progress.completedAt < oneDayAgo) {
      progressStore.delete(jobId);
    }
  }
}

/**
 * Job ID oluştur
 */
export function generateJobId(): string {
  return `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Her 1 saatte bir eski job'ları temizle
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldJobs, 60 * 60 * 1000);
}

