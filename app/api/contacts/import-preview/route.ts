import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';

// POST /api/contacts/import-preview - Excel/CSV dosyasını önizle
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Dosya yüklenmedi' },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isCSV = fileExtension === 'csv';
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { success: false, message: 'Sadece CSV veya Excel dosyaları destekleniyor' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer);

    let rows: any[] = [];
    let detectedColumns: string[] = [];

    if (isCSV) {
      const Papa = require('papaparse');
      const csvText = fileContent.toString('utf-8');
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        encoding: 'utf-8',
      });
      rows = parseResult.data || [];
      if (rows.length > 0) {
        detectedColumns = Object.keys(rows[0]);
      }
    } else if (isExcel) {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileContent, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Excel dosyasında sayfa bulunamadı' },
          { status: 400 }
        );
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet || !worksheet['!ref']) {
        return NextResponse.json(
          { success: false, message: 'Excel sayfası boş veya geçersiz' },
          { status: 400 }
        );
      }
      
      // Önce header ile dene (normal durum)
      let contactsWithHeader = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Tüm değerleri string olarak al
        defval: '', // Boş hücreler için varsayılan değer
      });
      
      // Eğer header yoksa veya ilk satır boşsa, header olmadan dene
      if (contactsWithHeader.length === 0 || !Object.keys(contactsWithHeader[0] || {}).length) {
        // Header olmadan oku - ilk satırı da veri olarak al
        rows = XLSX.utils.sheet_to_json(worksheet, {
          header: ['numara'], // Tek sütun varsa
          raw: false,
          defval: '',
        });
        console.log('[Preview] Excel parsed without header, rows count:', rows.length);
        
        // Eğer hala boşsa, tüm sütunları sayısal key olarak oku
        if (rows.length === 0) {
          const allData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Array of arrays
            raw: false,
            defval: '',
          });
          
          if (allData.length > 0) {
            // İlk satırı header olarak kullan, gerisini veri
            const firstRow = allData[0] as any[];
            const headerRow = firstRow.map((val, idx) => String(val || '').trim() || `Sütun ${idx + 1}`);
            detectedColumns = headerRow;
            
            // Kalan satırları veri olarak işle
            rows = allData.slice(1).map((row: any[]) => {
              const obj: any = {};
              headerRow.forEach((header, idx) => {
                obj[header] = String(row[idx] || '').trim();
              });
              return obj;
            });
          }
        } else {
          // Numeric key'leri düzelt
          if (rows.length > 0 && Object.keys(rows[0] || {}).some(key => /^\d+$/.test(key))) {
            const keys = Object.keys(rows[0]);
            detectedColumns = keys.map((_, idx) => `Sütun ${idx + 1}`);
            rows = rows.map((row: any) => {
              const newRow: any = {};
              keys.forEach((key, idx) => {
                newRow[detectedColumns[idx]] = String(row[key] || '').trim();
              });
              return newRow;
            });
          } else {
            detectedColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
          }
        }
      } else {
        // Header ile başarılı okuma
        rows = contactsWithHeader;
        detectedColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
        console.log('[Preview] Excel parsed with header, rows count:', rows.length);
        console.log('[Preview] Columns:', detectedColumns);
      }
    }

    if (rows.length === 0) {
      console.error('[Preview] No rows found. File size:', file.size, 'bytes');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Dosyada veri bulunamadı. Lütfen Excel dosyasının boş olmadığından ve doğru formatta olduğundan emin olun.' 
        },
        { status: 400 }
      );
    }
    
    console.log('[Preview] Successfully parsed:', rows.length, 'rows,', detectedColumns.length, 'columns');

    // Sütun analizi
    const columnAnalysis: Record<string, { type: 'name' | 'phone' | 'email' | 'other'; confidence: number }> = {};
    
    detectedColumns.forEach((columnName) => {
      const lowerColumnName = columnName.toLowerCase().trim();
      let type: 'name' | 'phone' | 'email' | 'other' = 'other';
      let confidence = 0;
      
      if (lowerColumnName.includes('isim') || lowerColumnName.includes('name') || 
          lowerColumnName.includes('ad') || lowerColumnName.includes('adı')) {
        type = 'name';
        confidence = 0.9;
      } else if (lowerColumnName.includes('telefon') || lowerColumnName.includes('phone') || 
                 lowerColumnName.includes('numara') || lowerColumnName.includes('tel')) {
        type = 'phone';
        confidence = 0.9;
      } else if (lowerColumnName.includes('email') || lowerColumnName.includes('e-posta') || 
                 lowerColumnName.includes('eposta') || lowerColumnName.includes('mail')) {
        type = 'email';
        confidence = 0.9;
      } else {
        // İçeriğe göre tahmin
        const sampleValues = rows.slice(0, Math.min(10, rows.length))
          .map(row => String((row as any)[columnName] || '').trim())
          .filter(v => v);
        
        if (sampleValues.length > 0) {
          const phoneMatches = sampleValues.filter(v => {
            const cleaned = v.replace(/\D/g, '');
            return cleaned.length >= 9 && cleaned.length <= 13;
          }).length;
          
          const phoneRatio = phoneMatches / sampleValues.length;
          if (phoneRatio > 0.7) {
            type = 'phone';
            confidence = phoneRatio;
          } else if (sampleValues.some(v => v.includes('@') && v.includes('.'))) {
            type = 'email';
            confidence = 0.7;
          }
        }
      }
      
      columnAnalysis[columnName] = { type, confidence };
    });

    // İlk 5 satırı önizleme için döndür
    const previewRows = rows.slice(0, 5).map((row: any) => {
      const preview: any = {};
      detectedColumns.forEach(col => {
        preview[col] = String(row[col] || '').trim();
      });
      return preview;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRows: rows.length,
        columns: detectedColumns,
        columnAnalysis,
        previewRows,
      },
    });
  } catch (error: any) {
    console.error('[Preview] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Dosya analiz edilemedi. Lütfen dosya formatını kontrol edin.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
