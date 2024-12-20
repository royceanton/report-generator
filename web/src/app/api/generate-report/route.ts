import { NextRequest, NextResponse } from 'next/server';
import { PDFProcessor } from '@/lib/pdf/pdfProcessor';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      weekNumber, 
      year, 
      startDate, 
      endDate,
      dailyReports,
      apprenticeName,
      apprenticeYear,
      mode
    } = data;

    try {
      // Fetch the template from the public directory
      const templateResponse = await fetch(
        new URL('/berichtsheft-taeglich-ohne-bezug-ausbildungsrahmenplan-data.pdf', request.url)
      );
      
      if (!templateResponse.ok) {
        throw new Error('Failed to load PDF template');
      }

      const templateBuffer = await templateResponse.arrayBuffer();
      const pdfProcessor = new PDFProcessor();
      const pdfBytes = await pdfProcessor.fillPDF(templateBuffer, {
        name: apprenticeName,
        year: apprenticeYear,
        weekNumber: '',
        weekStart: format(new Date(startDate), 'dd.MM.yyyy'),
        weekEnd: format(new Date(endDate), 'dd.MM.yyyy'),
        days: Object.entries(dailyReports)
          .filter(([date]) => {
            if (mode === 'vacation') {
              const day = new Date(date).getDay();
              return day !== 0 && day !== 6;
            }
            return true;
          })
          .map(([date, content]) => ({
            day: format(new Date(date), 'EEEEEE', { locale: de }).toUpperCase() as 'MO' | 'DI' | 'MI' | 'DO' | 'FR' | 'SA',
            tasks: String(content),
            hours: '8'
          }))
      });

      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${year} - KW${weekNumber} - [ ${format(new Date(startDate), 'dd.MM')} - ${format(new Date(endDate), 'dd.MM')} ] Berichtsheft ${apprenticeName}.pdf"`
        }
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Route handler error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
} 