'use client';

import React, { useState } from 'react';
import { HourlyWeatherStep, parseDateFromStepTime, parseHourFromStepTime, MONTHS_FULL } from '@/lib/nlas-client';

interface HourlyForecastChartsProps {
  hourly: HourlyWeatherStep[];
  upazilaName: string;
}

// Generate smooth cubic bezier spline SVG path from coordinates
function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function formatStepDateTime(step: HourlyWeatherStep) {
  try {
    if (step.step_start) {
      const parsed = parseDateFromStepTime(step.step_start);
      const day = parsed.day;
      const month = MONTHS_FULL[parsed.month] || MONTHS_FULL[new Date().getMonth()];
      const startH = String(parseHourFromStepTime(step.step_start)).padStart(2, '0') + ':00';
      let endH = '00:00';
      if (step.step_end) {
        endH = String(parseHourFromStepTime(step.step_end)).padStart(2, '0') + ':00';
      }

      return {
        dateFormatted: `Date: ${day} ${month}`,
        timeRange: `${startH} - ${endH}`
      };
    }

    // Fallback: parse from timeLabel if step_start is unavailable or non-standard
    if (step.timeLabel) {
      const parts = step.timeLabel.split(' ');
      if (parts.length >= 2) {
        return {
          dateFormatted: `Date: ${parts[0]} ${parts[1]}`,
          timeRange: parts.slice(2).join(' ') || '00:00 - 03:00'
        };
      }
    }
  } catch {
    // ignore error and proceed to dynamic fallback
  }

  // Fully dynamic fallback derived from current date - never hardcoded
  const fallbackNow = new Date();
  return {
    dateFormatted: `Date: ${fallbackNow.getDate()} ${MONTHS_FULL[fallbackNow.getMonth()]}`,
    timeRange: '00:00 - 03:00'
  };
}

export default function HourlyForecastCharts({
  hourly,
  upazilaName
}: HourlyForecastChartsProps) {
  // Independent hover indices for each chart
  const [hoverTempIndex, setHoverTempIndex] = useState<number | null>(null);
  const [hoverRhIndex, setHoverRhIndex] = useState<number | null>(null);
  const [hoverGustIndex, setHoverGustIndex] = useState<number | null>(null);

  // Take the 16 steps representing tomorrow & day after tomorrow
  const steps = hourly.slice(0, 16);

  if (!steps || steps.length === 0) {
    return null;
  }

  // Chart Dimensions
  const svgWidth = 1100;
  const svgHeight = 240;
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 60;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Temperature Chart Scale
  const temps = steps.map(s => s.temp_avg);
  const minTemp = Math.floor(Math.min(...temps, 20) - 2);
  const maxTemp = Math.ceil(Math.max(...temps, 35) + 2);
  const tempRange = maxTemp - minTemp || 1;

  const tempPoints = steps.map((s, idx) => {
    const x = paddingLeft + (idx / (steps.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((s.temp_avg - minTemp) / tempRange) * plotHeight;
    return { x, y, step: s, idx };
  });

  const tempSpline = getSplinePath(tempPoints);

  // RH & Rainfall Chart Scale
  const rhValues = steps.map(s => s.rh);
  const minRh = Math.floor(Math.min(...rhValues, 20) - 5);
  const maxRh = Math.ceil(Math.max(...rhValues, 80) + 5);
  const rhRange = maxRh - minRh || 1;

  const rhPoints = steps.map((s, idx) => {
    const x = paddingLeft + (idx / (steps.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((s.rh - minRh) / rhRange) * plotHeight;
    return { x, y, step: s, idx };
  });

  const rhSpline = getSplinePath(rhPoints);

  // Windgust Scale
  const gusts = steps.map(s => s.windgust);
  const minGust = Math.max(0, Math.floor(Math.min(...gusts, 5) - 2));
  const maxGust = Math.ceil(Math.max(...gusts, 25) + 3);
  const gustRange = maxGust - minGust || 1;

  const gustPoints = steps.map((s, idx) => {
    const x = paddingLeft + (idx / (steps.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((s.windgust - minGust) / gustRange) * plotHeight;
    return { x, y, step: s, idx };
  });

  const gustSpline = getSplinePath(gustPoints);

  // Helper to compute modal/tooltip box coordinates ensuring it never clips
  const getTooltipCoords = (x: number, y: number, width: number, height: number) => {
    let boxX = x - width / 2;
    if (boxX < paddingLeft) boxX = paddingLeft;
    if (boxX + width > svgWidth - paddingRight) boxX = svgWidth - paddingRight - width;

    let boxY = y - height - 12;
    if (boxY < paddingTop) boxY = y + 14;

    return { boxX, boxY };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
      
      {/* =========================================================================
          CHART 1: Three Hourly Weather Forecast (Temperature & Cloud Condition)
          ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Title */}
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 600,
          color: '#334155',
          marginBottom: '16px'
        }}>
          Three Hourly Weather Forecast of {upazilaName} Upazila
        </div>

        {/* SVG Chart Container */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '850px', height: 'auto', display: 'block' }}
          >
            {/* Common Definitions */}
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>

              {/* Highcharts-like Box Shadow Filter */}
              <filter id="modalShadow" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="1" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingTop + pct * plotHeight;
              const tVal = Math.round(maxTemp - pct * tempRange);
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="sans-serif"
                  >
                    {tVal}°C
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines & X-Axis Labels */}
            {steps.map((s, idx) => {
              const x = paddingLeft + (idx / (steps.length - 1)) * plotWidth;
              const parts = s.timeLabel.split(' ');
              const dateText = parts.slice(0, 2).join(' ');
              const timeText = parts.slice(2).join(' ');

              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + plotHeight}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={paddingTop + plotHeight + 18}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#64748b"
                    fontFamily="'Fira Code', monospace"
                  >
                    {dateText}
                  </text>
                  <text
                    x={x}
                    y={paddingTop + plotHeight + 30}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#94a3b8"
                    fontFamily="'Fira Code', monospace"
                  >
                    {timeText}
                  </text>
                </g>
              );
            })}

            {/* Y-Axis Title */}
            <text
              transform={`rotate(-90)`}
              x={-(paddingTop + plotHeight / 2)}
              y="18"
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
              fontWeight="600"
            >
              Temperature & Cloud Condition
            </text>

            {/* Temperature Area Fill */}
            <path
              d={`${tempSpline} L ${svgWidth - paddingRight} ${paddingTop + plotHeight} L ${paddingLeft} ${paddingTop + plotHeight} Z`}
              fill="url(#tempGradient)"
            />

            {/* Temperature Line */}
            <path
              d={tempSpline}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Data Points & Halo on Hover */}
            {tempPoints.map((pt) => {
              const isHovered = hoverTempIndex === pt.idx;
              return (
                <g
                  key={pt.idx}
                  onMouseEnter={() => setHoverTempIndex(pt.idx)}
                  onMouseLeave={() => setHoverTempIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer animated halo ring when hovered */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={9}
                      fill="rgba(56, 189, 248, 0.35)"
                    />
                  )}

                  {/* Core data node */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 4}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Wide invisible hit area for easy mouse tracking */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={18}
                    fill="transparent"
                  />
                </g>
              );
            })}

            {/* Exact Modal / Tooltip Box matching Screenshot 1 */}
            {hoverTempIndex !== null && (() => {
              const pt = tempPoints[hoverTempIndex];
              if (!pt) return null;
              const dt = formatStepDateTime(pt.step);
              const boxW = 158;
              const boxH = 68;
              const { boxX, boxY } = getTooltipCoords(pt.x, pt.y, boxW, boxH);

              return (
                <g style={{ pointerEvents: 'none' }}>
                  {/* Modal box background */}
                  <rect
                    x={boxX}
                    y={boxY}
                    width={boxW}
                    height={boxH}
                    rx={3}
                    fill="#cdcdcd"
                    stroke="#666666"
                    strokeWidth="1"
                    filter="url(#modalShadow)"
                  />

                  {/* Line 1: Date */}
                  <text
                    x={boxX + 9}
                    y={boxY + 16}
                    fontSize="10"
                    fontWeight="700"
                    fill="#111827"
                    fontFamily="sans-serif"
                  >
                    {dt.dateFormatted}
                  </text>

                  {/* Line 2: Time range */}
                  <text
                    x={boxX + 9}
                    y={boxY + 30}
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    {dt.timeRange}
                  </text>

                  {/* Line 3: Temperature */}
                  <text
                    x={boxX + 9}
                    y={boxY + 45}
                    fontSize="9.5"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    Temperature: <tspan fontWeight="700">{pt.step.temp_avg} °C</tspan>
                  </text>

                  {/* Line 4: Cloud Condition */}
                  <text
                    x={boxX + 9}
                    y={boxY + 60}
                    fontSize="9.5"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    Cloud Condition: <tspan fontWeight="700">{pt.step.cloud_name}</tspan>
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
          fontSize: '12px',
          color: '#475569',
          fontWeight: 600
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#38bdf8',
            display: 'inline-block'
          }} />
          <span>Temperature & Cloud Condition</span>
        </div>
      </div>

      {/* =========================================================================
          CHART 2: Rainfall & Relative Humidity
          ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* SVG Chart */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '850px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="rhGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              <filter id="modalShadowRh" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="1" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingTop + pct * plotHeight;
              const rhVal = Math.round(maxRh - pct * rhRange);
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="sans-serif"
                  >
                    {rhVal}%
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines & Labels */}
            {steps.map((s, idx) => {
              const x = paddingLeft + (idx / (steps.length - 1)) * plotWidth;
              const parts = s.timeLabel.split(' ');
              const dateText = parts.slice(0, 2).join(' ');
              const timeText = parts.slice(2).join(' ');

              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + plotHeight}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={paddingTop + plotHeight + 18}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#64748b"
                    fontFamily="'Fira Code', monospace"
                  >
                    {dateText}
                  </text>
                  <text
                    x={x}
                    y={paddingTop + plotHeight + 30}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#94a3b8"
                    fontFamily="'Fira Code', monospace"
                  >
                    {timeText}
                  </text>
                </g>
              );
            })}

            {/* Y-Axis Title */}
            <text
              transform={`rotate(-90)`}
              x={-(paddingTop + plotHeight / 2)}
              y="18"
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
              fontWeight="600"
            >
              Rainfall & Relative Humidity
            </text>

            {/* Relative Humidity Spline Area */}
            <path
              d={`${rhSpline} L ${svgWidth - paddingRight} ${paddingTop + plotHeight} L ${paddingLeft} ${paddingTop + plotHeight} Z`}
              fill="url(#rhGradient)"
            />

            {/* RH Line */}
            <path
              d={rhSpline}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* RH Nodes & Exact percentage labels matching screenshot 3 */}
            {rhPoints.map((pt) => {
              const isHovered = hoverRhIndex === pt.idx;
              return (
                <g
                  key={pt.idx}
                  onMouseEnter={() => setHoverRhIndex(pt.idx)}
                  onMouseLeave={() => setHoverRhIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Halo on hover */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={9}
                      fill="rgba(16, 185, 129, 0.35)"
                    />
                  )}

                  {/* Node */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 4}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Percentage label directly above node */}
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0f172a"
                    fontFamily="'Fira Code', monospace"
                  >
                    {pt.step.rh}%
                  </text>

                  {/* Rainfall indicator point at baseline */}
                  <circle
                    cx={pt.x}
                    cy={paddingTop + plotHeight - 12}
                    r={3}
                    fill="#6366f1"
                  />
                  <text
                    x={pt.x}
                    y={paddingTop + plotHeight - 18}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill="#475569"
                    fontFamily="'Fira Code', monospace"
                  >
                    {pt.step.rf} mm
                  </text>

                  {/* Wide hit area */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={18}
                    fill="transparent"
                  />
                </g>
              );
            })}

            {/* Exact Modal / Tooltip Box matching Screenshot 3 */}
            {hoverRhIndex !== null && (() => {
              const pt = rhPoints[hoverRhIndex];
              if (!pt) return null;
              const dt = formatStepDateTime(pt.step);
              const boxW = 158;
              const boxH = 68;
              const { boxX, boxY } = getTooltipCoords(pt.x, pt.y, boxW, boxH);

              return (
                <g style={{ pointerEvents: 'none' }}>
                  {/* Modal box background */}
                  <rect
                    x={boxX}
                    y={boxY}
                    width={boxW}
                    height={boxH}
                    rx={3}
                    fill="#cdcdcd"
                    stroke="#666666"
                    strokeWidth="1"
                    filter="url(#modalShadowRh)"
                  />

                  {/* Line 1: Date */}
                  <text
                    x={boxX + 9}
                    y={boxY + 16}
                    fontSize="10"
                    fontWeight="700"
                    fill="#111827"
                    fontFamily="sans-serif"
                  >
                    {dt.dateFormatted}
                  </text>

                  {/* Line 2: Time range */}
                  <text
                    x={boxX + 9}
                    y={boxY + 30}
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    {dt.timeRange}
                  </text>

                  {/* Line 3: Rainfall */}
                  <text
                    x={boxX + 9}
                    y={boxY + 45}
                    fontSize="9.5"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    Rainfall: <tspan fontWeight="700">{pt.step.rf} mm</tspan>
                  </text>

                  {/* Line 4: Relative Humidity */}
                  <text
                    x={boxX + 9}
                    y={boxY + 60}
                    fontSize="9.5"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    Relative Humidity: <tspan fontWeight="700">{pt.step.rh} %</tspan>
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          marginTop: '12px',
          fontSize: '12px',
          color: '#475569',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              display: 'inline-block'
            }} />
            <span>Rainfall</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block'
            }} />
            <span>Relative Humidity</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CHART 3: Windgust & Wind Direction
          ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* SVG Chart */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '850px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="gustGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
              </linearGradient>

              <filter id="modalShadowGust" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="1" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingTop + pct * plotHeight;
              const gVal = Math.round(maxGust - pct * gustRange);
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="sans-serif"
                  >
                    {gVal} km/h
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines & Labels */}
            {steps.map((s, idx) => {
              const x = paddingLeft + (idx / (steps.length - 1)) * plotWidth;
              const parts = s.timeLabel.split(' ');
              const dateText = parts.slice(0, 2).join(' ');
              const timeText = parts.slice(2).join(' ');

              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + plotHeight}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={paddingTop + plotHeight + 18}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#64748b"
                    fontFamily="'Fira Code', monospace"
                  >
                    {dateText}
                  </text>
                  <text
                    x={x}
                    y={paddingTop + plotHeight + 30}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#94a3b8"
                    fontFamily="'Fira Code', monospace"
                  >
                    {timeText}
                  </text>
                </g>
              );
            })}

            {/* Y-Axis Title */}
            <text
              transform={`rotate(-90)`}
              x={-(paddingTop + plotHeight / 2)}
              y="18"
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
              fontWeight="600"
            >
              Windgust & Wind Direction
            </text>

            {/* Windgust Area Gradient */}
            <path
              d={`${gustSpline} L ${svgWidth - paddingRight} ${paddingTop + plotHeight} L ${paddingLeft} ${paddingTop + plotHeight} Z`}
              fill="url(#gustGradient)"
            />

            {/* Windgust Line */}
            <path
              d={gustSpline}
              fill="none"
              stroke="#14b8a6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Windgust Nodes & Wind Direction Indicators */}
            {gustPoints.map((pt) => {
              const isHovered = hoverGustIndex === pt.idx;
              return (
                <g
                  key={pt.idx}
                  onMouseEnter={() => setHoverGustIndex(pt.idx)}
                  onMouseLeave={() => setHoverGustIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Halo on hover */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={9}
                      fill="rgba(20, 184, 166, 0.35)"
                    />
                  )}

                  {/* Node */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 4}
                    fill="#14b8a6"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Direction label */}
                  <text
                    x={pt.x}
                    y={pt.y - 9}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#0f766e"
                  >
                    {pt.step.winddir_name}
                  </text>

                  {/* Wide hit area */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={18}
                    fill="transparent"
                  />
                </g>
              );
            })}

            {/* Exact Modal / Tooltip Box matching Screenshot 2 */}
            {hoverGustIndex !== null && (() => {
              const pt = gustPoints[hoverGustIndex];
              if (!pt) return null;
              const dt = formatStepDateTime(pt.step);
              const boxW = 158;
              const boxH = 54;
              const { boxX, boxY } = getTooltipCoords(pt.x, pt.y, boxW, boxH);

              return (
                <g style={{ pointerEvents: 'none' }}>
                  {/* Modal box background */}
                  <rect
                    x={boxX}
                    y={boxY}
                    width={boxW}
                    height={boxH}
                    rx={3}
                    fill="#cdcdcd"
                    stroke="#666666"
                    strokeWidth="1"
                    filter="url(#modalShadowGust)"
                  />

                  {/* Line 1: Date */}
                  <text
                    x={boxX + 9}
                    y={boxY + 16}
                    fontSize="10"
                    fontWeight="700"
                    fill="#111827"
                    fontFamily="sans-serif"
                  >
                    {dt.dateFormatted}
                  </text>

                  {/* Line 2: Time range */}
                  <text
                    x={boxX + 9}
                    y={boxY + 30}
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    {dt.timeRange}
                  </text>

                  {/* Line 3: Windgust */}
                  <text
                    x={boxX + 9}
                    y={boxY + 45}
                    fontSize="9.5"
                    fill="#1f2937"
                    fontFamily="sans-serif"
                  >
                    Windgust: <tspan fontWeight="700">{pt.step.windgust} km/h {pt.step.winddir_name}</tspan>
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
          fontSize: '12px',
          color: '#475569',
          fontWeight: 600
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#14b8a6',
            display: 'inline-block'
          }} />
          <span>Windgust & Wind Direction</span>
        </div>
      </div>

    </div>
  );
}
