import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, message: 'Dosya yüklenmedi' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isCSV = fileExtension === 'csv';
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
    if (!isCSV && !isExcel) {
      return NextResponse.json({ success: false, message: 'Sadece CSV veya Excel dosyaları destekleniyor' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer);
    let rows: any[] = [];
    let detectedColumns: string[] = [];

    if (isCSV) {
      const Papa = require('papaparse');
      const csvText = fileContent.toString('utf-8');
      const parseResult = Papa.parse(csvText, { header: true, skipEmptyLines: true, encoding: 'utf-8' });
      rows = parseResult.data || [];
      if (rows.length > 0) detectedColumns = Object.keys(rows[0]);
    } else if (isExcel) {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileContent, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const firstRowRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      const headers: string[] = [];
      for (let col = firstRowRange.s.c; col <= firstRowRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        const headerValue = cell ? String(cell.v || '').trim() : '';
        headers.push(headerValue || `Sütun ${col + 1}`);
      }
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: headers.length > 0 ? headers : undefined,
        raw: false,
        defval: '',
        range: headers.length > 0 ? { s: { r: 1, c: 0 }, e: { r: -1, c: -1 } } : undefined,
      });
      rows = jsonData as any[];
      detectedColumns = headers.length > 0 ? headers : (rows.length > 0 ? Object.keys(rows[0]) : []);
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Dosyada veri bulunamadı' }, { status: 400 });
    }

    const columnAnalysis: Record<string, { type: 'name' | 'phone' | 'email' | 'other'; confidence: number }> = {};
    detectedColumns.forEach((columnName) => {
      const lowerColumnName = columnName.toLowerCase().trim();
      let type: 'name' | 'phone' | 'email' | 'other' = 'other';
      let confidence = 0;
      if (lowerColumnName.includes('isim') || lowerColumnName.includes('name') || lowerColumnName.includes('ad') || lowerColumnName.includes('adı')) {
        type = 'name';
        confidence = 0.9;
      } else if (lowerColumnName.includes('telefon') || lowerColumnName.includes('phone') || lowerColumnName.includes('numara') || lowerColumnName.includes('tel')) {
        type = 'phone';
        confidence = 0.9;
      } else if (lowerColumnName.includes('email') || lowerColumnName.includes('e-posta') || lowerColumnName.includes('eposta') || lowerColumnName.includes('mail')) {
        type = 'email';
        confidence = 0.9;
      } else {
        const sampleValues = rows.slice(0, Math.min(10, rows.length)).map(row => String((row as any)[columnName] || '').trim()).filter(v => v);
        if (sampleValues.length > 0) {
          const phoneMatches = sampleValues.filter(v => { const cleaned = v.replace(/\D/g, ''); return cleaned.length >= 9 && cleaned.length <= 13; }).length;
          const phoneRatio = phoneMatches / sampleValues.length;
          if (phoneRatio > 0.7) { type = 'phone'; confidence = phoneRatio; }
          else if (sampleValues.some(v => v.includes('@') && v.includes('.'))) { type = 'email'; confidence = 0.7; }
        }
      }
      columnAnalysis[columnName] = { type, confidence };
    });

    const previewRows = rows.slice(0, 5).map((row: any) => {
      const preview: any = {};
      detectedColumns.forEach(col => { preview[col] = String(row[col] || '').trim(); });
      return preview;
    });

    return NextResponse.json({ success: true, data: { totalRows: rows.length, columns: detectedColumns, columnAnalysis, previewRows } });
  } catch (error: any) {
    console.error('Import preview error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Önizleme hatası' }, { status: 500 });
  }
}
