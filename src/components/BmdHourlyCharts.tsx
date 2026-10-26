'use client';

import React, { useState } from 'react';
import { BmdHourlyForecastStep } from '@/lib/bmd-client';
import BmdWeatherIcon from './BmdWeatherIcon';
import { Navigation } from 'lucide-react';

interface BmdHourlyChartsProps {
  hourly: BmdHourlyForecastStep[];
  upazilaName: string;
  lang: 'en' | 'bn';
}

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

export default function BmdHourlyCharts({
  hourly,
  upazilaName,
  lang
}: BmdHourlyChartsProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Take up to 24 steps (3 days)
  const steps = hourly.slice(0, 24);

  if (!steps || steps.length === 0) {
    return null;
  }

  // Common SVG layout parameters
  const svgWidth = 1100;
  const paddingLeft = 65;
  const paddingRight = 45;
  const paddingTop = 40;
  const paddingBottom = 65;
  const plotWidth = svgWidth - paddingLeft - paddingRight;

  // Chart 1: Temperature & Icons Height
  const tempChartHeight = 260;
  const tempPlotHeight = tempChartHeight - paddingTop - paddingBottom;

  // Chart 2: Rainfall & Humidity Height
  const rainChartHeight = 220;
  const rainPlotHeight = rainChartHeight - paddingTop - paddingBottom;

  // Chart 3: Wind Speed & Direction Height
  const windChartHeight = 220;
  const windPlotHeight = windChartHeight - paddingTop - paddingBottom;

  const stepX = (i: number) => paddingLeft + (i / Math.max(1, steps.length - 1)) * plotWidth;

  // Temperature calculations
  const allTemps = steps.map(s => s.temp);
  const minTemp = Math.floor(Math.min(...allTemps, 15) - 2);
  const maxTemp = Math.ceil(Math.max(...allTemps, 35) + 3);
  const tempRange = Math.max(1, maxTemp - minTemp);
  const tempY = (val: number) => paddingTop + tempPlotHeight - ((val - minTemp) / tempRange) * tempPlotHeight;

  const tempPoints = steps.map((s, i) => ({ x: stepX(i), y: tempY(s.temp) }));
  const tempSplinePath = getSplinePath(tempPoints);
  const tempAreaPath = `${tempSplinePath} L ${tempPoints[tempPoints.length - 1].x} ${paddingTop + tempPlotHeight} L ${tempPoints[0].x} ${paddingTop + tempPlotHeight} Z`;

  // Rainfall calculations
  const allRains = steps.map(s => s.rain);
  const maxRain = Math.max(10, Math.ceil(Math.max(...allRains, 1)));
  const rainY = (val: number) => paddingTop + rainPlotHeight - (val / maxRain) * rainPlotHeight;

  // Humidity calculations (0 - 100%)
  const rhY = (val: number) => paddingTop + rainPlotHeight - (val / 100) * rainPlotHeight;
  const rhPoints = steps.map((s, i) => ({ x: stepX(i), y: rhY(s.humidity) }));
  const rhSplinePath = getSplinePath(rhPoints);

  // Wind speed calculations
  const allWinds = steps.map(s => s.windSpeed);
  const maxWind = Math.max(25, Math.ceil(Math.max(...allWinds, 10) + 5));
  const windY = (val: number) => paddingTop + windPlotHeight - (val / maxWind) * windPlotHeight;
  const windPoints = steps.map((s, i) => ({ x: stepX(i), y: windY(s.windSpeed) }));
  const windSplinePath = getSplinePath(windPoints);
  const windAreaPath = `${windSplinePath} L ${windPoints[windPoints.length - 1].x} ${paddingTop + windPlotHeight} L ${windPoints[0].x} ${paddingTop + windPlotHeight} Z`;

  const hoveredStep = hoverIndex !== null ? steps[hoverIndex] : null;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    }}>
      {/* Title Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '14px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{
            fontSize: '17px',
            fontWeight: 800,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>
              {lang === 'bn'
                ? `${upazilaName} এর আগামী ৩ দিনের বিস্তারিত পূর্বাভাস (৩-ঘণ্টা পরপর)`
                : `Next 3 Days Detailed Forecast for ${upazilaName} (3-Hourly Steps)`}
            </span>
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {lang === 'bn'
              ? 'তাপমাত্রা, আবহাওয়ার ধরন, বৃষ্টিপাত, আর্দ্রতা এবং বায়ুপ্রবাহের গতিবেগ ও দিক'
              : 'Continuous 3-hourly trajectory of temperature, condition, rainfall, humidity & wind direction'}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span>{lang === 'bn' ? 'তাপমাত্রা' : 'Temperature'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7' }}>
            <span style={{ width: '12px', height: '8px', borderRadius: '2px', backgroundColor: '#0284c7' }} />
            <span>{lang === 'bn' ? 'বৃষ্টিপাত' : 'Rainfall'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#16a34a' }} />
            <span>{lang === 'bn' ? 'আর্দ্রতা' : 'Humidity'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0d9488' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#0d9488' }} />
            <span>{lang === 'bn' ? 'বাতাস' : 'Wind'}</span>
          </div>
        </div>
      </div>

      {/* Hover Info Card */}
      {hoveredStep && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          fontWeight: 600,
          color: '#1e293b',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BmdWeatherIcon iconType={hoveredStep.conditionIcon} size={28} />
            <div>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>{hoveredStep.dateLabel}</span>
              <span style={{ color: '#64748b', marginLeft: '6px', fontWeight: 500 }}>({hoveredStep.timeRange})</span>
              <span style={{ marginLeft: '12px', color: '#2563eb' }}>{hoveredStep.conditionText}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#dc2626' }}>
              {lang === 'bn' ? 'তাপমাত্রা: ' : 'Temp: '} <strong>{hoveredStep.tempFormatted}</strong>
            </span>
            <span style={{ color: '#0284c7' }}>
              {lang === 'bn' ? 'বৃষ্টি: ' : 'Rain: '} <strong>{hoveredStep.rainFormatted}</strong>
            </span>
            <span style={{ color: '#16a34a' }}>
              {lang === 'bn' ? 'আর্দ্রতা: ' : 'RH: '} <strong>{hoveredStep.humidityFormatted}</strong>
            </span>
            <span style={{ color: '#0d9488', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {lang === 'bn' ? 'বাতাস: ' : 'Wind: '}
              <Navigation
                size={12}
                style={{
                  transform: `rotate(${hoveredStep.windDirectionDeg}deg)`,
                  transition: 'transform 0.2s ease'
                }}
              />
              <strong>{hoveredStep.windDirectionText} {hoveredStep.windSpeedFormatted}</strong>
            </span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CHART 1: Temperature (°C) with Weather Icons on points
         ------------------------------------------------------------- */}
      <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <div style={{ minWidth: `${svgWidth}px` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${tempChartHeight}`}
            style={{ width: '100%', height: `${tempChartHeight}px`, overflow: 'visible' }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="bmdTempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[minTemp, Math.round(minTemp + tempRange * 0.33), Math.round(minTemp + tempRange * 0.66), maxTemp].map((tVal, idx) => (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={tempY(tVal)}
                  x2={svgWidth - paddingRight}
                  y2={tempY(tVal)}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={tempY(tVal) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  {tVal}°
                </text>
              </g>
            ))}

            {/* Area Fill */}
            <path d={tempAreaPath} fill="url(#bmdTempGrad)" />

            {/* Spline Stroke */}
            <path d={tempSplinePath} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />

            {/* Crosshair indicator */}
            {hoverIndex !== null && (
              <line
                x1={stepX(hoverIndex)}
                y1={paddingTop - 15}
                x2={stepX(hoverIndex)}
                y2={paddingTop + tempPlotHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Data Points, Icons and X-Axis Labels */}
            {steps.map((step, i) => {
              const x = stepX(i);
              const y = tempY(step.temp);
              const isHovered = hoverIndex === i;

              return (
                <g
                  key={i}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverIndex(i)}
                >
                  {/* Invisible hit area */}
                  <rect
                    x={x - plotWidth / (steps.length * 2)}
                    y={paddingTop - 25}
                    width={plotWidth / steps.length}
                    height={tempPlotHeight + paddingBottom + 25}
                    fill="transparent"
                  />

                  {/* Temperature text above point */}
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#b91c1c"
                  >
                    {step.temp}°
                  </text>

                  {/* Point Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? '#ffffff' : '#dc2626'}
                    stroke="#dc2626"
                    strokeWidth={isHovered ? 3 : 2}
                  />

                  {/* Weather Icon pinned at top above spline */}
                  <foreignObject
                    x={x - 14}
                    y={paddingTop - 34}
                    width="28"
                    height="28"
                    style={{ pointerEvents: 'none' }}
                  >
                    <BmdWeatherIcon iconType={step.conditionIcon} size={28} />
                  </foreignObject>

                  {/* X Axis Time and Date Label */}
                  <text
                    x={x}
                    y={paddingTop + tempPlotHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#334155"
                    fontWeight="600"
                  >
                    {step.timeRange.split(' - ')[0]}
                  </text>
                  <text
                    x={x}
                    y={paddingTop + tempPlotHeight + 35}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748b"
                  >
                    {step.dateLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CHART 2: Rainfall (mm) & Humidity (%)
         ------------------------------------------------------------- */}
      <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <div style={{ minWidth: `${svgWidth}px` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${rainChartHeight}`}
            style={{ width: '100%', height: `${rainChartHeight}px`, overflow: 'visible' }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((rhVal, idx) => (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={rhY(rhVal)}
                  x2={svgWidth - paddingRight}
                  y2={rhY(rhVal)}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={svgWidth - paddingRight + 10}
                  y={rhY(rhVal) + 4}
                  textAnchor="start"
                  fontSize="10"
                  fill="#16a34a"
                  fontWeight="600"
                >
                  {rhVal}%
                </text>
              </g>
            ))}

            {/* Left Axis: Rain (mm) */}
            <text
              x={paddingLeft - 10}
              y={paddingTop + 4}
              textAnchor="end"
              fontSize="10"
              fill="#0284c7"
              fontWeight="700"
            >
              {maxRain} mm
            </text>
            <text
              x={paddingLeft - 10}
              y={paddingTop + rainPlotHeight}
              textAnchor="end"
              fontSize="10"
              fill="#0284c7"
              fontWeight="700"
            >
              0 mm
            </text>

            {/* Rainfall Bars */}
            {steps.map((step, i) => {
              const x = stepX(i);
              const barWidth = 14;
              const barH = step.rain > 0 ? ((step.rain / maxRain) * rainPlotHeight) : 2;
              const barY = paddingTop + rainPlotHeight - barH;

              return (
                <rect
                  key={i}
                  x={x - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx="3"
                  fill={step.rain > 0 ? '#38bdf8' : '#e2e8f0'}
                  opacity={step.rain > 0 ? 0.85 : 0.4}
                />
              );
            })}

            {/* Humidity Spline Line */}
            <path d={rhSplinePath} fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="4 2" />

            {/* Crosshair indicator */}
            {hoverIndex !== null && (
              <line
                x1={stepX(hoverIndex)}
                y1={paddingTop}
                x2={stepX(hoverIndex)}
                y2={paddingTop + rainPlotHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Interactive Points and Labels */}
            {steps.map((step, i) => {
              const x = stepX(i);
              const yRh = rhY(step.humidity);
              const isHovered = hoverIndex === i;

              return (
                <g key={i} onMouseEnter={() => setHoverIndex(i)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={x - plotWidth / (steps.length * 2)}
                    y={paddingTop}
                    width={plotWidth / steps.length}
                    height={rainPlotHeight + paddingBottom}
                    fill="transparent"
                  />
                  <circle
                    cx={x}
                    cy={yRh}
                    r={isHovered ? 5 : 3.5}
                    fill={isHovered ? '#ffffff' : '#16a34a'}
                    stroke="#16a34a"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />
                  {step.rain > 0 && (
                    <text
                      x={x}
                      y={rainY(step.rain) - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#0369a1"
                      fontWeight="700"
                    >
                      {step.rain}
                    </text>
                  )}
                  {/* X Axis Time */}
                  <text
                    x={x}
                    y={paddingTop + rainPlotHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#334155"
                    fontWeight="600"
                  >
                    {step.timeRange.split(' - ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CHART 3: Wind Speed (km/h) & Rotating Compass Direction
         ------------------------------------------------------------- */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: `${svgWidth}px` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${windChartHeight}`}
            style={{ width: '100%', height: `${windChartHeight}px`, overflow: 'visible' }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="bmdWindGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, Math.round(maxWind * 0.33), Math.round(maxWind * 0.66), maxWind].map((wVal, idx) => (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={windY(wVal)}
                  x2={svgWidth - paddingRight}
                  y2={windY(wVal)}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={windY(wVal) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#0d9488"
                  fontWeight="600"
                >
                  {wVal}
                </text>
              </g>
            ))}

            {/* Area & Spline */}
            <path d={windAreaPath} fill="url(#bmdWindGrad)" />
            <path d={windSplinePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />

            {/* Crosshair indicator */}
            {hoverIndex !== null && (
              <line
                x1={stepX(hoverIndex)}
                y1={paddingTop - 10}
                x2={stepX(hoverIndex)}
                y2={paddingTop + windPlotHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Points & Rotating Direction Arrows */}
            {steps.map((step, i) => {
              const x = stepX(i);
              const y = windY(step.windSpeed);
              const isHovered = hoverIndex === i;

              return (
                <g key={i} onMouseEnter={() => setHoverIndex(i)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={x - plotWidth / (steps.length * 2)}
                    y={paddingTop - 10}
                    width={plotWidth / steps.length}
                    height={windPlotHeight + paddingBottom + 10}
                    fill="transparent"
                  />

                  {/* Wind speed text */}
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#0f766e"
                  >
                    {step.windSpeed}
                  </text>

                  {/* Point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3.5}
                    fill={isHovered ? '#ffffff' : '#0d9488'}
                    stroke="#0d9488"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />

                  {/* Rotating Direction Pointer pinned below axis */}
                  <g transform={`translate(${x}, ${paddingTop + windPlotHeight + 20})`}>
                    <g transform={`rotate(${step.windDirectionDeg})`}>
                      <path
                        d="M 0 -7 L 4 5 L 0 3 L -4 5 Z"
                        fill="#0f766e"
                      />
                    </g>
                    <text
                      x="0"
                      y="16"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#334155"
                    >
                      {step.windDirectionText}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
