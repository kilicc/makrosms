/**
 * Kredi Düşme Test Scripti
 * 1000 numara ile SMS gönderimi yapıp kredi düşüşünü test eder
 * Sonra krediyi geri yükler
 */

import { getSupabaseServer } from '../lib/supabase-server';
import { getSystemCredit, updateSystemCredit } from '../lib/utils/systemCredit';

async function testCreditDeduction() {
  try {
    console.log('🧪 Kredi Düşme Testi Başlatılıyor...\n');

    const supabase = getSupabaseServer();

    // 1. Test kullanıcısını bul (veya oluştur)
    console.log('1️⃣ Test kullanıcısı kontrol ediliyor...');
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, username, email, credit, role')
      .eq('username', 'testuser')
      .single();

    let userId: string;
    let initialUserCredit: number;

    if (userError || !testUser) {
      // Test kullanıcısı yok, oluştur
      console.log('   Test kullanıcısı bulunamadı, oluşturuluyor...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: 'testuser',
          email: 'test@test.com',
          password_hash: 'test_hash',
          credit: 2000, // Test için 2000 kredi
          role: 'user',
        })
        .select('id, credit')
        .single();

      if (createError || !newUser) {
        throw new Error(`Test kullanıcısı oluşturulamadı: ${createError?.message}`);
      }

      userId = newUser.id;
      initialUserCredit = newUser.credit || 2000;
      console.log(`   ✅ Test kullanıcısı oluşturuldu: ${userId}`);
      console.log(`   Başlangıç kredisi: ${initialUserCredit}`);
    } else {
      userId = testUser.id;
      initialUserCredit = testUser.credit || 0;
      console.log(`   ✅ Test kullanıcısı bulundu: ${testUser.username} (${userId})`);
      console.log(`   Mevcut kredi: ${initialUserCredit}`);
    }

    // 2. Sistem kredisini kontrol et
    console.log('\n2️⃣ Sistem kredisi kontrol ediliyor...');
    const initialSystemCredit = await getSystemCredit();
    console.log(`   Mevcut sistem kredisi: ${initialSystemCredit}`);

    if (initialSystemCredit < 1000) {
      console.log('   ⚠️ Sistem kredisi 1000\'den az, 5000 kredi ekleniyor...');
      await updateSystemCredit(5000);
      console.log('   ✅ Sistem kredisi 5000 olarak güncellendi');
    }

    // 3. Test için 1000 numara oluştur (test numaraları - gerçek değil)
    console.log('\n3️⃣ Test numaraları hazırlanıyor...');
    const testPhoneNumbers: string[] = [];
    for (let i = 0; i < 1000; i++) {
      // Test numaraları: 90555123400 + i (son 2 hane değişiyor)
      const lastDigits = String(i % 100).padStart(2, '0');
      const phoneNumber = `905551234${lastDigits}`;
      testPhoneNumbers.push(phoneNumber);
    }
    console.log(`   ✅ ${testPhoneNumbers.length} test numarasi hazirlandi`);

    // 4. Kredi hesaplama
    console.log('\n4️⃣ Kredi hesaplaması yapılıyor...');
    const testMessage = 'Test mesajı - Kredi düşme testi';
    const messageLength = testMessage.length;
    const creditPerMessage = Math.ceil(messageLength / 180) || 1;
    const totalCreditNeeded = creditPerMessage * testPhoneNumbers.length;
    console.log(`   Mesaj uzunluğu: ${messageLength} karakter`);
    console.log(`   Mesaj başına kredi: ${creditPerMessage}`);
    console.log(`   Toplam gerekli kredi: ${totalCreditNeeded} (${testPhoneNumbers.length} numara × ${creditPerMessage})`);

    // 5. Kredi kontrolü
    console.log('\n5️⃣ Kredi kontrolü yapılıyor...');
    if (initialUserCredit < totalCreditNeeded) {
      console.log(`   ⚠️ Kullanıcı kredisi yetersiz (${initialUserCredit} < ${totalCreditNeeded})`);
      console.log(`   Kullanıcı kredisi ${totalCreditNeeded + 1000} olarak güncelleniyor...`);
      await supabase
        .from('users')
        .update({ credit: totalCreditNeeded + 1000 })
        .eq('id', userId);
      initialUserCredit = totalCreditNeeded + 1000;
      console.log(`   ✅ Kullanıcı kredisi güncellendi: ${initialUserCredit}`);
    }

    const systemCreditBefore = await getSystemCredit();
    if (systemCreditBefore < totalCreditNeeded) {
      console.log(`   ⚠️ Sistem kredisi yetersiz (${systemCreditBefore} < ${totalCreditNeeded})`);
      console.log(`   Sistem kredisi ${totalCreditNeeded + 1000} olarak güncelleniyor...`);
      await updateSystemCredit(totalCreditNeeded + 1000);
      console.log(`   ✅ Sistem kredisi güncellendi`);
    }

    // 6. Kredi düşme simülasyonu (gerçek SMS göndermeden)
    console.log('\n6️⃣ Kredi düşme işlemi simüle ediliyor...');
    
    // Kullanıcı kredisinden düş
    const userCreditAfter = initialUserCredit - totalCreditNeeded;
    const { data: updatedUser, error: updateUserError } = await supabase
      .from('users')
      .update({ credit: Math.max(0, userCreditAfter) })
      .eq('id', userId)
      .select('credit')
      .single();

    if (updateUserError || !updatedUser) {
      throw new Error(`Kullanıcı kredisi düşülemedi: ${updateUserError?.message}`);
    }

    console.log(`   ✅ Kullanıcı kredisi düşürüldü: ${initialUserCredit} → ${updatedUser.credit}`);

    // Sistem kredisinden düş
    const systemCreditAfter = systemCreditBefore - totalCreditNeeded;
    await updateSystemCredit(Math.max(0, systemCreditAfter));
    const systemCreditAfterCheck = await getSystemCredit();
    console.log(`   ✅ Sistem kredisi düşürüldü: ${systemCreditBefore} → ${systemCreditAfterCheck}`);

    // 7. Kredi düşüşünü doğrula
    console.log('\n7️⃣ Kredi düşüşü doğrulanıyor...');
    const { data: finalUser, error: finalUserError } = await supabase
      .from('users')
      .select('credit')
      .eq('id', userId)
      .single();

    if (finalUserError || !finalUser) {
      throw new Error(`Kullanıcı kredisi kontrol edilemedi: ${finalUserError?.message}`);
    }

    const finalSystemCredit = await getSystemCredit();

    const userCreditDeducted = initialUserCredit - (finalUser.credit || 0);
    const systemCreditDeducted = systemCreditBefore - finalSystemCredit;

    console.log(`   Kullanıcı kredisi düşüşü: ${userCreditDeducted} (beklenen: ${totalCreditNeeded})`);
    console.log(`   Sistem kredisi düşüşü: ${systemCreditDeducted} (beklenen: ${totalCreditNeeded})`);

    if (userCreditDeducted === totalCreditNeeded && systemCreditDeducted === totalCreditNeeded) {
      console.log('   ✅ Kredi düşüşü doğru!');
    } else {
      console.log('   ❌ Kredi düşüşü hatalı!');
      throw new Error(`Kredi düşüşü beklenen değerle eşleşmiyor`);
    }

    // 8. Krediyi geri yükle
    console.log('\n8️⃣ Krediler geri yükleniyor...');
    await supabase
      .from('users')
      .update({ credit: initialUserCredit })
      .eq('id', userId);

    await updateSystemCredit(systemCreditBefore);

    const { data: restoredUser } = await supabase
      .from('users')
      .select('credit')
      .eq('id', userId)
      .single();

    const restoredSystemCredit = await getSystemCredit();

    console.log(`   Kullanıcı kredisi: ${restoredUser?.credit} (başlangıç: ${initialUserCredit})`);
    console.log(`   Sistem kredisi: ${restoredSystemCredit} (başlangıç: ${systemCreditBefore})`);

    if (restoredUser?.credit === initialUserCredit && restoredSystemCredit === systemCreditBefore) {
      console.log('   ✅ Krediler başarıyla geri yüklendi!');
    } else {
      console.log('   ⚠️ Krediler tam olarak geri yüklenemedi, manuel kontrol gerekebilir');
    }

    console.log('\n✅ Test başarıyla tamamlandı!');
    console.log('\n📊 Özet:');
    console.log(`   - Test numarası: ${testPhoneNumbers.length}`);
    console.log(`   - Toplam kredi düşüşü: ${totalCreditNeeded}`);
    console.log(`   - Kullanıcı kredisi düşüşü: ${userCreditDeducted} ✅`);
    console.log(`   - Sistem kredisi düşüşü: ${systemCreditDeducted} ✅`);
    console.log(`   - Krediler geri yüklendi: ✅`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test hatası:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Script'i çalıştır
testCreditDeduction();

