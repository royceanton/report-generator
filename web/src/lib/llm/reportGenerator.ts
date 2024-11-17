import { TimeEntry } from '../types';

export class ReportGenerator {
  // Simple template-based generation without LLM
  private static generateBasicReport(entries: TimeEntry[]): string {
    const tasks = entries.map(e => e.task.replace(/\[.*?\]/g, '').trim())
                        .filter(t => t.length > 0);
    const totalHours = entries.reduce((sum, e) => 
      sum + parseFloat(e.hours.replace(',', '.')), 0);

    return `Entwicklung und Implementation verschiedener Features mittels SAPUI5 Framework. ` +
           `Hauptaufgaben waren: ${tasks.join(', ')}. ` +
           `Gesamtarbeitszeit: ${totalHours.toFixed(2)} Stunden.`;
  }

  // Rule-based generation using task patterns
  private static generateStructuredReport(entries: TimeEntry[]): string {
    const tasksByType = entries.reduce((acc, entry) => {
      const taskType = this.classifyTask(entry.task);
      if (!acc[taskType]) acc[taskType] = [];
      acc[taskType].push(entry);
      return acc;
    }, {} as Record<string, TimeEntry[]>);

    const parts = [];
    
    if (tasksByType['development']) {
      const devTasks = tasksByType['development'];
      parts.push(`Entwicklung von ${devTasks.length} Features im SAPUI5 Framework, ` +
                 `darunter ${devTasks.map(t => this.extractFeatureName(t.task)).join(', ')}.`);
    }

    if (tasksByType['bugfix']) {
      parts.push('Behebung von technischen Problemen und Optimierung der bestehenden Funktionalität.');
    }

    if (tasksByType['documentation']) {
      parts.push('Dokumentation der implementierten Funktionen und Code-Review-Prozesse.');
    }

    return parts.join(' ');
  }

  private static classifyTask(task: string): string {
    const lower = task.toLowerCase();
    if (lower.includes('fix') || lower.includes('bug') || lower.includes('issue')) 
      return 'bugfix';
    if (lower.includes('doc') || lower.includes('review')) 
      return 'documentation';
    return 'development';
  }

  private static extractFeatureName(task: string): string {
    // Remove JIRA-style tags like [DEV-123]
    const cleaned = task.replace(/\[.*?\]/g, '').trim();
    // Extract main feature name
    const match = cleaned.match(/(?:add|implement|create|develop)\s+(.+?)(?:\.|\s*$)/i);
    return match ? match[1] : cleaned;
  }

  async generateDailyReport(entries: TimeEntry[]): Promise<string> {
    if (!entries?.length) {
      throw new Error('No entries provided');
    }

    try {
      // First try structured generation
      const structuredReport = ReportGenerator.generateStructuredReport(entries);
      if (structuredReport.length > 50) { // Sanity check for minimum length
        return structuredReport;
      }

      // Fallback to basic generation
      return ReportGenerator.generateBasicReport(entries);
    } catch (error) {
      console.error('Error generating report:', error);
      // Ultimate fallback
      return ReportGenerator.generateBasicReport(entries);
    }
  }
} 