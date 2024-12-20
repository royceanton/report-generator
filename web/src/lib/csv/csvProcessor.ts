import Papa from 'papaparse';
import { TimeEntry } from '../types';

export class CsvProcessor {
  static async parseHarvestCsv(file: File): Promise<TimeEntry[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const entries = results.data
              .filter((row: any) => row.Date && row.Task)
              .map((row: any) => ({
                date: row.Date,
                client: row.Client,
                project: row.Project,
                projectCode: row['Project Code'],
                task: row.Task,
                notes: row.Notes || '',
                hours: row.Hours || '0',
                billable: row['Billable?'],
                invoiced: row['Invoiced?'],
                firstName: row['First Name'],
                lastName: row['Last Name'],
                employee: row['Employee?'],
                externalReferenceUrl: row['External Reference URL']
              }));
            resolve(entries);
          } catch (error) {
            console.error('CSV parsing error:', error);
            reject(new Error('Failed to parse CSV data'));
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          reject(error);
        }
      });
    });
  }

  processCSV(csvContent: string): TimeEntry[] {
    const results = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    return results.data
      .filter((row: any) => row.Date && row.Task)
      .map((row: any) => ({
        date: row.Date,
        client: row.Client,
        project: row.Project,
        projectCode: row['Project Code'],
        task: row.Task,
        notes: row.Notes || '',
        hours: row.Hours || '0',
        billable: row['Billable?'],
        invoiced: row['Invoiced?'],
        firstName: row['First Name'],
        lastName: row['Last Name'],
        employee: row['Employee?'],
        externalReferenceUrl: row['External Reference URL']
      }));
  }
} 