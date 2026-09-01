import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Upload, Download, FileText, Settings, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const RepairPDF = () => {
  const [fileUrl, setFileUrl] = useState('');
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({
    recoveryLevel: 'auto',
    aiCleanup: false,
    compress: false,
    watermark: { enabled: false, text: 'CONFIDENTIAL' },
    encrypt: { enabled: false, password: '' },
    includeReport: true
  });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      // For demo, we'll upload to a temporary URL (you can do this via your API)
      // Actually we'll just keep the file and send base64? Better to use fileUrl input.
      // For simplicity, we'll require a file URL; but we can also upload via a separate endpoint.
      setFileUrl(null);
    }
  };

  // Use a mock function to upload file and get URL (replace with real logic)
  const uploadFile = async () => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axios.post('/api/upload', formData, {
      onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total))
    });
    return data.url;
  };

  const handleRepair = async () => {
    setLoading(true);
    setError('');
    setProgress(10);

    try {
      let finalFileUrl = fileUrl;
      if (file) {
        // Upload file first
        finalFileUrl = await uploadFile();
      }

      if (!finalFileUrl) {
        throw new Error('Please provide a PDF URL or upload a file.');
      }

      setProgress(30);

      const payload = {
        action: 'repair-pdf',
        fileUrl: finalFileUrl,
        options: {
          recoveryLevel: options.recoveryLevel,
          aiCleanup: options.aiCleanup,
          applyTransform: {
            compress: options.compress,
            watermark: options.watermark.enabled ? options.watermark : null,
            encrypt: options.encrypt.enabled ? { password: options.encrypt.password } : null
          },
          includeReport: options.includeReport
        }
      };

      const { data } = await axios.post('/api/master-convert', payload);
      setResult(data);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-2xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FileText className="w-8 h-8 text-blue-600" /> PDF Repair Suite
      </h2>

      {/* File Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF or provide URL</label>
        <div className="flex gap-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <input
            type="text"
            placeholder="https://example.com/file.pdf"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Settings className="w-4 h-4" /> Recovery Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600">Recovery Level</label>
              <select
                value={options.recoveryLevel}
                onChange={(e) => setOptions({ ...options, recoveryLevel: e.target.value })}
                className="mt-1 block w-full border rounded-lg px-3 py-2"
              >
                <option value="auto">Auto (recommended)</option>
                <option value="quick">Quick (fast)</option>
                <option value="balanced">Balanced</option>
                <option value="deep">Deep (thorough)</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="aiCleanup"
                checked={options.aiCleanup}
                onChange={(e) => setOptions({ ...options, aiCleanup: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="aiCleanup" className="text-sm text-gray-600">AI metadata cleanup</label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Post-Repair Transformations</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="compress"
                checked={options.compress}
                onChange={(e) => setOptions({ ...options, compress: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="compress" className="text-sm text-gray-600">Compress file</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="watermark"
                checked={options.watermark.enabled}
                onChange={(e) => setOptions({ ...options, watermark: { ...options.watermark, enabled: e.target.checked } })}
                className="mr-2"
              />
              <label htmlFor="watermark" className="text-sm text-gray-600">Add watermark</label>
            </div>
            {options.watermark.enabled && (
              <input
                type="text"
                value={options.watermark.text}
                onChange={(e) => setOptions({ ...options, watermark: { ...options.watermark, text: e.target.value } })}
                className="block w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Watermark text"
              />
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="encrypt"
                checked={options.encrypt.enabled}
                onChange={(e) => setOptions({ ...options, encrypt: { ...options.encrypt, enabled: e.target.checked } })}
                className="mr-2"
              />
              <label htmlFor="encrypt" className="text-sm text-gray-600">Encrypt with password</label>
            </div>
            {options.encrypt.enabled && (
              <input
                type="password"
                value={options.encrypt.password}
                onChange={(e) => setOptions({ ...options, encrypt: { ...options.encrypt, password: e.target.value } })}
                className="block w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Password"
              />
            )}
          </div>
        </div>
      </div>

      {/* Include Report */}
      <div className="mb-6">
        <input
          type="checkbox"
          id="report"
          checked={options.includeReport}
          onChange={(e) => setOptions({ ...options, includeReport: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="report" className="text-sm text-gray-600">Generate recovery report</label>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleRepair}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        {loading ? 'Repairing...' : 'Start Repair'}
      </button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200"
          >
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Repair Successful!
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Recovery Tier:</strong> {result.report?.recoveryTier || 'Tier 1'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Recovery Score:</strong> {result.report?.recoveryScore !== undefined ? result.report.recoveryScore + '%' : 'N/A'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Original Size:</strong> {result.report ? (result.report.originalSize / 1024).toFixed(2) + ' KB' : 'N/A'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Final Size:</strong> {result.report ? (result.report.finalSize / 1024).toFixed(2) + ' KB' : 'N/A'}
              </p>
            </div>

            <div className="mt-4 flex gap-4">
              <a
                href={result.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" /> Download Repaired PDF
              </a>
              {result.report && (
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(result.report, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'repair-report.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300"
                >
                  <FileText className="w-4 h-4" /> Download Report
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RepairPDF;
