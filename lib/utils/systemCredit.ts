/**
 * Sistem Kredisi Yönetimi
 * Admin kullanıcılarının kredileri senkronize tutulur
 * Sistem kredisi = Admin kredilerinin toplamı (hepsi aynı değeri gösterir)
 */

import { supabaseServer } from '@/lib/supabase-server';

/**
 * Sistem kredisini al (herhangi bir admin kullanıcısından)
 */
export async function getSystemCredit(): Promise<number> {
  try {
    const { data: adminUsers, error } = await supabaseServer
      .from('users')
      .select('credit')
      .in('role', ['admin', 'administrator', 'moderator'])
      .limit(1);

    if (error || !adminUsers || adminUsers.length === 0) {
      console.error('Sistem kredisi alınamadı:', error);
      return 0;
    }

    return adminUsers[0].credit || 0;
  } catch (error) {
    console.error('Sistem kredisi alınırken hata:', error);
    return 0;
  }
}

/**
 * Sistem kredisini güncelle (tüm adminlere aynı değeri ver)
 */
export async function updateSystemCredit(newCredit: number): Promise<boolean> {
  try {
    // Tüm admin kullanıcılarını güncelle
    const { error } = await supabaseServer
      .from('users')
      .update({ credit: newCredit })
      .in('role', ['admin', 'administrator', 'moderator']);

    if (error) {
      console.error('Sistem kredisi güncellenemedi:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Sistem kredisi güncellenirken hata:', error);
    return false;
  }
}

/**
 * Sistem kredisinden düş (tüm adminlerden)
 */
export async function deductFromSystemCredit(amount: number): Promise<boolean> {
  try {
    const currentCredit = await getSystemCredit();
    const newCredit = Math.max(0, currentCredit - amount);
    return await updateSystemCredit(newCredit);
  } catch (error) {
    console.error('Sistem kredisinden düşülürken hata:', error);
    return false;
  }
}

/**
 * Sistem kredisini kontrol et (yeterli kredi var mı?)
 */
export async function checkSystemCredit(requiredCredit: number): Promise<boolean> {
  try {
    const currentCredit = await getSystemCredit();
    return currentCredit >= requiredCredit;
  } catch (error) {
    console.error('Sistem kredisi kontrol edilirken hata:', error);
    return false;
  }
}

/**
 * Admin kredilerini senkronize et (tüm adminler aynı krediyi görsün)
 */
export async function syncAdminCredits(): Promise<boolean> {
  try {
    // İlk admin kullanıcısının kredisini al
    const { data: adminUsers, error } = await supabaseServer
      .from('users')
      .select('id, credit, role')
      .in('role', ['admin', 'administrator', 'moderator'])
      .order('created_at', { ascending: true })
      .limit(1);

    if (error || !adminUsers || adminUsers.length === 0) {
      console.error('Admin kullanıcısı bulunamadı:', error);
      return false;
    }

    const masterCredit = adminUsers[0].credit || 0;

    // Tüm adminlere aynı krediyi ver
    return await updateSystemCredit(masterCredit);
  } catch (error) {
    console.error('Admin kredileri senkronize edilirken hata:', error);
    return false;
  }
}

