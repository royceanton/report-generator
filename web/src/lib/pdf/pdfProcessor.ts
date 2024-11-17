import { PDFDocument, StandardFonts } from 'pdf-lib';

interface PDFData {
  name: string;
  year: string;
  weekNumber: string;
  weekStart: string;
  weekEnd: string;
  days: Array<{
    day: 'MO' | 'DI' | 'MI' | 'DO' | 'FR' | 'SA';
    tasks: string;
    hours: string;
  }>;
}

export class PDFProcessor {
  // Font sizes for different fields
  private static readonly FONT_SIZES = {
    name: 11,  // Smaller font for name
    weekNumber: 11,  // Smaller font for Ausbildungsnachweis Nr
    standardText: 11,  // Standard size for most fields
    hours: 10,  // Smaller font for hours
    tasks: 10   // Size for task descriptions
  };

  private static readonly FIELD_MAPPING = {
    MO: {
      tasks: 'Betriebliche Tätigkeiten Unterweisungen bzw überbetriebliche Unterweisungen z B im Handwerk betrieblicher Unterricht sonstige Schulungen Themen des BerufsschulunterrichtsMo',
      hours: 'StdMo'
    },
    DI: {
      tasks: 'Betriebliche Tätigkeiten Unterweisungen bzw überbetriebliche Unterweisungen z B im Handwerk betrieblicher Unterricht sonstige Schulungen Themen des BerufsschulunterrichtsDi',
      hours: 'StdDi'
    },
    MI: {
      tasks: 'Betriebliche Tätigkeiten Unterweisungen bzw überbetriebliche Unterweisungen z B im Handwerk betrieblicher Unterricht sonstige Schulungen Themen des BerufsschulunterrichtsMi',
      hours: 'StdMi'
    },
    DO: {
      tasks: 'Betriebliche Tätigkeiten Unterweisungen bzw überbetriebliche Unterweisungen z B im Handwerk betrieblicher Unterricht sonstige Schulungen Themen des BerufsschulunterrichtsDo',
      hours: 'StdDo'
    },
    FR: {
      tasks: 'Betriebliche Tätigkeiten Unterweisungen bzw überbetriebliche Unterweisungen z B im Handwerk betrieblicher Unterricht sonstige Schulungen Themen des BerufsschulunterrichtsFr',
      hours: 'StdFr'
    },
    SA: {
      tasks: 'Betriebliche Tätigkeiten Unterweisungen bzw überbetriebliche Unterweisungen z B im Handwerk betrieblicher Unterricht sonstige Schulungen Themen des BerufsschulunterrichtsSa',
      hours: 'StdSa'
    }
  };

  async fillPDF(templateBuffer: Buffer | ArrayBuffer, data: PDFData): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(templateBuffer);
      const form = pdfDoc.getForm();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Fill basic information with specific font sizes
      const nameField = form.getTextField('Name desder Auszubildenden');
      nameField.setText(data.name);
      nameField.setFontSize(PDFProcessor.FONT_SIZES.name);
      nameField.updateAppearances(font);

      const yearField = form.getTextField('Ausbildungsjahr');
      yearField.setText(data.year);
      yearField.setFontSize(PDFProcessor.FONT_SIZES.standardText);
      yearField.updateAppearances(font);

      const weekStartField = form.getTextField('Ausbildungswoche vom');
      weekStartField.setText(data.weekStart);
      weekStartField.setFontSize(PDFProcessor.FONT_SIZES.standardText);
      weekStartField.updateAppearances(font);

      const weekEndField = form.getTextField('bis');
      weekEndField.setText(data.weekEnd);
      weekEndField.setFontSize(PDFProcessor.FONT_SIZES.standardText);
      weekEndField.updateAppearances(font);

      // Fill daily entries with specific font sizes
      data.days.forEach(({ day, tasks, hours }) => {
        const fields = PDFProcessor.FIELD_MAPPING[day];
        if (!fields) {
          console.warn(`No field mapping found for day: ${day}`);
          return;
        }

        try {
          const taskField = form.getTextField(fields.tasks);
          const hoursField = form.getTextField(fields.hours);

          if (taskField && hoursField) {
            // For vacation entries, use a standard format
            if (tasks === 'Urlaub') {
              taskField.setText('Urlaub');
              hoursField.setText('8');
            } else {
              taskField.setText(tasks);
              hoursField.setText(hours);
            }
            
            taskField.setFontSize(PDFProcessor.FONT_SIZES.tasks);
            hoursField.setFontSize(PDFProcessor.FONT_SIZES.hours);
            taskField.updateAppearances(font);
            hoursField.updateAppearances(font);
          }
        } catch (error) {
          console.error(`Error filling fields for day ${day}:`, error);
        }
      });

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error filling PDF:', error);
      throw error;
    }
  }
} 