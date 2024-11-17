'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { GeminiClient } from '@/lib/llm/geminiClient';
import { TimeEntry } from '@/lib/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props {
  mode: 'harvest' | 'vacation';
  csvData: TimeEntry[];
  startDate?: Date;
  endDate?: Date;
  onUpdate: (reports: Record<string, string>) => void;
}

export function ReportPreview({ mode, csvData, startDate, endDate, onUpdate }: Props) {
  const [dailyReports, setDailyReports] = useState<Record<string, {
    content: string;
    isLoading: boolean;
    error?: string;
    isVacation?: boolean;
  }>>({});
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(null);

  const client = new GeminiClient();

  // Get dates either from CSV or date range, excluding weekends in vacation mode
  const dates = mode === 'harvest' 
    ? Object.keys(csvData.reduce((acc, entry) => {
        if (!acc[entry.date]) acc[entry.date] = [];
        acc[entry.date].push(entry);
        return acc;
      }, {} as Record<string, TimeEntry[]>)).sort()
    : startDate && endDate 
      ? Array.from({ length: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 })
          .map((_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            return date;
          })
          // Filter out weekends in vacation mode
          .filter(date => {
            const day = date.getDay();
            return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
          })
          .map(date => format(date, 'yyyy-MM-dd'))
      : [];

  const generateReportForDate = async (date: string) => {
    if (mode === 'vacation') return;

    try {
      setDailyReports(prev => ({
        ...prev,
        [date]: { content: '', isLoading: true }
      }));

      const entries = csvData.filter(entry => entry.date === date);
      //console.log('Generating report for date:', date, 'with entries:', entries.length); // Debug log
      
      const content = await client.generateDailyReport(entries);
      
      setDailyReports(prev => ({
        ...prev,
        [date]: { content, isLoading: false }
      }));

      onUpdate(prev => ({
        ...prev,
        [date]: content
      }));

      return true;
    } catch (error) {
      console.error('Error generating report for', date, error);
      setDailyReports(prev => ({
        ...prev,
        [date]: { 
          content: '', 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to generate report' 
        }
      }));
      return false;
    }
  };

  const generateAllReports = async () => {
    if (mode === 'vacation') return;
    
    setCurrentlyGenerating('all');
    for (const date of dates) {
      await generateReportForDate(date);
      if (date !== dates[dates.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    setCurrentlyGenerating(null);
  };

  const toggleVacation = (date: string) => {
    setDailyReports(prev => {
      const isCurrentlyVacation = prev[date]?.isVacation;
      return {
        ...prev,
        [date]: {
          content: isCurrentlyVacation ? '' : 'Urlaub',
          isLoading: false,
          isVacation: !isCurrentlyVacation
        }
      };
    });
  };

  const setVacationForAll = () => {
    const updatedReports = dates.reduce((acc, date) => {
      acc[date] = {
        content: 'Urlaub',
        isLoading: false,
        isVacation: true
      };
      return acc;
    }, {} as Record<string, typeof dailyReports[string]>);

    setDailyReports(updatedReports);
    
    // Update parent with all vacation entries
    onUpdate(dates.reduce((acc, date) => {
      acc[date] = 'Urlaub';
      return acc;
    }, {} as Record<string, string>));
  };

  const removeVacationForAll = () => {
    const updatedReports = dates.reduce((acc, date) => {
      acc[date] = {
        content: '',
        isLoading: false,
        isVacation: false
      };
      return acc;
    }, {} as Record<string, typeof dailyReports[string]>);

    setDailyReports(updatedReports);
    
    // Update parent with empty entries
    onUpdate(dates.reduce((acc, date) => {
      acc[date] = '';
      return acc;
    }, {} as Record<string, string>));
  };

  useEffect(() => {
    if (mode === 'harvest' && dates.length > 0 && Object.keys(dailyReports).length === 0) {
      generateAllReports();
    }
  }, [mode, csvData]);

  if (!dates.length) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Daily Reports Preview</h3>
        {mode === 'vacation' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const hasAllVacation = dates.every(date => dailyReports[date]?.isVacation);
              hasAllVacation ? removeVacationForAll() : setVacationForAll();
            }}
          >
            {dates.every(date => dailyReports[date]?.isVacation) ? (
              'Urlaub für alle entfernen'
            ) : (
              'Urlaub für alle'
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={generateAllReports}
            disabled={currentlyGenerating !== null}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Alle neu generieren
          </Button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {dates.map(date => {
          const dateObj = new Date(date);
          // Skip rendering weekends in vacation mode
          if (mode === 'vacation') {
            const day = dateObj.getDay();
            if (day === 0 || day === 6) return null;
          }

          return (
            <Card key={date}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">
                    {format(dateObj, 'EEEE, d. MMMM yyyy', { locale: de })}
                  </h4>
                  <div className="flex items-center gap-2">
                    {mode === 'vacation' ? (
                      <Button
                        variant={dailyReports[date]?.isVacation ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleVacation(date)}
                      >
                        {dailyReports[date]?.isVacation ? 'Urlaub entfernen' : 'Urlaub'}
                      </Button>
                    ) : (
                      dailyReports[date]?.isLoading ? (
                        <div className="text-sm text-muted-foreground animate-pulse">
                          Generiere...
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateReportForDate(date)}
                          disabled={currentlyGenerating !== null}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Neu generieren
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <Textarea
                  value={dailyReports[date]?.content || ''}
                  onChange={(e) => {
                    setDailyReports(prev => ({
                      ...prev,
                      [date]: { 
                        ...prev[date], 
                        content: e.target.value,
                        isVacation: false 
                      }
                    }));
                    onUpdate(prev => ({
                      ...prev,
                      [date]: e.target.value
                    }));
                  }}
                  className="min-h-[100px]"
                  placeholder={mode === 'vacation' ? "Optional: Zusätzliche Notizen" : "Generated report will appear here..."}
                  disabled={dailyReports[date]?.isLoading}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 