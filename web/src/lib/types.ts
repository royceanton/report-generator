export interface TimeEntry {
  task: string;
  notes?: string;
  // ... other fields as needed
}

export interface DayData {
  date: string;
  tasks: string;
  hours: string;
}

export interface ParsedCsvData {
  entries: TimeEntry[];
  error?: string;
}

export interface GeneratedReport {
  [date: string]: string;
} 