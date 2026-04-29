/**
 * Détection et recadrage automatique de documents (factures, feuilles)
 * Utilise la détection de contours simplifiée sans OpenCV
 */

export interface Corner {
  x: number;
  y: number;
}

export interface DocumentCorners {
  topLeft: Corner;
  topRight: Corner;
  bottomRight: Corner;
  bottomLeft: Corner;
}

/**
 * Détecte les contours d'un document dans une image
 */
export function detectDocumentCorners(
  imageData: ImageData,
  width: number,
  height: number
): DocumentCorners | null {
  // Convertir en niveaux de gris
  const gray = toGrayscale(imageData);

  // Appliquer un flou gaussien pour réduire le bruit
  const blurred = gaussianBlur(gray, width, height);

  // Détection de contours (Canny simplifié)
  const edges = detectEdges(blurred, width, height);

  // Trouver les contours
  const contours = findContours(edges, width, height);

  // Trouver le plus grand contour rectangulaire
  const docContour = findLargestRectangle(contours, width, height);

  return docContour;
}

/**
 * Recadre une image selon les coins détectés
 */
export function cropDocument(
  canvas: HTMLCanvasElement,
  corners: DocumentCorners,
  targetWidth: number = 1200
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Calculer les dimensions du document
  const docWidth = Math.max(
    distance(corners.topLeft, corners.topRight),
    distance(corners.bottomLeft, corners.bottomRight)
  );
  const docHeight = Math.max(
    distance(corners.topLeft, corners.bottomLeft),
    distance(corners.topRight, corners.bottomRight)
  );

  // Créer un nouveau canvas pour le résultat
  const outputCanvas = document.createElement('canvas');
  const aspectRatio = docHeight / docWidth;
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetWidth * aspectRatio;

  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Output canvas context not available');

  // Transformation perspective (approximation simple)
  // Pour une vraie transformation perspective, il faudrait utiliser une matrice de transformation
  // Ici on fait une approximation avec drawImage
  
  // Points source (coins détectés)
  const src = [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ];

  // Points destination (rectangle normalisé)
  const dst = [
    { x: 0, y: 0 },
    { x: outputCanvas.width, y: 0 },
    { x: outputCanvas.width, y: outputCanvas.height },
    { x: 0, y: outputCanvas.height },
  ];

  // Transformation perspective simplifiée
  applyPerspectiveTransform(ctx, outputCtx, canvas, outputCanvas, src, dst);

  return outputCanvas;
}

/**
 * Dessine un cadre autour des coins détectés
 */
export function drawDocumentOverlay(
  ctx: CanvasRenderingContext2D,
  corners: DocumentCorners | null,
  color: string = '#00ff00',
  lineWidth: number = 3
) {
  if (!corners) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Dessiner le contour
  ctx.beginPath();
  ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
  ctx.lineTo(corners.topRight.x, corners.topRight.y);
  ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
  ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
  ctx.closePath();
  ctx.stroke();

  // Dessiner les coins
  const cornerRadius = 8;
  [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft].forEach(corner => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(corner.x, corner.y, cornerRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

function toGrayscale(imageData: ImageData): Uint8ClampedArray {
  const gray = new Uint8ClampedArray(imageData.width * imageData.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return gray;
}

function gaussianBlur(
  gray: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const blurred = new Uint8ClampedArray(gray.length);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          sum += gray[idx] * kernel[kernelIdx];
        }
      }
      blurred[y * width + x] = sum / kernelSum;
    }
  }

  return blurred;
}

function detectEdges(
  gray: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const edges = new Uint8ClampedArray(gray.length);
  const threshold = 50;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Sobel X
      const gx =
        -gray[(y - 1) * width + (x - 1)] +
        gray[(y - 1) * width + (x + 1)] +
        -2 * gray[y * width + (x - 1)] +
        2 * gray[y * width + (x + 1)] +
        -gray[(y + 1) * width + (x - 1)] +
        gray[(y + 1) * width + (x + 1)];

      // Sobel Y
      const gy =
        -gray[(y - 1) * width + (x - 1)] +
        -2 * gray[(y - 1) * width + x] +
        -gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] +
        2 * gray[(y + 1) * width + x] +
        gray[(y + 1) * width + (x + 1)];

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[idx] = magnitude > threshold ? 255 : 0;
    }
  }

  return edges;
}

function findContours(
  edges: Uint8ClampedArray,
  width: number,
  height: number
): Corner[][] {
  const contours: Corner[][] = [];
  const visited = new Uint8ClampedArray(edges.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (edges[idx] === 255 && !visited[idx]) {
        const contour = traceContour(edges, visited, x, y, width, height);
        if (contour.length > 50) {
          contours.push(contour);
        }
      }
    }
  }

  return contours;
}

function traceContour(
  edges: Uint8ClampedArray,
  visited: Uint8ClampedArray,
  startX: number,
  startY: number,
  width: number,
  height: number
): Corner[] {
  const contour: Corner[] = [];
  const stack: Corner[] = [{ x: startX, y: startY }];

  while (stack.length > 0 && contour.length < 1000) {
    const point = stack.pop()!;
    const idx = point.y * width + point.x;

    if (visited[idx]) continue;
    visited[idx] = 1;
    contour.push(point);

    // 8-connectivité
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = point.x + dx;
        const ny = point.y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          if (edges[nidx] === 255 && !visited[nidx]) {
            stack.push({ x: nx, y: ny });
          }
        }
      }
    }
  }

  return contour;
}

function findLargestRectangle(
  contours: Corner[][],
  width: number,
  height: number
): DocumentCorners | null {
  let maxArea = 0;
  let bestCorners: DocumentCorners | null = null;

  for (const contour of contours) {
    const approx = approximatePolygon(contour);
    
    if (approx.length === 4) {
      const area = polygonArea(approx);
      const imageArea = width * height;
      
      // Le document doit occuper au moins 20% de l'image
      if (area > maxArea && area > imageArea * 0.2) {
        maxArea = area;
        bestCorners = orderCorners(approx);
      }
    }
  }

  return bestCorners;
}

function approximatePolygon(contour: Corner[]): Corner[] {
  if (contour.length < 4) return contour;

  // Douglas-Peucker simplifié
  const epsilon = 0.02 * arcLength(contour);
  return douglasPeucker(contour, epsilon);
}

function douglasPeucker(points: Corner[], epsilon: number): Corner[] {
  if (points.length < 3) return points;

  let maxDist = 0;
  let maxIndex = 0;

  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return left.slice(0, -1).concat(right);
  } else {
    return [first, last];
  }
}

function perpendicularDistance(point: Corner, lineStart: Corner, lineEnd: Corner): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const norm = Math.sqrt(dx * dx + dy * dy);
  
  if (norm === 0) return distance(point, lineStart);
  
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / norm;
}

function arcLength(contour: Corner[]): number {
  let length = 0;
  for (let i = 0; i < contour.length - 1; i++) {
    length += distance(contour[i], contour[i + 1]);
  }
  return length;
}

function polygonArea(corners: Corner[]): number {
  let area = 0;
  for (let i = 0; i < corners.length; i++) {
    const j = (i + 1) % corners.length;
    area += corners[i].x * corners[j].y;
    area -= corners[j].x * corners[i].y;
  }
  return Math.abs(area / 2);
}

function orderCorners(corners: Corner[]): DocumentCorners {
  // Trier les coins dans l'ordre: topLeft, topRight, bottomRight, bottomLeft
  const sorted = corners.slice().sort((a, b) => a.y - b.y);
  
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);

  return {
    topLeft: top[0],
    topRight: top[1],
    bottomRight: bottom[1],
    bottomLeft: bottom[0],
  };
}

function distance(p1: Corner, p2: Corner): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function applyPerspectiveTransform(
  srcCtx: CanvasRenderingContext2D,
  dstCtx: CanvasRenderingContext2D,
  srcCanvas: HTMLCanvasElement,
  dstCanvas: HTMLCanvasElement,
  src: Corner[],
  dst: Corner[]
) {
  // Transformation perspective simplifiée
  // Pour une vraie transformation, il faudrait calculer la matrice de transformation perspective
  // Ici on fait une approximation en découpant l'image en grille et en interpolant
  
  const gridSize = 20;
  const stepX = dstCanvas.width / gridSize;
  const stepY = dstCanvas.height / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const dstX = i * stepX;
      const dstY = j * stepY;
      
      // Interpolation bilinéaire inverse pour trouver le point source
      const u = i / gridSize;
      const v = j / gridSize;
      
      const srcX =
        (1 - u) * (1 - v) * src[0].x +
        u * (1 - v) * src[1].x +
        u * v * src[2].x +
        (1 - u) * v * src[3].x;
      
      const srcY =
        (1 - u) * (1 - v) * src[0].y +
        u * (1 - v) * src[1].y +
        u * v * src[2].y +
        (1 - u) * v * src[3].y;

      // Copier le pixel
      try {
        dstCtx.drawImage(
          srcCanvas,
          srcX, srcY, stepX, stepY,
          dstX, dstY, stepX, stepY
        );
      } catch (e) {
        // Ignorer les erreurs de dessin hors limites
      }
    }
  }
}
