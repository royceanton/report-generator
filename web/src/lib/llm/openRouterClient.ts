import { TimeEntry } from '../types';
import { GeminiClient } from './geminiClient';

export class OpenRouterClient {
  private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly MODEL = 'mistralai/mistral-7b-instruct:free';
  private static readonly MAX_LENGTH = 120;

  constructor(private apiKey: string) {
    if (!apiKey) throw new Error('OpenRouter API key not configured');
  }

  async generateDailyReport(entries: TimeEntry[]): Promise<string> {
    //console.log('Generating report for entries:', entries);

    if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const tasks = entries.map(e => `- ${e.task}`).join('\n');

    const prompt = `
Erstelle eine technische Zusammenfassung der folgenden Tätigkeiten für einen IHK-Ausbildungsbericht.

Tätigkeiten:
${tasks}

Anforderungen:
- Ein präziser, technischer Satz (ca. 100-120 Zeichen)
- Fokus auf die technischen Aspekte und Entwicklungsarbeiten
- Verwende SAPUI5/IT-Fachbegriffe
- Schreibe in formellem Deutsch
- Keine Erwähnung von Datum oder Arbeitszeit
- Beschreibe die konkreten Tätigkeiten

Beispiele guter Zusammenfassungen:
"Implementierung von UI5-Komponenten für das Onboarding-System mit Integration von REST-APIs und Optimierung der Datenbankabfragen."
"Entwicklung der Frontend-Funktionalitäten mittels SAPUI5 Framework unter Verwendung des MVC-Patterns und Component-basierter Architektur."
"Konfiguration der Entwicklungsumgebung und Implementation von Custom Controls für die Benutzeroberfläche."

Deine technische Zusammenfassung (ein vollständiger Satz):`;

    try {
      const response = await fetch(OpenRouterClient.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'IHK Report Generator'
        },
        body: JSON.stringify({
          model: OpenRouterClient.MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein technischer Dokumentar für IHK-Ausbildungsberichte. Erstelle präzise, technische Beschreibungen ohne Erwähnung von Datum oder Arbeitszeit.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.7,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        })
      });

      if (response.status === 429) {
        console.log('OpenRouter rate limit hit, switching to Gemini');
        try {
          if (!process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY) {
            throw new Error('Google AI Studio API key not configured');
          }
          const geminiClient = new GeminiClient(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY);
          return await geminiClient.generateDailyReport(entries);
        } catch (geminiError) {
          console.error('Gemini fallback failed:', geminiError);
          throw new Error('Both OpenRouter and Gemini failed: Rate limits exceeded');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', errorText);
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      let content = result.choices[0].message.content
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, ' ')
        // Remove date and time references
        .replace(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g, '')
        .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
        .replace(/\b\d+[\.,]\d+ Stunden\b/g, '')
        .replace(/am \d+\./g, '')
        .replace(/vom \d+\./g, '');

      if (!content.endsWith('.')) {
        content += '.';
      }

      return content;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        try {
          if (!process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY) {
            throw new Error('Google AI Studio API key not configured');
          }
          const geminiClient = new GeminiClient(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY);
          return await geminiClient.generateDailyReport(entries);
        } catch (geminiError) {
          console.error('Gemini fallback failed:', geminiError);
          throw new Error('Both OpenRouter and Gemini failed: Rate limits exceeded');
        }
      }
      console.error('Error generating report:', error);
      throw error;
    }
  }
} 