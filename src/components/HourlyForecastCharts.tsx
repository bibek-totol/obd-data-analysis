'use client';

import React, { useState } from 'react';
import { HourlyWeatherStep } from '@/lib/nlas-client';

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

export default function HourlyForecastCharts({
  hourly,
  upazilaName
}: HourlyForecastChartsProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Take the 16 steps representing tomorrow & day after tomorrow (or available steps)
  // Filtering for steps that represent the 48-hour 3-hourly forecast
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
              // Parse date and time from timeLabel
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

            {/* Temperature Spline Area Gradient */}
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

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

            {/* Data Points */}
            {tempPoints.map((pt) => {
              const isHovered = hoverIndex === pt.idx;
              return (
                <g
                  key={pt.idx}
                  onMouseEnter={() => setHoverIndex(pt.idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ transition: 'r 0.15s ease' }}
                  />
                  {/* Point value tag if hovered */}
                  {isHovered && (
                    <g>
                      <rect
                        x={pt.x - 30}
                        y={pt.y - 28}
                        width="60"
                        height="20"
                        rx="4"
                        fill="#0f172a"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#ffffff"
                      >
                        {pt.step.temp_avg}°C
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
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
            <defs>
              <linearGradient id="rhGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

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

            {/* RH Nodes & Exact percentage labels matching screenshot 3! */}
            {rhPoints.map((pt) => {
              return (
                <g key={pt.idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
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
                </g>
              );
            })}
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
            <defs>
              <linearGradient id="gustGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

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
              return (
                <g key={pt.idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill="#14b8a6"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
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
                </g>
              );
            })}
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
