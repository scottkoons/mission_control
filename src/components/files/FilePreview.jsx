import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source - use local worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Helper to convert base64 data URL to Uint8Array
const dataURLtoUint8Array = (dataURL) => {
  const base64 = dataURL.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const FilePreview = ({ file, onClose, onDownload }) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Reset state when file changes
  useEffect(() => {
    setPdfError(false);
    setPdfDoc(null);
    setCurrentPage(1);
    setTotalPages(0);
    setLoading(true);
  }, [file]);

  // Load PDF document
  useEffect(() => {
    if (!file || file.type !== 'application/pdf') {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadPdf = async () => {
      const fileUrl = file.storageURL || file.data;
      if (!fileUrl) {
        setPdfError(true);
        setLoading(false);
        return;
      }

      try {
        // Get the PDF data as Uint8Array
        let pdfData;
        if (fileUrl.startsWith('data:')) {
          // Base64 data URL - convert directly
          pdfData = dataURLtoUint8Array(fileUrl);
        } else {
          // HTTP URL - fetch the file
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error('Failed to fetch PDF');
          const arrayBuffer = await response.arrayBuffer();
          pdfData = new Uint8Array(arrayBuffer);
        }

        if (cancelled) return;

        // Load the PDF document with the binary data
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (!cancelled) {
          setPdfError(true);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [file]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);

        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');

        // Calculate scale to fit the viewport while maintaining aspect ratio
        const containerWidth = window.innerWidth - 100;
        const containerHeight = window.innerHeight - 150;

        const viewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY, 2); // Max scale of 2 for quality

        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage]);

  // Handle keyboard navigation for PDF pages
  useEffect(() => {
    if (!pdfDoc) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc, totalPages]);

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const fileUrl = file.storageURL || file.data;

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <h3 className="text-white text-lg font-medium truncate max-w-md">
          {file.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="w-full h-full flex items-center justify-center pt-16 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && (
          <img
            src={fileUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}

        {isPDF && loading && (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isPDF && !loading && !pdfError && pdfDoc && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl">
              <canvas ref={canvasRef} />
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-4 bg-white/10 rounded-lg px-4 py-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="text-white text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </div>
        )}

        {isPDF && !loading && pdfError && (
          <div className="bg-surface rounded-lg p-8 text-center max-w-md">
            <p className="text-text-secondary mb-4">
              Unable to preview PDF in browser.
            </p>
            <button
              onClick={() => onDownload(file)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 mx-auto"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        )}

        {!isImage && !isPDF && (
          <div className="bg-surface rounded-lg p-8 text-center">
            <p className="text-text-secondary">
              Preview not available for this file type
            </p>
            <button
              onClick={() => onDownload(file)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreview;
