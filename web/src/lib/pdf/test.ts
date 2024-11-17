import { PDFProcessor } from './pdfProcessor';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

async function testPDFGeneration() {
  try {
    const pdfProcessor = new PDFProcessor();
    
    // Read template from local file system
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'berichtsheft-taeglich-ohne-bezug-ausbildungsrahmenplan-data.pdf');
    const templateBuffer = readFileSync(templatePath);

    const testData = {
      name: 'Royce Anton Jose',
      year: '2024',
      weekNumber: '44',
      weekStart: '28.10.2024',
      weekEnd: '03.11.2024',
      days: [
        {
          day: 'Mo' as const,
          tasks: 'Test task for Monday',
          hours: '8'
        },
        {
          day: 'Di' as const,
          tasks: 'Test task for Tuesday',
          hours: '8'
        }
        // Add more days as needed
      ]
    };

    const filledPdf = await pdfProcessor.fillPDF(templateBuffer, testData);
    
    // Save the filled PDF
    const outputPath = path.join(process.cwd(), 'public', 'test-output.pdf');
    writeFileSync(outputPath, filledPdf);
    
    console.log('PDF generated successfully:', outputPath);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

// Run the test
testPDFGeneration(); 