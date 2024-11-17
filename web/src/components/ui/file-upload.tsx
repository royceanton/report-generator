import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { motion } from "framer-motion";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

export const FileUpload = ({
  onChange,
  onRemove,
  value,
  onError,
}: {
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  value?: File | null;
  onError?: (message: string) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const file = newFiles[0];
      if (validateFile(file)) {
        onChange?.(file);
      } else {
        onError?.('Please upload a CSV file');
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange?.(null);
    onRemove?.();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: {
      'text/csv': ['.csv']
    },
    onDrop: handleFileChange,
    onDropRejected: () => {
      onError?.('Please upload a CSV file');
    },
  });

  const validateFile = (file: File) => {
    return file.name.endsWith('.csv');
  };

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        whileHover="hover"
        className={cn(
          "p-4 group block rounded-lg cursor-pointer w-full relative overflow-hidden",
          isDragActive ? "bg-blue-50" : "bg-gray-50",
          !value && "border-2 border-dashed border-gray-300 hover:border-gray-400"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          aria-label="Upload CSV file"
        />

        {value ? (
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="bg-gray-100 rounded p-2">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[280px]">
                    {value.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(value.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={handleRemove}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Remove file"
                    title="Remove file"
                  >
                    <IconX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
            <IconUpload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Drag and drop your Harvest export file or click to upload
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
