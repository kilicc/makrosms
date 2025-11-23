import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import axios from 'axios';
import https from 'https';
import FormData from 'form-data';

const CEPSMS_USERNAME = process.env.CEPSMS_USERNAME || 'Szxx';
const CEPSMS_PASSWORD = process.env.CEPSMS_PASSWORD || 'KepdaKeoz7289';
const CEPSMS_FROM = process.env.CEPSMS_FROM || 'CepSMS';
const CEPSMS_API_URL = 'https://panel4.cepsms.com/smsapi';

const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
});

/**
 * GET /api/admin/test-api
 * CepSMS API'yi test et - tüm formatları dene ve sonuçları göster
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || !auth.user || auth.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const testPhone = '905321234567';
    const testMessage = 'Test mesajı';

    const results: any[] = [];

    // Format 1: GSM (string) JSON
    try {
      console.log('[Test] Format 1: GSM (string) JSON');
      const requestData1: any = {
        User: CEPSMS_USERNAME,
        Pass: CEPSMS_PASSWORD,
        Message: testMessage,
        GSM: testPhone,
      };
      if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
        requestData1.From = CEPSMS_FROM;
      }

      const response1 = await axios.post(
        CEPSMS_API_URL,
        requestData1,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          httpsAgent: httpsAgent,
          timeout: 30000,
          validateStatus: () => true, // Tüm status kodlarını kabul et
        }
      );

      results.push({
        format: 'Format 1: GSM (string) JSON',
        status: response1.status,
        statusText: response1.statusText,
        data: response1.data,
        headers: response1.headers,
        success: response1.status === 200 || response1.status === 201,
      });
    } catch (error: any) {
      results.push({
        format: 'Format 1: GSM (string) JSON',
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        success: false,
      });
    }

    // Format 2: Numbers (array) JSON
    try {
      console.log('[Test] Format 2: Numbers (array) JSON');
      const requestData2: any = {
        User: CEPSMS_USERNAME,
        Pass: CEPSMS_PASSWORD,
        Message: testMessage,
        Numbers: [testPhone],
      };
      if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
        requestData2.From = CEPSMS_FROM;
      }

      const response2 = await axios.post(
        CEPSMS_API_URL,
        requestData2,
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

      results.push({
        format: 'Format 2: Numbers (array) JSON',
        status: response2.status,
        statusText: response2.statusText,
        data: response2.data,
        headers: response2.headers,
        success: response2.status === 200 || response2.status === 201,
      });
    } catch (error: any) {
      results.push({
        format: 'Format 2: Numbers (array) JSON',
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        success: false,
      });
    }

    // Format 3: Form-Data (URL-encoded)
    try {
      console.log('[Test] Format 3: Form-Data (URL-encoded)');
      const formData = new FormData();
      formData.append('User', CEPSMS_USERNAME);
      formData.append('Pass', CEPSMS_PASSWORD);
      formData.append('Message', testMessage);
      formData.append('GSM', testPhone);
      if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
        formData.append('From', CEPSMS_FROM);
      }

      const response3 = await axios.post(
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

      results.push({
        format: 'Format 3: Form-Data (URL-encoded)',
        status: response3.status,
        statusText: response3.statusText,
        data: response3.data,
        headers: response3.headers,
        success: response3.status === 200 || response3.status === 201,
      });
    } catch (error: any) {
      results.push({
        format: 'Format 3: Form-Data (URL-encoded)',
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        success: false,
      });
    }

    // Format 4: Query Parameters (GET) - bazı eski API'ler böyle çalışır
    try {
      console.log('[Test] Format 4: Query Parameters (GET)');
      const params = new URLSearchParams({
        User: CEPSMS_USERNAME,
        Pass: CEPSMS_PASSWORD,
        Message: testMessage,
        GSM: testPhone,
      });
      if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
        params.append('From', CEPSMS_FROM);
      }

      const response4 = await axios.get(
        `${CEPSMS_API_URL}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          httpsAgent: httpsAgent,
          timeout: 30000,
          validateStatus: () => true,
        }
      );

      results.push({
        format: 'Format 4: Query Parameters (GET)',
        status: response4.status,
        statusText: response4.statusText,
        data: response4.data,
        headers: response4.headers,
        success: response4.status === 200 || response4.status === 201,
      });
    } catch (error: any) {
      results.push({
        format: 'Format 4: Query Parameters (GET)',
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        success: false,
      });
    }

    // Format 5: URL-encoded POST
    try {
      console.log('[Test] Format 5: URL-encoded POST');
      const params = new URLSearchParams({
        User: CEPSMS_USERNAME,
        Pass: CEPSMS_PASSWORD,
        Message: testMessage,
        GSM: testPhone,
      });
      if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
        params.append('From', CEPSMS_FROM);
      }

      const response5 = await axios.post(
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

      results.push({
        format: 'Format 5: URL-encoded POST',
        status: response5.status,
        statusText: response5.statusText,
        data: response5.data,
        headers: response5.headers,
        success: response5.status === 200 || response5.status === 201,
      });
    } catch (error: any) {
      results.push({
        format: 'Format 5: URL-encoded POST',
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        success: false,
      });
    }

    return NextResponse.json({
      success: true,
      apiUrl: CEPSMS_API_URL,
      username: CEPSMS_USERNAME,
      from: CEPSMS_FROM,
      testPhone,
      testMessage,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test hatası',
      },
      { status: 500 }
    );
  }
}
