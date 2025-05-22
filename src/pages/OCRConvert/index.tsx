import React, { useState } from 'react';
import { Upload, FileType, AlertCircle } from 'lucide-react';
import axios from 'axios';

const OCRConvert: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('user_id', '1'); // Replace with actual user ID from your auth system
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/ocr-conversion', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Create a download link for the received PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_extracted.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to process the PDF. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OCR PDF Conversion</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-4"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <div className="text-lg">
                  {file ? (
                    <span className="text-blue-600">{file.name}</span>
                  ) : (
                    <span>
                      Drop your PDF here or{' '}
                      <span className="text-blue-600">browse</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">PDF files only</p>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                !file || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'Convert PDF'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <h2 className="font-semibold mb-2">How it works:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Upload an image-based PDF document</li>
            <li>Our system will process the document using OCR technology</li>
            <li>Download the searchable PDF with extracted text</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default OCRConvert; 