import type { Config, Data, Layout } from 'plotly.js';
import Plotly from 'plotly.js-dist-min';
import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

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

export function CoordViewer({ x, y, z, isTooClose }: CoordViewerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const dist = Math.round(Math.sqrt(x * x + y * y + z * z) * 400);
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const gridColor = isDark ? '#3f3f46' : '#d4d4d8';
    const paperBg = 'rgba(0,0,0,0)';
    const plotBg = 'rgba(0,0,0,0)';
    const accentColor = isTooClose ? '#ef4444' : '#818cf8';

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
        line: { color: isDark ? '#52525b' : '#a1a1aa', width: 1 },
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
        line: { color: isDark ? '#3f3f46' : '#d4d4d8', width: 1, dash: 'dot' },
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
        line: { color: isDark ? '#3f3f46' : '#d4d4d8', width: 1, dash: 'dot' },
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
        textfont: { size: 11, color: textColor },
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
        marker: { size: 6, color: '#f97316', symbol: 'cross' },
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
          color: accentColor,
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
        name: '現在地',
        marker: {
          size: 7,
          color: accentColor,
          symbol: 'diamond',
          line: { color: isDark ? '#c7d2fe' : '#4338ca', width: 1 },
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
      font: { family: 'monospace', color: textColor },
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
  }, [x, y, z, isTooClose]);

  const dist = Math.round(Math.sqrt(x * x + y * y + z * z) * 400);

  return (
    <Card>
      <CardContent className="space-y-3 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">3Dビューア</p>
          <span className={`font-mono text-xs ${isTooClose ? 'text-destructive' : 'text-muted-foreground'}`}>
            中心まで 約 {dist.toLocaleString()} 光年
          </span>
        </div>
        <div ref={ref} className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
