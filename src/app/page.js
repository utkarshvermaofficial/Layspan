'use client';
import React, { useState } from 'react';
import Header from '../components/ui/Header';
import FileUpload from '../components/ui/FileUpload';
import ProcessingStatus from '../components/ui/ProcessingStatus';
import ResultsTable from '../components/ui/ResultsTable';
import AnalysisPanel from '../components/ui/AnalysisPanel';
import FeatureCard from '../components/ui/FeatureCard';

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [extractedResults, setExtractedResults] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [processingStats, setProcessingStats] = useState(null);

  const handleFileSelect = (files) => {
    setSelectedFiles(files);
    setExtractedResults([]);
    setAnalysisData(null);
    setProcessingStats(null);
    setProcessingStatus(null);
  };

  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) return;

    setProcessingStatus('processing');
    setProcessingProgress(0);
    setCurrentFile(`Processing ${selectedFiles.length} files together...`);

    try {
      // Create FormData with all files
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('files', file); // Use 'files' instead of 'file'
      });

      // Update progress to show we're processing
      setProcessingProgress(50);

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process files: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store analysis data
      if (result.analysis) {
        setAnalysisData(result.analysis);
      }
      
      // Transform the API response to match the expected format
      if (result.json_output && Array.isArray(result.json_output)) {
        const fileResults = result.json_output.map(event => ({
          event: event.event_description || 'Unknown Event',
          startTime: event.event_date && event.event_start_time 
            ? `${event.event_date}T${event.event_start_time}:00` 
            : event.event_date || 'Unknown',
          endTime: event.event_date && event.event_end_time 
            ? `${event.event_date}T${event.event_end_time}:00` 
            : null,
          description: event.event_description || '',
          sourceDocument: 'Combined Analysis', // Since we're processing together
          duration: event.duration || 'N/A',
          efficiency_rate: event.efficiency_rate || 'N/A'
        }));
        setExtractedResults(fileResults);
      }

      setProcessingProgress(100);
      setProcessingStatus('completed');
      setCurrentFile('');
      
      // Show processing stats if available
      if (result.processing_stats) {
        console.log(`✅ Batch processing complete:`, result.processing_stats);
        setProcessingStats(result.processing_stats);
      }

    } catch (error) {
      console.error('Error processing files:', error);
      setProcessingStatus('error');
      setCurrentFile('');
      alert(`Error processing files: ${error.message}`);
    }
  };

  const handleDownload = (format) => {
    if (extractedResults.length === 0) return;

    let content, filename, mimeType;

    if (format === 'json') {
      content = JSON.stringify(extractedResults, null, 2);
      filename = 'sof-events.json';
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const headers = ['Event', 'Start Time', 'End Time', 'Duration', 'Efficiency Rate', 'Description', 'Source Document'];
      const csvContent = [
        headers.join(','),
        ...extractedResults.map(event => [
          `"${event.event}"`,
          `"${event.startTime}"`,
          `"${event.endTime}"`,
          `"${event.duration || calculateDuration(event.startTime, event.endTime)}"`,
          `"${event.efficiency_rate || 'N/A'}"`,
          `"${event.description || ''}"`,
          `"${event.sourceDocument}"`
        ].join(','))
      ].join('\n');
      content = csvContent;
      filename = 'sof-events.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const features = [
    {
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Batch Processing",
      description: "Upload multiple documents from the same Statement of Facts. Our AI processes them together with automatic duplicate removal."
    },
    {
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Time-Based Analysis",
      description: "Accurate efficiency calculation based on actual work hours, considering parallel operations that happen simultaneously."
    },
    {
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Smart Deduplication",
      description: "Automatically identifies and removes duplicate events across multiple documents while preserving all unique operational periods."
    },
    {
      icon: (
        <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Flexible Export",
      description: "Download results in JSON or CSV format. Perfect for integration with existing maritime systems and laytime calculations."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
            SoF Event Extractor
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            AI-powered Statement of Facts processing for maritime laytime intelligence. 
            Process multiple documents together with smart deduplication and time-based efficiency analysis.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Upload Section */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Upload Statement of Facts</h2>
          <p className="text-gray-400 text-sm mb-6">
            Upload multiple files that are part of the same Statement of Facts. 
            They will be processed together with automatic duplicate removal and parallel work analysis.
          </p>
          <FileUpload onFileSelect={handleFileSelect} />
          
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <div className="bg-blue-900 bg-opacity-50 border border-blue-600 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium text-sm">Batch Processing</h4>
                    <p className="text-blue-200 text-xs mt-1">
                      {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} will be processed together as a single Statement of Facts set. 
                      Duplicates will be automatically removed and efficiency calculated based on actual work hours.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleProcessFiles}
                  disabled={processingStatus === 'processing'}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingStatus === 'processing' ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing {selectedFiles.length} Files...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Extract Events from {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {processingStatus && (
          <div className="mb-8">
            <ProcessingStatus 
              status={processingStatus}
              progress={processingProgress}
              currentFile={currentFile}
            />
          </div>
        )}

        {/* Results */}
        {processingStatus === 'completed' && extractedResults.length === 0 && (
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No Events Found</h3>
              <p className="text-gray-300 text-base">
                The document was processed but no events were extracted.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Please ensure the document contains Statement of Facts information with dates and times.
              </p>
            </div>
          </div>
        )}
        
        {processingStatus === 'error' && (
          <div className="bg-red-900 border border-red-700 rounded-lg shadow-xl p-6">
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Processing Error</h3>
              <p className="text-gray-300 text-base">
                An error occurred while processing your documents.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Please try again or contact support if the issue persists.
              </p>
            </div>
          </div>
        )}
        {extractedResults.length > 0 && (
          <div className="space-y-8">
            {/* Analysis Panel */}
            <AnalysisPanel analysis={analysisData} events={extractedResults} />
            
            {/* Results Table */}
            <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
              <ResultsTable 
                results={extractedResults}
                onDownload={handleDownload}
                processingStats={processingStats}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 Integrated Maritime Exchange. Building the world&apos;s first AI-powered maritime exchange.
            </p>
            <p className="text-gray-500 mt-2">
              Visit us at{' '}
              <a href="https://www.theimehub.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                www.theimehub.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
