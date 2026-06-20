import type { Config, Data, Layout } from 'plotly.js';
import Plotly from 'plotly.js-dist-min';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n';

interface CoordViewerProps {
  x: number;
  y: number;
  z: number;
  isTooClose: boolean;
}

// NMSの銀河サイズ: X/Z ±2047, Y ±126
// Y軸は幅が小さいので表示上スケールを掛ける
const X_MAX = 2047;
const Z_MAX = 2047;
const Y_MAX = 126;
const Y_SCALE = X_MAX / Y_MAX / 4;

// 方位ラベルの座標 (Plotly軸: px=NMSx, py=NMSz, pz=NMSy*scale)
// Z-方向 = 北, Z+方向 = 南, X-方向 = 西, X+方向 = 東
const COMPASS_OFFSET = X_MAX * 1.15;
const compassPoints = [
  { px: 0, py: -COMPASS_OFFSET, pz: 0, label: 'N' },
  { px: 0, py: COMPASS_OFFSET, pz: 0, label: 'S' },
  { px: -COMPASS_OFFSET, py: 0, pz: 0, label: 'W' },
  { px: COMPASS_OFFSET, py: 0, pz: 0, label: 'E' },
];

function oklch(l: number, c: number, h: number): string {
  // L: 0-100, C: 0-0.4くらい, H: degree

  const L = l / 100;
  const H = (h * Math.PI) / 180;

  // OKLCH → OKLab
  const a = c * Math.cos(H);
  const b = c * Math.sin(H);

  // OKLab → LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  // LMS → linear RGB
  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;

  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;

  let b2 = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // linear → sRGB
  const toSrgb = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

  r = toSrgb(r);
  g = toSrgb(g);
  b2 = toSrgb(b2);

  const clamp = (x: number) => Math.min(255, Math.max(0, Math.round(x * 255)));

  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b2)})`;
}

export function CoordViewer({ x, y, z, isTooClose }: CoordViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!ref.current) return;

    const isDark = document.documentElement.classList.contains('dark');
    const muteFg = isDark ? oklch(70.5, 0.015, 286.067) : oklch(44.2, 0.017, 285.786);
    const muteBg = oklch(55.2, 0.016, 285.938);
    const blue = isTooClose ? oklch(70.4, 0.191, 22.216) : oklch(70.7, 0.165, 254.624);
    const orange = oklch(75, 0.183, 55.934);
    const paperBg = 'rgba(0,0,0,0)';
    const plotBg = 'rgba(0,0,0,0)';

    // 銀河の外縁（XZ平面の円）を描く
    const circleN = 64;
    const circleX = Array.from({ length: circleN + 1 }, (_, i) => X_MAX * Math.cos((i / circleN) * 2 * Math.PI));
    const circleZ = Array.from({ length: circleN + 1 }, (_, i) => Z_MAX * Math.sin((i / circleN) * 2 * Math.PI));
    const circleY = Array.from({ length: circleN + 1 }, () => 0);

    const data: Data[] = [
      // 銀河外縁リング
      {
        type: 'scatter3d',
        x: circleX,
        y: circleZ,
        z: circleY,
        mode: 'lines',
        line: { color: muteFg, width: 1 },
        hoverinfo: 'skip',
        showlegend: false,
      },

      // X軸（西東）
      {
        type: 'scatter3d',
        x: [-X_MAX, X_MAX],
        y: [0, 0],
        z: [0, 0],
        mode: 'lines',
        line: { color: muteBg, width: 1, dash: 'dot' },
        hoverinfo: 'skip',
        showlegend: false,
      },

      // Z軸（南北）
      {
        type: 'scatter3d',
        x: [0, 0],
        y: [-Z_MAX, Z_MAX],
        z: [0, 0],
        mode: 'lines',
        line: { color: muteBg, width: 1, dash: 'dot' },
        hoverinfo: 'skip',
        showlegend: false,
      },

      // 方位ラベル (N/S/W/E)
      {
        type: 'scatter3d',
        x: compassPoints.map((p) => p.px),
        y: compassPoints.map((p) => p.py),
        z: compassPoints.map((p) => p.pz),
        mode: 'text',
        text: compassPoints.map((p) => p.label),
        textfont: { size: 11, color: muteFg },
        hoverinfo: 'skip',
        showlegend: false,
      },

      // 銀河中心
      {
        type: 'scatter3d',
        x: [0],
        y: [0],
        z: [0],
        mode: 'markers',
        marker: { size: 6, color: orange, symbol: 'cross' },
        hoverinfo: 'skip',
        showlegend: false,
      },

      {
        type: 'scatter3d',
        x: [0, x],
        y: [0, z],
        z: [0, y * Y_SCALE],
        mode: 'lines',
        line: {
          color: blue,
          width: 1,
          dash: 'solid',
        },
        hoverinfo: 'skip',
        showlegend: false,
      },

      // 現在地
      {
        type: 'scatter3d',
        x: [x],
        y: [z],
        z: [y * Y_SCALE],
        mode: 'markers',
        name: t('viewer.currentLocation'),
        marker: {
          size: 7,
          color: blue,
          symbol: 'diamond',
          line: { color: blue, width: 1 },
        },
        hoverinfo: 'skip',
        showlegend: false,
      },
    ];

    const axisBase = {
      showticklabels: false,
      showgrid: false,
      zeroline: false,
      showline: false,
      showspikes: false,
      showbackground: false,
    };

    const layout: Partial<Layout> = {
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      margin: { l: 0, r: 0, t: 0, b: 0 },
      showlegend: false,
      scene: {
        xaxis: { ...axisBase, range: [-X_MAX * 1.2, X_MAX * 1.2], title: { text: '' } },
        yaxis: { ...axisBase, range: [-Z_MAX * 1.2, Z_MAX * 1.2], title: { text: '' } },
        zaxis: { ...axisBase, range: [-X_MAX * 0.3, X_MAX * 0.3], title: { text: '' } },
        bgcolor: plotBg,
        aspectmode: 'manual',
        aspectratio: { x: 1, y: 1, z: 0.25 },
        camera: {
          eye: { x: 0.5, y: 0.85, z: -0.5 },
          up: { x: 0, y: 0, z: 0 },
        },
        dragmode: 'orbit',
      } as Layout['scene'],
      font: { family: 'monospace', color: muteFg },
    };

    const config: Partial<Config> = {
      displayModeBar: false,
      responsive: true,
    };

    Plotly.newPlot(ref.current, data, layout, config);

    const el = ref.current;
    return () => {
      if (el) Plotly.purge(el);
    };
  }, [x, y, z, isTooClose, t]);

  const dist = Math.round(Math.sqrt(x * x + y * y + z * z) * 400);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('viewer.title')}</CardTitle>
        <CardDescription className={`font-mono text-xs ${isTooClose ? 'text-destructive' : 'text-muted-foreground'}`}>
          {t('viewer.distance', { dist: dist.toLocaleString() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 pb-3">
        <div ref={ref} className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
