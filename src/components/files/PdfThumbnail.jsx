import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
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

const PdfThumbnail = ({ file, className = '' }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderPdf = async () => {
      const fileUrl = file.storageURL || file.data;
      if (!fileUrl) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);

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

        // Get the first page
        const page = await pdf.getPage(1);

        // Get canvas and context
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const context = canvas.getContext('2d');

        // Calculate scale to fit the thumbnail size
        const containerWidth = canvas.parentElement?.clientWidth || 150;
        const containerHeight = canvas.parentElement?.clientHeight || 150;

        const viewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render the page
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error rendering PDF thumbnail:', err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-surface-hover ${className}`}>
        <FileText size={24} className="text-text-muted" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-white ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-hover">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

export default PdfThumbnail;
