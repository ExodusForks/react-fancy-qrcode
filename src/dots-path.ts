type DotsPathOptions = {
  matrix: number[][];
  cellSize: number;
  dotScale: number;
  dotRadius: string | number;
  viewportHeight: number;
  logoStartCell: number;
  logoStopCell: number;
};

const round = (value: number) => String(Math.round(value * 1000) / 1000);

const inPositioningPattern = (row: number, column: number, sideCount: number) =>
  (column <= 7 && row <= 7) ||
  (column >= sideCount - 8 && row <= 7) ||
  (column <= 7 && row >= sideCount - 7);

// Same as an SVG <rect> with only `ry`: % of viewport height, capped at half the side
const resolveRadius = (
  dotRadius: string | number,
  viewportHeight: number,
  dotSize: number
) => {
  const parsed = parseFloat(String(dotRadius));
  if (!(parsed > 0)) return 0;

  const isPercent = typeof dotRadius === "string" && /%\s*$/.test(dotRadius);
  const radius = isPercent ? (parsed / 100) * viewportHeight : parsed;
  return Math.min(radius, dotSize / 2);
};

const createDotShape = (size: number, radius: number) => {
  const s = round(size);
  if (radius === 0) {
    return { dx: 0, dy: 0, shape: `h${s}v${s}h-${s}z` };
  }

  if (radius * 2 >= size) {
    const half = String(Number(s) / 2);
    return {
      dx: 0,
      dy: radius,
      shape: `a${half} ${half} 0 0 0 ${s} 0a${half} ${half} 0 0 0 -${s} 0z`,
    };
  }

  const r = round(radius);

  const edge = round(size - radius * 2);
  const back = `-${r}`;
  const corner = (x: string, y: string) => `a${r} ${r} 0 0 1 ${x} ${y}`;
  const segments = [
    `h${edge}`,
    corner(r, r),
    `v${edge}`,
    corner(back, r),
    `h-${edge}`,
    corner(back, back),
    `v-${edge}`,
    corner(r, back),
    "z",
  ];
  return { dx: radius, dy: 0, shape: segments.join("") };
};

/**
 * Builds one SVG path for every data dot, so the QR code renders as a single native element
 */
export const createDotsPath = ({
  matrix,
  cellSize,
  dotScale,
  dotRadius,
  viewportHeight,
  logoStartCell,
  logoStopCell,
}: DotsPathOptions) => {
  const sideCount = matrix.length;
  const size = cellSize * dotScale;
  const offset = dotScale !== 1 ? (cellSize - size) / 2 : 0;
  const { dx, dy, shape } = createDotShape(
    size,
    resolveRadius(dotRadius, viewportHeight, size)
  );
  const hasLogo = Boolean(logoStartCell && logoStopCell);

  let path = "";
  matrix.forEach((rowData, row) => {
    rowData.forEach((value, column) => {
      if (!value) return;
      if (
        hasLogo &&
        column >= logoStartCell &&
        column < logoStopCell &&
        row >= logoStartCell &&
        row < logoStopCell
      ) {
        return;
      }
      if (inPositioningPattern(row, column, sideCount)) return;

      const x = column * cellSize + offset + dx;
      const y = row * cellSize + offset + dy;
      path += `M${round(x)} ${round(y)}${shape}`;
    });
  });

  return path;
};
