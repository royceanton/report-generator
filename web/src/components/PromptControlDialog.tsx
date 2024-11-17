'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface PromptControlDialogProps {
  defaultPrompt: string;
  onPromptChange: (newPrompt: string) => void;
}

export function PromptControlDialog({ defaultPrompt, onPromptChange }: PromptControlDialogProps) {
  const [promptText, setPromptText] = useState(defaultPrompt);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onPromptChange(promptText);
    // Save to localStorage for persistence
    localStorage.setItem('custom-prompt-template', promptText);
    // Close the dialog
    setOpen(false);
  };

  useEffect(() => {
    // Load saved prompt from localStorage if it exists
    const savedPrompt = localStorage.getItem('custom-prompt-template');
    if (savedPrompt) {
      setPromptText(savedPrompt);
      onPromptChange(savedPrompt);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-2">
          Prompt Einstellungen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>KI-Prompt Einstellungen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          <Button onClick={handleSave}>Speichern</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 