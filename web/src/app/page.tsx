'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { ReportPreview } from '@/components/ReportPreview';
import { ParsedCsvData, TimeEntry } from '@/lib/types';
import { CsvProcessor } from '@/lib/csv/csvProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format, getWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MadeByRanton from '@/components/ui/made-by-ranton';
import { PromptControlDialog } from '@/components/PromptControlDialog';
import { GeminiClient } from '@/lib/llm/geminiClient';

type ReportMode = 'harvest' | 'vacation';

const getLastMonday = (date = new Date()) => {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  // If today is Monday, use today
  if (today.getDay() === 1) {
    return today;
  }
  
  // Otherwise, find last Monday
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  return monday;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedCsvData, setParsedCsvData] = useState<ParsedCsvData>({ entries: [] });
  const [generatedReports, setGeneratedReports] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [weekNumber, setWeekNumber] = useState<string>('');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [apprenticeName, setApprenticeName] = useState<string>('Royce Anton Jose');
  const [apprenticeYear, setApprenticeYear] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ReportMode>('harvest');
  const [geminiClient] = useState(() => new GeminiClient());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Any initialization that needs the window object
    }
  }, []);

  const handleFileSelect = async (newFile: File | null) => {
    setError(null);
    setFile(newFile);
    setIsLoading(true);
    
    if (newFile) {
      try {
        //console.log('Processing file:', newFile.name); // Debug log
        const entries = await CsvProcessor.parseHarvestCsv(newFile);
        //console.log('Parsed entries:', entries); // Debug log

        if (!entries || entries.length === 0) {
          throw new Error('No valid entries found in CSV');
        }

        setParsedCsvData({ entries });

        // Extract dates from filename
        const match = newFile.name.match(/from(\d{4}-\d{2}-\d{2})to(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const start = new Date(match[1]);
          const end = new Date(match[2]);
          setStartDate(start);
          setEndDate(end);
          setWeekNumber(getWeek(start, { locale: de }).toString());
          setYear(format(start, 'yyyy'));
        }
      } catch (err) {
        console.error('File processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
        setParsedCsvData({ entries: [], error: 'Failed to parse CSV' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setParsedCsvData({ entries: [] });
      setStartDate(undefined);
      setEndDate(undefined);
      setWeekNumber('');
      setYear(new Date().getFullYear().toString());
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date | undefined, isStart: boolean) => {
    if (date) {
      if (isStart) {
        setStartDate(date);
        setEndDate(new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000));
      } else {
        setEndDate(date);
        setStartDate(new Date(date.getTime() - 6 * 24 * 60 * 60 * 1000));
      }
      setWeekNumber(getWeek(date, { locale: de }).toString());
      setYear(format(date, 'yyyy'));
    }
  };

  const handleReportUpdate = (reports: Record<string, string>) => {
    setGeneratedReports(reports);
  };

  const generateFileName = () => {
    if (!weekNumber || !year || !apprenticeName) return '';
    const formattedStartDate = startDate ? format(startDate, 'dd.MM') : '';
    const formattedEndDate = endDate ? format(endDate, 'dd.MM') : '';
    return `${year} - KW${weekNumber} - [ ${formattedStartDate} - ${formattedEndDate} ] Berichtsheft ${apprenticeName}.pdf`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !apprenticeName || !apprenticeYear) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekNumber,
          year,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dailyReports: generatedReports,
          apprenticeName,
          apprenticeYear,
          mode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${year} - KW${weekNumber} - [ ${format(startDate, 'dd.MM')} - ${format(endDate, 'dd.MM')} ] Berichtsheft ${apprenticeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptChange = (newPrompt: string) => {
    geminiClient.setPromptTemplate(newPrompt);
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gray-50 flex flex-col">
      <div className={`flex flex-col lg:flex-row gap-6 flex-grow w-full mx-auto ${
        (parsedCsvData.entries.length > 0 || mode === 'vacation') 
          ? 'max-w-[1400px]' 
          : 'max-w-[600px] justify-center'
      }`}>
        {/* Left side - Form */}
        <motion.div 
          className={`w-full ${
            (parsedCsvData.entries.length > 0 || mode === 'vacation') 
              ? 'lg:w-[32%]' 
              : 'max-w-[600px]'
          }`}
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="h-auto">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <CardTitle className="text-xl">Report Generator</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant={mode === 'harvest' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none whitespace-nowrap"
                    onClick={() => setMode('harvest')}
                  >
                    Harvest Import
                  </Button>
                  <Button
                    variant={mode === 'vacation' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none whitespace-nowrap"
                    onClick={() => {
                      setMode('vacation');
                      setFile(null);
                      setParsedCsvData({ entries: [] });
                      
                      const startDate = getLastMonday();
                      const endDate = new Date(startDate);
                      endDate.setDate(startDate.getDate() + 6);
                      
                      setStartDate(startDate);
                      setEndDate(endDate);
                      setWeekNumber(getWeek(startDate, { locale: de }).toString());
                      setYear(format(startDate, 'yyyy'));
                    }}
                  >
                    Create Empty Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Show file upload only in harvest mode */}
                {mode === 'harvest' && (
                  <div className="mb-6">
                    <FileUpload
                      value={file}
                      onChange={handleFileSelect}
                      onRemove={() => {
                        setFile(null);
                        setParsedCsvData({ entries: [] });
                        setError(null);
                      }}
                    />
                    
                    {error && (
                      <div className="mt-2 p-2 text-red-500 bg-red-50 rounded-md text-sm">
                        {error}
                      </div>
                    )}
                  </div>
                )}

                {/* Form fields - show in both modes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Name</label>
                    <Input
                      type="text"
                      value={apprenticeName}
                      onChange={(e) => setApprenticeName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Jahr</label>
                    <Input
                      type="number"
                      value={apprenticeYear}
                      onChange={(e) => setApprenticeYear(e.target.value)}
                      min="1"
                      max="4"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Start</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          {startDate ? format(startDate, 'P', { locale: de }) : 'Datum'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => handleDateChange(date, true)}
                          initialFocus
                          weekStartsOn={1} // 1 for Monday
                          locale={de} // Use German locale
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Ende</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          {endDate ? format(endDate, 'P', { locale: de }) : 'Datum'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => handleDateChange(date, false)}
                          initialFocus
                          weekStartsOn={1} // 1 for Monday
                          locale={de} // Use German locale
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Kalenderwoche</label>
                    <Input
                      type="number"
                      value={weekNumber}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Jahr</label>
                    <Input
                      type="number"
                      value={year}
                      disabled
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-4"
                  disabled={
                    (mode === 'harvest' && (!file || parsedCsvData.entries.length === 0)) ||
                    !startDate || 
                    !endDate || 
                    isLoading
                  }
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">Generiere PDF...</span>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    'PDF Generieren'
                  )}
                </Button>

                <PromptControlDialog 
                  defaultPrompt={geminiClient.getDefaultPromptTemplate()} 
                  onPromptChange={handlePromptChange}
                />
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right side - Report Preview */}
        <AnimatePresence>
          {(mode === 'harvest' ? parsedCsvData.entries.length > 0 : startDate && endDate) && (
            <motion.div 
              className="w-full lg:w-[66%]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6 h-full overflow-y-auto max-h-[calc(100vh-8rem)]">
                  <ReportPreview 
                    mode={mode}
                    csvData={parsedCsvData.entries}
                    startDate={startDate}
                    endDate={endDate}
                    onUpdate={handleReportUpdate}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <footer className="mt-8 mb-4">
        <MadeByRanton 
          className="py-4"
          fontSize="text-base"
          textColor="text-gray-700"
          heartColor="text-red-600"
        />
      </footer>
    </main>
  );
} 