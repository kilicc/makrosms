#!/usr/bin/env tsx
/**
 * CepSMS API Test Script
 * 
 * Farklı formatları test eder ve hangi formatın çalıştığını gösterir
 */

import { config } from 'dotenv';
import axios from 'axios';
import https from 'https';
import FormData from 'form-data';

// .env dosyasını yükle
config();

const CEPSMS_USERNAME = process.env.CEPSMS_USERNAME || 'Szxx';
const CEPSMS_PASSWORD = process.env.CEPSMS_PASSWORD || 'KepdaKeoz7289';
const CEPSMS_FROM = process.env.CEPSMS_FROM || 'CepSMS';
const CEPSMS_API_URL = 'https://panel4.cepsms.com/smsapi';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const testPhone = '905321234567'; // Test telefon numarası
const testMessage = 'Test mesajı - API testi';

async function testCepSMSAPI() {
  console.log('🧪 CepSMS API Test Başlatılıyor...\n');
  console.log('📋 API Bilgileri:');
  console.log(`   URL: ${CEPSMS_API_URL}`);
  console.log(`   Username: ${CEPSMS_USERNAME}`);
  console.log(`   Password: ${CEPSMS_PASSWORD.substring(0, 3)}***`);
  console.log(`   From: ${CEPSMS_FROM}`);
  console.log(`   Test Phone: ${testPhone}`);
  console.log(`   Test Message: ${testMessage}\n`);

  const results: any[] = [];

  // Format 1: GSM (string) JSON
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Format 1: GSM (string) JSON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const requestData: any = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      Message: testMessage,
      GSM: testPhone,
    };
    if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
      requestData.From = CEPSMS_FROM;
    }

    console.log('Request Data:', JSON.stringify({ ...requestData, Pass: '***' }, null, 2));
    
    const response = await axios.post(
      CEPSMS_API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    const success = response.status === 200 && (
      response.data?.Status === 'OK' || 
      response.data?.status === 'OK' ||
      response.data?.MessageId ||
      response.data?.messageId
    );

    results.push({
      format: 'Format 1: GSM (string) JSON',
      success,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    if (success) {
      console.log('✅ Format 1 BAŞARILI!\n');
    } else {
      console.log('❌ Format 1 BAŞARISIZ!\n');
    }
  } catch (error: any) {
    console.log(`Status: ${error.response?.status || 'ERROR'}`);
    console.log('Error:', error.response?.data || error.message);
    results.push({
      format: 'Format 1: GSM (string) JSON',
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    console.log('❌ Format 1 BAŞARISIZ!\n');
  }

  // Format 2: Numbers (array) JSON
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Format 2: Numbers (array) JSON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const requestData: any = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      Message: testMessage,
      Numbers: [testPhone],
    };
    if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
      requestData.From = CEPSMS_FROM;
    }

    console.log('Request Data:', JSON.stringify({ ...requestData, Pass: '***' }, null, 2));
    
    const response = await axios.post(
      CEPSMS_API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    const success = response.status === 200 && (
      response.data?.Status === 'OK' || 
      response.data?.status === 'OK' ||
      response.data?.MessageId ||
      response.data?.messageId
    );

    results.push({
      format: 'Format 2: Numbers (array) JSON',
      success,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    if (success) {
      console.log('✅ Format 2 BAŞARILI!\n');
    } else {
      console.log('❌ Format 2 BAŞARISIZ!\n');
    }
  } catch (error: any) {
    console.log(`Status: ${error.response?.status || 'ERROR'}`);
    console.log('Error:', error.response?.data || error.message);
    results.push({
      format: 'Format 2: Numbers (array) JSON',
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    console.log('❌ Format 2 BAŞARISIZ!\n');
  }

  // Format 3: Form-Data (multipart/form-data)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Format 3: Form-Data (multipart/form-data)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const formData = new FormData();
    formData.append('User', CEPSMS_USERNAME);
    formData.append('Pass', CEPSMS_PASSWORD);
    formData.append('Message', testMessage);
    formData.append('GSM', testPhone);
    if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
      formData.append('From', CEPSMS_FROM);
    }

    console.log('Request Type: multipart/form-data');
    
    const response = await axios.post(
      CEPSMS_API_URL,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    const success = response.status === 200 && (
      response.data?.Status === 'OK' || 
      response.data?.status === 'OK' ||
      response.data?.MessageId ||
      response.data?.messageId
    );

    results.push({
      format: 'Format 3: Form-Data (multipart/form-data)',
      success,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    if (success) {
      console.log('✅ Format 3 BAŞARILI!\n');
    } else {
      console.log('❌ Format 3 BAŞARISIZ!\n');
    }
  } catch (error: any) {
    console.log(`Status: ${error.response?.status || 'ERROR'}`);
    console.log('Error:', error.response?.data || error.message);
    results.push({
      format: 'Format 3: Form-Data (multipart/form-data)',
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    console.log('❌ Format 3 BAŞARISIZ!\n');
  }

  // Format 4: URL-encoded POST
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Format 4: URL-encoded POST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const params = new URLSearchParams({
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      Message: testMessage,
      GSM: testPhone,
    });
    if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
      params.append('From', CEPSMS_FROM);
    }

    console.log('Request Type: application/x-www-form-urlencoded');
    
    const response = await axios.post(
      CEPSMS_API_URL,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    const success = response.status === 200 && (
      response.data?.Status === 'OK' || 
      response.data?.status === 'OK' ||
      response.data?.MessageId ||
      response.data?.messageId
    );

    results.push({
      format: 'Format 4: URL-encoded POST',
      success,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    if (success) {
      console.log('✅ Format 4 BAŞARILI!\n');
    } else {
      console.log('❌ Format 4 BAŞARISIZ!\n');
    }
  } catch (error: any) {
    console.log(`Status: ${error.response?.status || 'ERROR'}`);
    console.log('Error:', error.response?.data || error.message);
    results.push({
      format: 'Format 4: URL-encoded POST',
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    console.log('❌ Format 4 BAŞARISIZ!\n');
  }

  // Format 5: GSM string (From parametresi olmadan)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Format 5: GSM (string) JSON - From parametresi olmadan');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const requestData: any = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      Message: testMessage,
      GSM: testPhone,
      // From parametresi yok
    };

    console.log('Request Data:', JSON.stringify({ ...requestData, Pass: '***' }, null, 2));
    
    const response = await axios.post(
      CEPSMS_API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    const success = response.status === 200 && (
      response.data?.Status === 'OK' || 
      response.data?.status === 'OK' ||
      response.data?.MessageId ||
      response.data?.messageId
    );

    results.push({
      format: 'Format 5: GSM (string) JSON - From parametresi olmadan',
      success,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    if (success) {
      console.log('✅ Format 5 BAŞARILI!\n');
    } else {
      console.log('❌ Format 5 BAŞARISIZ!\n');
    }
  } catch (error: any) {
    console.log(`Status: ${error.response?.status || 'ERROR'}`);
    console.log('Error:', error.response?.data || error.message);
    results.push({
      format: 'Format 5: GSM (string) JSON - From parametresi olmadan',
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    console.log('❌ Format 5 BAŞARISIZ!\n');
  }

  // Özet
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST ÖZETİ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const successfulFormats = results.filter(r => r.success);
  const failedFormats = results.filter(r => !r.success);
  
  console.log(`Toplam Format: ${results.length}`);
  console.log(`✅ Başarılı: ${successfulFormats.length}`);
  console.log(`❌ Başarısız: ${failedFormats.length}\n`);

  if (successfulFormats.length > 0) {
    console.log('✅ BAŞARILI FORMATLAR:');
    successfulFormats.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.format}`);
      console.log(`      Status: ${result.status}`);
      console.log(`      Response: ${JSON.stringify(result.data)}\n`);
    });
  }

  if (failedFormats.length > 0) {
    console.log('❌ BAŞARISIZ FORMATLAR:');
    failedFormats.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.format}`);
      console.log(`      Status: ${result.status || 'ERROR'}`);
      console.log(`      Error: ${result.error || JSON.stringify(result.response)}\n`);
    });
  }

  if (successfulFormats.length === 0) {
    console.log('\n⚠️  HİÇBİR FORMAT ÇALIŞMADI!');
    console.log('CepSMS API dokümantasyonunu kontrol etmek veya CepSMS desteğine başvurmak gerekebilir.');
  } else {
    console.log(`\n✅ Çalışan format bulundu: ${successfulFormats[0].format}`);
  }

  process.exit(successfulFormats.length > 0 ? 0 : 1);
}

// Script'i çalıştır
testCepSMSAPI().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

