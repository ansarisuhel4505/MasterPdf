import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { removeBackground } from '@imgly/background-removal';
import {
  UploadCloud, Image as ImageIcon, Download, Palette,
  Settings, Sliders, FileDigit, RefreshCw, CheckCircle,
  AlertTriangle, ChevronLeft, ChevronRight, ImagePlus,
  X, Undo, Redo, ZoomIn, ZoomOut, Move, Save, Layers,
  Droplets, Eraser, Wand2, Trash2, Copy, Check, Star
} from 'lucide-react';

// ---------- Constant Definitions ----------
const PRESET_BGS = [
  // --- Studio & Minimalist ---
  { id: 'bg1', url: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=800&q=80', name: 'Luxury Studio' },
  { id: 'bg2', url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80', name: 'Clean White' },
  { id: 'bg3', url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80', name: 'Dark Texture' },
  { id: 'bg4', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80', name: 'Creative Desk' },
  { id: 'bg5', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', name: 'Modern Room' },

  // --- Abstract & 3D Art ---
  { id: 'bg6', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', name: 'Liquid 3D' },
  { id: 'bg7', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80', name: 'Color Splash' },
  { id: 'bg8', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80', name: 'Neon Geometry' },
  { id: 'bg9', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=800&q=80', name: 'Vibrant Glass' },
  { id: 'bg10', url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80', name: 'Pastel Dream' },

  // --- Gradients & Lights ---
  { id: 'bg11', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80', name: 'Soft Gradient' },
  { id: 'bg12', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=800&q=80', name: 'Cyberpunk Neon' },
  { id: 'bg13', url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=800&q=80', name: 'Fluid Light' },
  { id: 'bg14', url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80', name: 'Warm Orange' },
  { id: 'bg15', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=800&q=80', name: 'Galaxy Space' },

  // --- Nature & Scenery ---
  { id: 'bg16', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', name: 'Tropical Beach' },
  { id: 'bg17', url: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=800&q=80', name: 'Beautiful Peaks' },
  { id: 'bg18', url: 'https://images.unsplash.com/photo-1483728642387-6c3ba6c664f1?auto=format&fit=crop&w=800&q=80', name: 'Moody Forest' },
  { id: 'bg19', url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=800&q=80', name: 'Classic Wood' },
  { id: 'bg20', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', name: 'Mountain Lake' },
  
  // --- Professional & Textures ---
  { id: 'bg21', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', name: 'Glass Office' },
  { id: 'bg22', url: 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?auto=format&fit=crop&w=800&q=80', name: 'Brick Wall' },
  { id: 'bg23', url: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=800&q=80', name: 'Cozy Room' },
  { id: 'bg24', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80', name: 'Abstract Paint' },
  { id: 'bg25', url: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?auto=format&fit=crop&w=800&q=80', name: 'Clean Marble' },
];

const PRESET_GRADIENTS = [
  { id: 'grad1', colors: ['#667eea', '#764ba2'], name: 'Purple Blue' },
  { id: 'grad2', colors: ['#f093fb', '#f5576c'], name: 'Pink Red' },
  { id: 'grad3', colors: ['#4facfe', '#00f2fe'], name: 'Sky Blue' },
  { id: 'grad4', colors: ['#43e97b', '#38f9d7'], name: 'Green Teal' },
  { id: 'grad5', colors: ['#fa709a', '#fee140'], name: 'Sunset' },
];

// Toast system (simple)
const ToastContext = React.createContext();
const useToast = () => React.useContext(ToastContext);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] space-y-2">
        {toasts.map(toast => (
          <div key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`}>
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertTriangle size={18} />}
            {toast.message}
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function BgRemover() {
  const { addToast } = useToast();
  // ---------- State Management ----------
  // File & previews
  const [files, setFiles] = useState([]); // array of {file, id}
  const [currentIndex, setCurrentIndex] = useState(0);
  const [originalUrl, setOriginalUrl] = useState('');
  const [processedBlob, setProcessedBlob] = useState(null);
  const [finalPreviewUrl, setFinalPreviewUrl] = useState('');
  const [finalSizeInfo, setFinalSizeInfo] = useState(null);
  const [originalSizeInfo, setOriginalSizeInfo] = useState(null);

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [abortRequested, setAbortRequested] = useState(false);
  const abortRef = useRef(false);

  // Customization
  const [bgType, setBgType] = useState('transparent'); // 'transparent', 'color', 'image', 'gradient'
  const [bgValue, setBgValue] = useState('');
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(90);
  const [targetKb, setTargetKb] = useState('');
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowBlur, setShadowBlur] = useState(20);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(10);
  const [reflectionEnabled, setReflectionEnabled] = useState(false);
  const [reflectionOpacity, setReflectionOpacity] = useState(0.3);
  const [backgroundBlur, setBackgroundBlur] = useState(0);
  const [featherEdges, setFeatherEdges] = useState(false);
  const [featherAmount, setFeatherAmount] = useState(3);

  // Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Preview controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Slider position
  const [sliderPosition, setSliderPosition] = useState(50);

  // Presets saved
  const [savedPresets, setSavedPresets] = useState([]);

  // Refs for object URLs
  const originalUrlRef = useRef('');
  const finalUrlRef = useRef('');

  // ---------- Helper Functions ----------
  const revokeUrl = (ref) => {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = '';
    }
  };

  const pushHistory = (stateObj) => {
    setHistory(prev => {
      const newHist = [...prev.slice(0, historyIndex + 1), stateObj];
      if (newHist.length > 20) newHist.shift();
      setHistoryIndex(newHist.length - 1);
      return newHist;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      applyStateFromHistory(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      applyStateFromHistory(history[historyIndex + 1]);
    }
  };

  const applyStateFromHistory = (state) => {
    setBgType(state.bgType);
    setBgValue(state.bgValue);
    setFormat(state.format);
    setQuality(state.quality);
    setTargetKb(state.targetKb);
    setResizeWidth(state.resizeWidth);
    setResizeHeight(state.resizeHeight);
    setShadowEnabled(state.shadowEnabled);
    setShadowBlur(state.shadowBlur);
    setShadowColor(state.shadowColor);
    setShadowOffsetX(state.shadowOffsetX);
    setShadowOffsetY(state.shadowOffsetY);
    setReflectionEnabled(state.reflectionEnabled);
    setReflectionOpacity(state.reflectionOpacity);
    setBackgroundBlur(state.backgroundBlur);
    setFeatherEdges(state.featherEdges);
    setFeatherAmount(state.featherAmount);
    // Other preview states? maybe not.
  };

  // ---------- File Handling ----------
  const processFile = useCallback(async (file) => {
    // Revoke previous URLs
    revokeUrl(originalUrlRef);
    revokeUrl(finalUrlRef);

    const url = URL.createObjectURL(file);
    originalUrlRef.current = url;
    setOriginalUrl(url);
    setOriginalSizeInfo((file.size / 1024).toFixed(2));
    setProcessedBlob(null);
    setFinalPreviewUrl('');
    setBgType('transparent');
    setSliderPosition(50);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    pushHistory({
      bgType: 'transparent', bgValue: '', format: 'webp', quality: 90,
      targetKb: '', resizeWidth: '', resizeHeight: '', shadowEnabled: false,
      shadowBlur: 20, shadowColor: '#000000', shadowOffsetX: 0, shadowOffsetY: 10,
      reflectionEnabled: false, reflectionOpacity: 0.3, backgroundBlur: 0,
      featherEdges: false, featherAmount: 3
    });
  }, []);

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Validate
    const validFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
    if (validFiles.length !== selectedFiles.length) {
      addToast('Some files are not images and were skipped.', 'error');
    }
    if (validFiles.length === 0) {
      addToast('Please upload at least one valid image.', 'error');
      return;
    }

    // Support HEIC? We can attempt conversion using a library like heic2any, but for simplicity, we'll check MIME type
    if (validFiles.some(f => f.type === 'image/heic' || f.type === 'image/heif')) {
      addToast('HEIC files are not supported by all browsers. Please convert to JPEG/PNG first.', 'warning');
    }

    setFiles(prev => [...prev, ...validFiles.map(f => ({ id: Date.now() + Math.random(), file: f }))]);
    if (files.length === 0) {
      setCurrentIndex(0);
      processFile(validFiles[0]);
    } else {
      addToast(`${validFiles.length} file(s) added to queue.`, 'success');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload({ target: { files: droppedFiles } });
    }
  };

  // ---------- Drag & Drop attachment ----------
  const dropZoneRef = useRef(null);

  useEffect(() => {
    const zone = dropZoneRef.current;
    if (zone) {
      const prevent = (e) => e.preventDefault();
      zone.addEventListener('dragover', prevent);
      zone.addEventListener('drop', handleDrop);
      return () => {
        zone.removeEventListener('dragover', prevent);
        zone.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  // ---------- AI Removal ----------
  const runAiRemoval = async () => {
    if (!files[currentIndex]) return;
    setIsProcessing(true);
    setProgress(0);
    setLoadingText('Loading AI Model (runs locally)...');
    abortRef.current = false;
    setAbortRequested(false);

    try {
      const config = {
        progress: (key, current, total) => {
          if (abortRef.current) return;
          const percent = Math.round((current / total) * 100);
          setProgress(percent);
          setLoadingText(`Removing Background: ${percent}%`);
        }
      };

      const resultBlob = await removeBackground(files[currentIndex].file, config);
      if (abortRef.current) {
        addToast('Processing aborted.', 'info');
        setIsProcessing(false);
        return;
      }
      setProcessedBlob(resultBlob);
      addToast('Background removed successfully!', 'success');
    } catch (err) {
      console.error("BG Removal Error:", err);
      addToast('Failed to remove background. Please try a different image.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel AI
  const cancelProcessing = () => {
    abortRef.current = true;
    setAbortRequested(true);
    addToast('Cancellation requested...', 'info');
  };

  // ---------- Canvas Processing ----------
  const getCanvasBlob = (canvas, mimeType, qual) => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, qual / 100);
    });
  };

  const applyEditsAndCompress = async (
    sourceBlob = processedBlob,
    type = bgType,
    value = bgValue,
    qual = quality,
    fmt = format,
    target = targetKb
  ) => {
    if (!sourceBlob) return;

    const img = new Image();
    img.src = URL.createObjectURL(sourceBlob);
    await new Promise(r => img.onload = r);

    // Determine output dimensions based on resize settings
    let outWidth = img.width;
    let outHeight = img.height;
    if (resizeWidth && !resizeHeight) {
      outWidth = parseInt(resizeWidth);
      outHeight = Math.round(img.height * (outWidth / img.width));
    } else if (!resizeWidth && resizeHeight) {
      outHeight = parseInt(resizeHeight);
      outWidth = Math.round(img.width * (outHeight / img.height));
    } else if (resizeWidth && resizeHeight) {
      outWidth = parseInt(resizeWidth);
      outHeight = parseInt(resizeHeight);
    }

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');

    // Prepare main foreground image (scaled to output)
    const fgCanvas = document.createElement('canvas');
    fgCanvas.width = outWidth;
    fgCanvas.height = outHeight;
    const fgCtx = fgCanvas.getContext('2d');
    fgCtx.drawImage(img, 0, 0, outWidth, outHeight);

    // Apply feathering (slight blur on alpha edges)
    if (featherEdges) {
      fgCtx.filter = `blur(${featherAmount}px)`;
      fgCtx.drawImage(fgCanvas, 0, 0);
      fgCtx.filter = 'none';
    }

    // 1. Draw Background
    if (type === 'transparent') {
      // transparent already
    } else if (type === 'color' && value) {
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
   } else if (type === 'gradient' && value && Array.isArray(value)) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, value[0]);
      grad.addColorStop(1, value[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'image' && value) {
      const bgImg = new Image();
      bgImg.crossOrigin = "Anonymous";
      bgImg.src = value;
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = () => {
          console.error("Wallpaper blocked by CORS");
          addToast('Background image could not be loaded (CORS).', 'error');
          resolve(); // fallback to transparent
        };
      });

      if (backgroundBlur > 0) {
        ctx.filter = `blur(${backgroundBlur}px)`;
      }

      // Smart Cover Object-Fit Logic
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = bgImg.width / bgImg.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }
      ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none';
    }

    // 2. Draw Foreground (subject)
    // Optionally add shadow
    if (shadowEnabled) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
    }
    ctx.drawImage(fgCanvas, 0, 0);
    ctx.shadowColor = 'transparent'; // reset

    // 3. Add reflection
    if (reflectionEnabled) {
      const reflCanvas = document.createElement('canvas');
      reflCanvas.width = outWidth;
      reflCanvas.height = Math.floor(outHeight * 0.4);
      const rCtx = reflCanvas.getContext('2d');
      rCtx.translate(0, reflCanvas.height);
      rCtx.scale(1, -1);
      rCtx.globalAlpha = reflectionOpacity;
      rCtx.drawImage(fgCanvas, 0, 0, outWidth, reflCanvas.height);
      ctx.globalAlpha = 1;
      ctx.drawImage(reflCanvas, 0, outHeight);
    }

    // 4. Determine MIME type
    let mimeType = fmt === 'png' ? 'image/png' : (fmt === 'webp' ? 'image/webp' : 'image/jpeg');
    if (fmt === 'png' && target) mimeType = 'image/webp'; // PNG can't be exactly compressed

    let finalResultBlob;

    // 5. Binary search for exact KB compression
    if (target && Number(target) > 0) {
      const targetBytes = Number(target) * 1024;
      let minQ = 0.01, maxQ = 1.0, currentQ = 0.8;

      for (let i = 0; i < 8; i++) {
        finalResultBlob = await getCanvasBlob(canvas, mimeType, currentQ * 100);
        if (finalResultBlob.size > targetBytes) maxQ = currentQ;
        else minQ = currentQ;
        currentQ = (minQ + maxQ) / 2;
      }
      if (finalResultBlob.size > targetBytes && currentQ > 0.1) {
        finalResultBlob = await getCanvasBlob(canvas, mimeType, (currentQ - 0.1) * 100);
      }
    } else {
      finalResultBlob = await getCanvasBlob(canvas, mimeType, qual);
    }

    // Revoke previous final URL
    revokeUrl(finalUrlRef);
    const finalUrl = URL.createObjectURL(finalResultBlob);
    finalUrlRef.current = finalUrl;
    setFinalPreviewUrl(finalUrl);
    setFinalSizeInfo((finalResultBlob.size / 1024).toFixed(2));
  };

  // Debounced auto re-render on settings change
  useEffect(() => {
    if (processedBlob && !isProcessing) {
      const timer = setTimeout(() => applyEditsAndCompress(), 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgType, bgValue, quality, format, targetKb, resizeWidth, resizeHeight,
    shadowEnabled, shadowBlur, shadowColor, shadowOffsetX, shadowOffsetY,
    reflectionEnabled, reflectionOpacity, backgroundBlur, featherEdges, featherAmount]);

  // Also run once when processedBlob changes (after removal)
  useEffect(() => {
    if (processedBlob && !isProcessing) {
      pushHistory({
        bgType, bgValue, format, quality, targetKb,
        resizeWidth, resizeHeight, shadowEnabled, shadowBlur,
        shadowColor, shadowOffsetX, shadowOffsetY, reflectionEnabled,
        reflectionOpacity, backgroundBlur, featherEdges, featherAmount
      });
      applyEditsAndCompress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedBlob]);

  // ---------- Download ----------
  const handleDownload = () => {
    if (!finalPreviewUrl) return;
    const link = document.createElement('a');
    link.href = finalPreviewUrl;
    let ext = format;
    if (format === 'png' && targetKb) ext = 'webp';
    link.download = `MasterPdf_Studio_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Download started!', 'success');
  };

  // ---------- Preset Management ----------
  const savePreset = () => {
    const preset = {
      name: `Preset ${savedPresets.length + 1}`,
      bgType, bgValue, format, quality, targetKb,
      resizeWidth, resizeHeight, shadowEnabled, shadowBlur,
      shadowColor, shadowOffsetX, shadowOffsetY, reflectionEnabled,
      reflectionOpacity, backgroundBlur, featherEdges, featherAmount
    };
    setSavedPresets(prev => [...prev, preset]);
    addToast('Preset saved!', 'success');
  };

  const loadPreset = (preset) => {
    setBgType(preset.bgType);
    setBgValue(preset.bgValue);
    setFormat(preset.format);
    setQuality(preset.quality);
    setTargetKb(preset.targetKb);
    setResizeWidth(preset.resizeWidth);
    setResizeHeight(preset.resizeHeight);
    setShadowEnabled(preset.shadowEnabled);
    setShadowBlur(preset.shadowBlur);
    setShadowColor(preset.shadowColor);
    setShadowOffsetX(preset.shadowOffsetX);
    setShadowOffsetY(preset.shadowOffsetY);
    setReflectionEnabled(preset.reflectionEnabled);
    setReflectionOpacity(preset.reflectionOpacity);
    setBackgroundBlur(preset.backgroundBlur);
    setFeatherEdges(preset.featherEdges);
    setFeatherAmount(preset.featherAmount);
    addToast('Preset loaded!', 'success');
  };

  // ---------- Keyboard Shortcuts ----------
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleDownload();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo, handleDownload]);

  // ---------- Zoom & Pan Controls ----------
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.5));
  const handlePanStart = (e) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handlePanMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handlePanEnd = () => {
    isDragging.current = false;
  };

  // ---------- Queue navigation ----------
  const nextImage = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
      processFile(files[currentIndex + 1].file);
    }
  };
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      processFile(files[currentIndex - 1].file);
    }
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7] overflow-x-hidden w-full">
      <Head><title>Pro AI Background Remover | MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 mt-16 mb-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Pro Background Studio</h1>
          <p className="text-gray-600">Remove background, apply premium wallpapers, compress to exact KB.</p>
        </div>

        {/* Batch queue indicator */}
        {files.length > 1 && (
          <div className="w-full mb-4 flex justify-center items-center gap-2">
            <button onClick={prevImage} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40" disabled={currentIndex === 0}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-gray-700">Image {currentIndex + 1} of {files.length}</span>
            <button onClick={nextImage} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40" disabled={currentIndex === files.length - 1}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setFiles([])} className="ml-2 text-red-500 text-xs font-bold underline">Clear All</button>
          </div>
        )}

       <div className="w-full flex flex-col lg:flex-row gap-6">

          {/* LEFT: PREMIUM SLIDER VIEWER & WALLPAPERS */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center min-h-[450px] relative">
              {!files.length ? (
                <div
                  ref={dropZoneRef}
                  className="flex flex-col items-center justify-center h-full w-full py-20 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  <input type="file" id="image-upload" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  <UploadCloud size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-600 font-bold">Drag & Drop Image Here</p>
                  <p className="text-gray-400 text-sm mt-2">or click to select (multiple allowed)</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Visual Studio</h3>
                    <div className="flex gap-2">
                      <button onClick={() => document.getElementById('image-upload').click()} className="text-sm text-blue-600 font-bold hover:underline">Add More</button>
                      <button onClick={() => setFiles([])} className="text-sm text-red-500 font-bold hover:underline">Clear All</button>
                    </div>
                  </div>

                  {isProcessing ? (
                    <div className="flex-1 w-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border p-10">
                      <RefreshCw size={50} className="text-blue-600 animate-spin mb-4" />
                      <p className="font-bold text-gray-800 text-lg">{loadingText}</p>
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-3 mt-4">
                        <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                      </div>
                      <button onClick={cancelProcessing} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600">
                        Cancel Processing
                      </button>
                    </div>
                  ) : !finalPreviewUrl ? (
                    <div className="relative w-full flex-1 flex flex-col items-center justify-center">
                      <img src={originalUrl} alt="Original" className="max-h-[400px] object-contain opacity-50 blur-[1px] rounded-xl" />
                      <button onClick={runAiRemoval} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:bg-blue-700 flex items-center gap-3 hover:scale-105 transition">
                        <Settings size={22} /> Start AI Engine
                      </button>
                    </div>
                  ) : (
                   /* 🔥 PREMIUM BEFORE/AFTER SLIDER 🔥 */
                    <div
                      className="relative w-full max-w-2xl h-[400px] bg-gray-100 rounded-xl overflow-hidden shadow-inner group touch-none"
                      style={{ 
                        backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMElEQVQ4y2NgQAX8DIwg8n8QAwMMnBkYgAxi4yIokA1h4CKIIzYuAnKJAx8DDZwkAACAekM72iI2mAAAAABJRU5ErkJggg==")',
                        transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, 
                        cursor: isDragging.current ? 'grabbing' : 'grab' 
                      }}
                      onMouseDown={handlePanStart}
                      onMouseMove={handlePanMove}
                      onMouseUp={handlePanEnd}
                      onMouseLeave={handlePanEnd}
                      onTouchStart={(e) => { e.preventDefault(); handlePanStart({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }); }}
                      onTouchMove={(e) => { e.preventDefault(); handlePanMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }); }}
                      onTouchEnd={handlePanEnd}
                    >
                      {/* After (Processed) Image - Bottom Layer */}
                      <img src={finalPreviewUrl} alt="Processed" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" draggable="false" />

                      {/* Before (Original) Image - Top Clipped Layer */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                        <div className="absolute inset-0 bg-white"></div>
                        <img src={originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain" draggable="false" />
                      </div>

                      {/* Invisible Slider Input */}
                      <input
                        type="range" min="0" max="100" value={sliderPosition}
                        onChange={(e) => setSliderPosition(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()} 
                        onTouchStart={(e) => e.stopPropagation()} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                      />

                      {/* Premium Divider Line with Arrows */}
                      <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 flex flex-col justify-center items-center pointer-events-none" style={{ left: `calc(${sliderPosition}% - 2px)` }}>
                        <div className="w-8 h-8 bg-white text-gray-800 rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                          <ChevronLeft size={14} className="-mr-1" /><ChevronRight size={14} />
                        </div>
                      </div>

                      {/* Helper Tags */}
                      <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">Original</span>
                      <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">Removed</span>

                      {/* Zoom controls */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                        <button onClick={handleZoomIn} className="p-2 bg-white rounded-full shadow hover:bg-gray-100"><ZoomIn size={18} /></button>
                        <button onClick={handleZoomOut} className="p-2 bg-white rounded-full shadow hover:bg-gray-100"><ZoomOut size={18} /></button>
                        <button onClick={() => setZoom(1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100"><Move size={18} /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 🔥 PREMIUM WALLPAPER GALLERY 🔥 */}
            <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-5 transition-opacity ${!processedBlob ? 'opacity-40 pointer-events-none' : ''}`}>
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><ImagePlus size={16} /> Instant Backgrounds</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => { setBgType('transparent'); setBgValue(''); }} className={`flex-shrink-0 w-20 h-16 rounded-xl border-2 overflow-hidden flex items-center justify-center ${bgType === 'transparent' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} style={{ backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMElEQVQ4y2NgQAX8DIwg8n8QAwMMnBkYgAxi4yIokA1h4CKIIzYuAnKJAx8DDZwkAACAekM72iI2mAAAAABJRU5ErkJggg==")' }}>
                  <span className="bg-white/80 text-[10px] font-bold px-1 rounded shadow-sm">None</span>
                </button>

                {PRESET_BGS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => { setBgType('image'); setBgValue(bg.url); }}
                    className={`flex-shrink-0 w-24 h-16 rounded-xl border-2 overflow-hidden relative group ${bgType === 'image' && bgValue === bg.url ? 'border-blue-600 shadow-md' : 'border-transparent hover:scale-105 transition'}`}
                  >
                    <img src={bg.url} className="w-full h-full object-cover" alt={bg.name} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold text-center px-1">{bg.name}</span>
                    </div>
                  </button>
                ))}
              </div>

             {/* Gradient presets */}
              <h4 className="text-xs font-bold text-gray-600 mt-4 mb-2">Gradient Backgrounds</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {PRESET_GRADIENTS.map((grad) => (
                  <button
                    key={grad.id}
                    onClick={() => { setBgType('gradient'); setBgValue(grad.colors); }}
                    className={`flex-shrink-0 w-24 h-16 rounded-xl border-2 overflow-hidden relative group ${bgType === 'gradient' && bgValue === grad.colors ? 'border-blue-600 shadow-md' : 'border-transparent hover:scale-105 transition'}`}
                    style={{ background: `linear-gradient(135deg, ${grad.colors[0]} 0%, ${grad.colors[1]} 100%)` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold text-center px-1 drop-shadow">{grad.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: PRO CONTROLS (Compress & Format) */}
          <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-fit">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b pb-3"><Settings size={20} /> Output Tuning</h3>

            <div className={`space-y-6 ${!processedBlob ? 'opacity-40 pointer-events-none' : ''}`}>

              {/* Solid Color / Gradient picker */}
              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2"><Palette size={16} /> Solid Color / Gradient</label>
                <div className="relative w-full">
                  <input
                    type="color"
                    value={bgType === 'color' ? bgValue : '#ffffff'}
                    onChange={(e) => { setBgType('color'); setBgValue(e.target.value); }}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`w-full h-12 rounded-lg border-2 shadow-sm flex items-center justify-center font-mono text-sm font-bold transition-all ${bgType === 'color' ? 'border-blue-600' : 'border-gray-200 bg-white'}`} style={{ backgroundColor: bgType === 'color' ? bgValue : '#fff', color: bgType === 'color' && bgValue !== '#ffffff' ? '#fff' : '#475569' }}>
                    {bgType === 'color' ? bgValue.toUpperCase() : 'Pick Custom Color'}
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setBgType('gradient')} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100">Use Gradient</button>
                  <button onClick={() => setBgType('transparent')} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200">Transparent</button>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2"><FileDigit size={16} /> Output Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                  <option value="webp">WEBP (Best quality & transparency)</option>
                  <option value="png">PNG (Lossless size)</option>
                  <option value="jpeg">JPEG (No transparency)</option>
                </select>
                {format === 'jpeg' && bgType === 'transparent' && (
                  <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1 font-bold"><AlertTriangle size={10} /> JPEG makes transparent areas white.</p>
                )}
              </div>

              {/* Exact KB Compressor */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <label className="flex text-sm font-bold text-indigo-900 mb-2">Target Size in KB (Optional)</label>
                <input
                  type="number" placeholder="e.g. 15, 50, 100"
                  value={targetKb} onChange={(e) => setTargetKb(e.target.value)}
                  className="w-full p-2 border border-indigo-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 placeholder-indigo-300"
                />
                <p className="text-[10px] text-indigo-700 mt-2 font-medium">Enter an exact size. Our AI algorithm will compress the image to match this size exactly.</p>
              </div>

              {/* Manual Quality Slider */}
              <div className={`pt-2 ${targetKb ? 'opacity-30' : ''}`}>
                <label className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                  <span className="flex items-center gap-2"><Sliders size={16} /> Manual Quality</span>
                  <span className="text-blue-600 bg-blue-50 px-2 rounded">{quality}%</span>
                </label>
                <input type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} disabled={targetKb !== ''} className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer" />
              </div>

              {/* Resize Options */}
              <div className="border-t border-gray-200 pt-4">
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2"><Layers size={16} /> Resize Output (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Width" value={resizeWidth}
                    onChange={(e) => setResizeWidth(e.target.value)} className="w-1/2 p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="number" placeholder="Height" value={resizeHeight}
                    onChange={(e) => setResizeHeight(e.target.value)} className="w-1/2 p-2 border rounded-lg text-sm"
                  />
                </div>
                <button onClick={() => { setResizeWidth(''); setResizeHeight(''); }} className="mt-1 text-xs text-gray-500 hover:text-red-500 font-bold">Clear</button>
              </div>

              {/* Shadow & Reflection */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2"><Wand2 size={16} /> Effects</h4>
                <label className="flex items-center justify-between text-sm">
                  <span>Drop Shadow</span>
                  <input type="checkbox" checked={shadowEnabled} onChange={(e) => setShadowEnabled(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                </label>
                {shadowEnabled && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className="w-8 h-8 border rounded" />
                      <input type="number" min="0" max="100" value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))} className="w-20 p-1 border rounded text-sm" title="Blur" />
                      <input type="number" min="-50" max="50" value={shadowOffsetX} onChange={(e) => setShadowOffsetX(Number(e.target.value))} className="w-16 p-1 border rounded text-sm" title="Offset X" />
                      <input type="number" min="-50" max="50" value={shadowOffsetY} onChange={(e) => setShadowOffsetY(Number(e.target.value))} className="w-16 p-1 border rounded text-sm" title="Offset Y" />
                    </div>
                  </div>
                )}
                <label className="flex items-center justify-between text-sm">
                  <span>Reflection</span>
                  <input type="checkbox" checked={reflectionEnabled} onChange={(e) => setReflectionEnabled(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                </label>
                {reflectionEnabled && (
                  <div>
                    <label className="text-xs text-gray-600">Opacity: {Math.round(reflectionOpacity * 100)}%</label>
                    <input type="range" min="0" max="1" step="0.05" value={reflectionOpacity} onChange={(e) => setReflectionOpacity(Number(e.target.value))} className="w-full accent-blue-600" />
                  </div>
                )}
                <label className="flex items-center justify-between text-sm">
                  <span>Background Blur</span>
                  <input type="checkbox" checked={backgroundBlur > 0} onChange={(e) => setBackgroundBlur(e.target.checked ? 5 : 0)} className="w-4 h-4 accent-blue-600" />
                </label>
                {backgroundBlur > 0 && (
                  <div>
                    <input type="range" min="0" max="20" value={backgroundBlur} onChange={(e) => setBackgroundBlur(Number(e.target.value))} className="w-full accent-blue-600" />
                  </div>
                )}
                <label className="flex items-center justify-between text-sm">
                  <span>Feather Edges</span>
                  <input type="checkbox" checked={featherEdges} onChange={(e) => setFeatherEdges(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                </label>
                {featherEdges && (
                  <div>
                    <input type="range" min="1" max="10" value={featherAmount} onChange={(e) => setFeatherAmount(Number(e.target.value))} className="w-full accent-blue-600" />
                  </div>
                )}
              </div>

              {/* Preset Management */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold flex items-center gap-2"><Save size={16} /> Presets</h4>
                  <button onClick={savePreset} className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold hover:bg-blue-700">Save Current</button>
                </div>
                {savedPresets.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {savedPresets.map((preset, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs font-bold">{preset.name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => loadPreset(preset)} className="text-xs text-blue-600 hover:underline">Load</button>
                          <button onClick={() => setSavedPresets(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:underline">Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No presets saved yet.</p>
                )}
              </div>

              {/* Undo/Redo */}
              <div className="border-t border-gray-200 pt-4 flex gap-2">
                <button onClick={undo} disabled={historyIndex <= 0} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-40"><Undo size={16} className="inline mr-1" /> Undo</button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-40"><Redo size={16} className="inline mr-1" /> Redo</button>
              </div>

              {/* Compression Result Compare */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                  <span className="text-xs font-bold text-green-800">Original Size: {originalSizeInfo || '0.00'} KB</span>
                  <span className="text-xs font-bold text-green-800">Final Size: {finalSizeInfo || '0.00'} KB</span>
                </div>
              </div>

              {/* Download Section */}
              <div className="border-t border-gray-200 pt-5 mt-2">
                <button onClick={handleDownload} className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                  <Download size={20} /> Download Result
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Wrap with ToastProvider in _app.js or here? We'll wrap in export default.
export default function AppWrapper() {
  return (
    <ToastProvider>
      <BgRemover />
    </ToastProvider>
  );
}
