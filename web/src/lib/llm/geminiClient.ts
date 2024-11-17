import { TimeEntry } from '../types';

interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

export class GeminiClient {
  private promptTemplate: string;

  constructor(customPromptTemplate?: string) {
    this.promptTemplate = customPromptTemplate || this.getDefaultPromptTemplate();
  }

  setPromptTemplate(template: string) {
    this.promptTemplate = template;
  }

  getDefaultPromptTemplate(): string {
    return `
Erstelle eine technische Zusammenfassung für einen IHK-Ausbildungsbericht basierend auf den folgenden Tätigkeiten.

Projektkontext und Definitionen:
- LMS steht für "Lunch Management System" (nicht Learning Management System)
- Das Projekt fokussiert sich auf die Entwicklung eines Systems zur Verwaltung von Mitarbeiter-Mittagessen
- Technologien: SAPUI5, ABAP, BAS (Business Application Studio), SEGW (SAP Gateway), SE80 (ABAP Workbench)
- Storyline bezieht sich auf den UI5-Entwicklungsprozess für Benutzeroberflächen
- Walkthroughs sind Teil der UI-Entwicklungsdokumentation

Tätigkeiten:
{{tasks}}

Anforderungen:
- Schreibe eine präzise, technische Zusammenfassung in einem Satz
- Konzentriere dich auf konkrete Tätigkeiten und technische Verfahren ohne spezifische Klassen-, Modul-, oder View-Namen.
- Verwende Fachbegriffe aus der IT/SAPUI5/ABAP
- Keine Erwähnung von Stunden oder Datum, achte auf die Darstellung der tägligchen Tätigkeiten
- Keine Aufzählungspunkte oder Überschriften
- Formuliere direkt und sachlich
- Verwende verschiedene Satzanfänge, um Variationen zu schaffen (z.B., „Entwicklung und Optimierung…“, „Zur Verbesserung…“, „Implementierung von…“, „Erweiterung und Anpassung…“).
- Verwende die korrekten Projektbegriffe (z.B. LMS als Lunch Management System)

Beispiele guter Zusammenfassungen:
"Implementierung von Klonen in ABAP sowie Entwicklung von UI-Komponenten in SAPUI5 mit Integration von Funktionsbausteinen für das Lunch Management System."
"Entwicklung von Dialogfenstern und Buttons im LMS (Lunch Management System) mit ABAP sowie Implementation des Message-Handlings."
"Implementation der LMS-Landing Page mittels SAPUI5 Framework sowie Konfiguration des Cloud Connectors für die BAS-Integration."

Deine technische Zusammenfassung (ein präziser Satz):`;
  }

  private constructPrompt(entries: TimeEntry[]): string {
    const tasks = entries.map(e => `- ${e.task}: ${e.notes || ''}`).join('\n');
    return this.promptTemplate.replace('{{tasks}}', tasks);
  }

  async generateDailyReport(entries: TimeEntry[]): Promise<string> {
    try {
      //console.log('Generating report for entries:', entries.length);

      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: this.constructPrompt(entries)
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from AI service');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error in generateDailyReport:', error);
      throw error;
    }
  }
} 