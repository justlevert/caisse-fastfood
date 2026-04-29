'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { detectDocumentCorners, drawDocumentOverlay, cropDocument, DocumentCorners } from '@/lib/services/documentDetection';

interface CameraWithDetectionProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  onCameraError?: () => void;
}

export default function CameraWithDetection({ onCapture, onCancel, onCameraError }: CameraWithDetectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);

  const [isReady, setIsReady] = useState(false);
  const [detectedCorners, setDetectedCorners] = useState<DocumentCorners | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState<'none' | 'partial' | 'good'>('none');

  // Démarrer la caméra
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
          startDetection();
        };
      }
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      if (onCameraError) {
        onCameraError();
      } else {
        alert('Impossible d\'accéder à la caméra. Vérifiez que vous utilisez HTTPS.');
        onCancel();
      }
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startDetection = () => {
    const detectFrame = () => {
      if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      // Ajuster la taille des canvas
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');

      if (!ctx || !overlayCtx) return;

      // Dessiner la frame vidéo
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Incrémenter le compteur de frames
      frameCountRef.current++;

      // Détecter le document toutes les 10 frames pour économiser les ressources
      if (frameCountRef.current % 10 === 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const corners = detectDocumentCorners(imageData, canvas.width, canvas.height);
        setDetectedCorners(corners);
        
        // Évaluer la qualité de détection
        if (corners) {
          const area = calculatePolygonArea(corners);
          const canvasArea = canvas.width * canvas.height;
          const ratio = area / canvasArea;
          
          if (ratio > 0.15 && ratio < 0.85) {
            setDetectionQuality('good');
          } else {
            setDetectionQuality('partial');
          }
        } else {
          setDetectionQuality('none');
        }
      }

      // Effacer l'overlay précédent
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // Dessiner le cadre de détection avec couleur selon qualité
      if (detectedCorners) {
        const color = detectionQuality === 'good' ? '#00ff00' : '#ffaa00';
        drawDocumentOverlay(overlayCtx, detectedCorners, color, 4);
        drawDetectionText(overlayCtx, overlayCanvas.width, overlayCanvas.height, detectionQuality);
      } else {
        // Dessiner un guide de cadrage si aucun document détecté
        drawGuideFrame(overlayCtx, overlayCanvas.width, overlayCanvas.height);
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  const drawGuideFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const margin = 40;
    const cornerLength = 30;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Coins du guide
    const corners = [
      { x: margin, y: margin }, // Top-left
      { x: width - margin, y: margin }, // Top-right
      { x: width - margin, y: height - margin }, // Bottom-right
      { x: margin, y: height - margin }, // Bottom-left
    ];

    corners.forEach((corner, i) => {
      ctx.beginPath();
      
      if (i === 0) {
        // Top-left
        ctx.moveTo(corner.x, corner.y + cornerLength);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x + cornerLength, corner.y);
      } else if (i === 1) {
        // Top-right
        ctx.moveTo(corner.x - cornerLength, corner.y);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x, corner.y + cornerLength);
      } else if (i === 2) {
        // Bottom-right
        ctx.moveTo(corner.x, corner.y - cornerLength);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x - cornerLength, corner.y);
      } else {
        // Bottom-left
        ctx.moveTo(corner.x + cornerLength, corner.y);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x, corner.y - cornerLength);
      }
      
      ctx.stroke();
    });

    // Texte d'instruction
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Placez la facture dans le cadre', width / 2, height - 20);
  };

  const drawDetectionText = (ctx: CanvasRenderingContext2D, width: number, height: number, quality: 'none' | 'partial' | 'good') => {
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    
    if (quality === 'good') {
      ctx.fillStyle = '#00ff00';
      ctx.fillText('✓ Document détecté', width / 2, height - 20);
    } else if (quality === 'partial') {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('⚠️ Rapprochez-vous', width / 2, height - 20);
    }
  };

  const calculatePolygonArea = (corners: DocumentCorners): number => {
    const { topLeft, topRight, bottomRight, bottomLeft } = corners;
    const points = [topLeft, topRight, bottomRight, bottomLeft];
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area / 2);
  };

  const handleCapture = useCallback(async () => {
    if (!canvasRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      let finalCanvas = canvas;

      // Si un document est détecté, le recadrer
      if (detectedCorners) {
        console.log('📐 Recadrage automatique du document...');
        finalCanvas = cropDocument(canvas, detectedCorners);
      }

      // Convertir en Blob puis File
      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Erreur conversion canvas'));
          },
          'image/jpeg',
          0.92
        );
      });

      const file = new File([blob], `facture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      console.log('✅ Photo capturée:', file.name, `${Math.round(blob.size / 1024)}KB`);
      
      stopCamera();
      onCapture(file);
    } catch (error) {
      console.error('❌ Erreur capture:', error);
      alert('Erreur lors de la capture');
      setIsProcessing(false);
    }
  }, [detectedCorners, isProcessing, onCapture]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-70 text-white p-4 flex items-center justify-between">
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="text-white font-semibold text-lg"
        >
          ✕ Annuler
        </button>
        <div className="flex items-center gap-2">
          {detectionQuality === 'good' && (
            <span className="text-green-400 text-sm font-semibold">
              ✓ Document détecté
            </span>
          )}
          {detectionQuality === 'partial' && (
            <span className="text-yellow-400 text-sm font-semibold">
              ⚠️ Détection partielle
            </span>
          )}
        </div>
      </div>

      {/* Zone vidéo + overlay */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
              <p className="text-lg">Chargement de la caméra...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bouton de capture */}
      <div className="bg-black bg-opacity-70 p-6 flex justify-center">
        <button
          onClick={handleCapture}
          disabled={!isReady || isProcessing}
          className={`w-20 h-20 rounded-full border-4 transition-all ${
            detectionQuality === 'good'
              ? 'border-green-400 bg-green-500 shadow-lg shadow-green-500/50'
              : detectionQuality === 'partial'
              ? 'border-yellow-400 bg-yellow-500 shadow-lg shadow-yellow-500/50'
              : 'border-white bg-white'
          } ${isProcessing ? 'opacity-50' : 'active:scale-95'}`}
        >
          {isProcessing && (
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-600"></div>
          )}
        </button>
      </div>
    </div>
  );
}
