export interface TimeEntry {
  date: string;
  client: string;
  project: string;
  projectCode: string;
  task: string;
  notes: string;
  hours: string;
  billable: string;
  invoiced: string;
  firstName: string;
  lastName: string;
  employee: string;
  externalReferenceUrl: string;
}

export interface ParsedCsvData {
  entries: TimeEntry[];
  error?: string;
}

export interface GeneratedReport {
  [date: string]: string;
} 