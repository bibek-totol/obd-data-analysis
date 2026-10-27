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
  const paddingBottom = 80;
  const plotWidth = svgWidth - paddingLeft - paddingRight;

  // Chart 1: Temperature & Icons Height
  const tempChartHeight = 285;
  const tempPlotHeight = tempChartHeight - paddingTop - paddingBottom;

  // Chart 2: Rainfall & Humidity Height
  const rainChartHeight = 220;
  const rainPlotHeight = rainChartHeight - paddingTop - paddingBottom;

  // Chart 3: Wind Speed & Direction Height
  const windChartHeight = 220;
  const windPlotHeight = windChartHeight - paddingTop - paddingBottom;

  // Exact step X calculation and contiguous column boundaries (eliminates dead gaps between columns)
  const colWidth = plotWidth / Math.max(1, steps.length - 1);
  const stepX = (i: number) => paddingLeft + (i / Math.max(1, steps.length - 1)) * plotWidth;

  const getHitBounds = (i: number) => {
    const x = stepX(i);
    const left = i === 0 ? 0 : x - colWidth / 2;
    const right = i === steps.length - 1 ? svgWidth : x + colWidth / 2;
    return { x: left, width: right - left };
  };

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
        marginBottom: '16px'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1' }}>
            <span style={{ width: '12px', height: '8px', borderRadius: '2px', backgroundColor: '#0369a1' }} />
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

      {/* -------------------------------------------------------------
          FIXED-HEIGHT HOVER INFO BAR:
          Permanently rendered with a fixed height (54px) so that hovering
          NEVER causes vertical layout shifts, jittering or chart shaking.
         ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '10px 18px',
        marginBottom: '16px',
        minHeight: '54px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        fontWeight: 600,
        color: '#1e293b',
        boxSizing: 'border-box'
      }}>
        {hoveredStep ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BmdWeatherIcon iconType={hoveredStep.conditionIcon} size={28} />
              <div>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{hoveredStep.dateLabel}</span>
                <span style={{ color: '#64748b', marginLeft: '6px', fontWeight: 600 }}>({hoveredStep.timeRange})</span>
                <span style={{ marginLeft: '12px', color: '#0369a1', fontWeight: 700 }}>{hoveredStep.conditionText}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <span style={{ color: '#dc2626' }}>
                {lang === 'bn' ? 'তাপমাত্রা: ' : 'Temp: '} <strong>{hoveredStep.tempFormatted}</strong>
              </span>
              <span style={{ color: '#0369a1' }}>
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
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '12.5px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0369a1' }} />
            <span>
              {lang === 'bn'
                ? 'যেকোনো ৩-ঘণ্টার সময়ের ওপর মাউস নিন — বিস্তারিত তাপমাত্রা, বৃষ্টিপাত, আর্দ্রতা ও বাতাসের তথ্য দেখতে।'
                : 'Hover over any 3-hourly time step below to inspect detailed temperature, rain, humidity and wind.'}
            </span>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          SYNCHRONIZED UNIFIED CHARTS SCROLLER:
          All 3 charts are nested in ONE single scroll container.
          - Eliminates 3 separate stacked horizontal scrollbars.
          - Eliminates hover loss when moving mouse between charts.
          - Seamlessly aligns timestamps across Temperature, Rain, RH & Wind.
         ------------------------------------------------------------- */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <div style={{ minWidth: `${svgWidth}px`, width: '100%' }}>

          {/* =========================================================
              CHART 1: Temperature (°C) with Weather Icons on points
             ========================================================= */}
          <div style={{ position: 'relative' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${tempChartHeight}`}
              style={{ width: '100%', height: `${tempChartHeight}px`, display: 'block', overflow: 'hidden' }}
            >
              <defs>
                <linearGradient id="bmdTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[minTemp, Math.round(minTemp + tempRange * 0.33), Math.round(minTemp + tempRange * 0.66), maxTemp].map((tVal, idx) => (
                <g key={idx} style={{ pointerEvents: 'none' }}>
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
              <path d={tempAreaPath} fill="url(#bmdTempGrad)" style={{ pointerEvents: 'none' }} />

              {/* Spline Stroke */}
              <path d={tempSplinePath} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" style={{ pointerEvents: 'none' }} />

              {/* Crosshair indicator */}
              {hoverIndex !== null && (
                <line
                  x1={stepX(hoverIndex)}
                  y1={paddingTop - 15}
                  x2={stepX(hoverIndex)}
                  y2={paddingTop + tempPlotHeight}
                  stroke="#0369a1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Data Points, Icons and Seamless Hit Columns */}
              {steps.map((step, i) => {
                const x = stepX(i);
                const y = tempY(step.temp);
                const isHovered = hoverIndex === i;
                const { x: hitX, width: hitW } = getHitBounds(i);

                return (
                  <g key={i} onMouseEnter={() => setHoverIndex(i)} style={{ cursor: 'pointer' }}>
                    {/* Visual: Temperature text above point */}
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#b91c1c"
                      style={{ pointerEvents: 'none' }}
                    >
                      {step.temp}°
                    </text>

                    {/* Visual: Point Circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#ffffff' : '#dc2626'}
                      stroke="#dc2626"
                      strokeWidth={isHovered ? 3 : 2}
                      style={{ pointerEvents: 'none' }}
                    />

                    {/* Visual: Weather Icon pinned at top above spline */}
                    <foreignObject
                      x={x - 14}
                      y={paddingTop - 34}
                      width="28"
                      height="28"
                      style={{ pointerEvents: 'none' }}
                    >
                      <BmdWeatherIcon iconType={step.conditionIcon} size={28} />
                    </foreignObject>

                    {/* Visual: X Axis Time and Date Label (Angled at -45° to match Highcharts in usf.bmd.gov.bd) */}
                    <g
                      transform={`rotate(-45 ${x} ${paddingTop + tempPlotHeight + 15})`}
                      style={{ pointerEvents: 'none' }}
                    >
                      <text
                        x={x}
                        y={paddingTop + tempPlotHeight + 15}
                        textAnchor="end"
                        fontSize="9.5"
                        fill="#0f172a"
                        fontWeight="700"
                      >
                        {step.dateLabel}
                      </text>
                      <text
                        x={x}
                        y={paddingTop + tempPlotHeight + 27}
                        textAnchor="end"
                        fontSize="8.5"
                        fill="#475569"
                        fontWeight="600"
                      >
                        {step.timeRange}
                      </text>
                    </g>

                    {/* Seamless Full-Height Hit Column (Ensures 0 gap between steps & no flickering) */}
                    <rect
                      x={hitX}
                      y={0}
                      width={hitW}
                      height={tempChartHeight}
                      fill="transparent"
                      style={{ pointerEvents: 'all' }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Subtle Horizontal Divider */}
          <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '10px 0 16px' }} />

          {/* =========================================================
              CHART 2: Rainfall (mm) & Humidity (%)
             ========================================================= */}
          <div style={{ position: 'relative' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${rainChartHeight}`}
              style={{ width: '100%', height: `${rainChartHeight}px`, display: 'block', overflow: 'hidden' }}
            >
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((rhVal, idx) => (
                <g key={idx} style={{ pointerEvents: 'none' }}>
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
                fill="#0369a1"
                fontWeight="700"
                style={{ pointerEvents: 'none' }}
              >
                {maxRain} mm
              </text>
              <text
                x={paddingLeft - 10}
                y={paddingTop + rainPlotHeight}
                textAnchor="end"
                fontSize="10"
                fill="#0369a1"
                fontWeight="700"
                style={{ pointerEvents: 'none' }}
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
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })}

              {/* Humidity Spline Line */}
              <path d={rhSplinePath} fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="4 2" style={{ pointerEvents: 'none' }} />

              {/* Crosshair indicator */}
              {hoverIndex !== null && (
                <line
                  x1={stepX(hoverIndex)}
                  y1={paddingTop}
                  x2={stepX(hoverIndex)}
                  y2={paddingTop + rainPlotHeight}
                  stroke="#0369a1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Interactive Points and Labels */}
              {steps.map((step, i) => {
                const x = stepX(i);
                const yRh = rhY(step.humidity);
                const isHovered = hoverIndex === i;
                const { x: hitX, width: hitW } = getHitBounds(i);

                return (
                  <g key={i} onMouseEnter={() => setHoverIndex(i)} style={{ cursor: 'pointer' }}>
                    <circle
                      cx={x}
                      cy={yRh}
                      r={isHovered ? 5 : 3.5}
                      fill={isHovered ? '#ffffff' : '#16a34a'}
                      stroke="#16a34a"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      style={{ pointerEvents: 'none' }}
                    />
                    {step.rain > 0 && (
                      <text
                        x={x}
                        y={rainY(step.rain) - 6}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#0369a1"
                        fontWeight="700"
                        style={{ pointerEvents: 'none' }}
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
                      style={{ pointerEvents: 'none' }}
                    >
                      {step.timeRange.split(' - ')[0]}
                    </text>

                    {/* Seamless Full-Height Hit Column */}
                    <rect
                      x={hitX}
                      y={0}
                      width={hitW}
                      height={rainChartHeight}
                      fill="transparent"
                      style={{ pointerEvents: 'all' }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Subtle Horizontal Divider */}
          <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '10px 0 16px' }} />

          {/* =========================================================
              CHART 3: Wind Speed (km/h) & Rotating Compass Direction
             ========================================================= */}
          <div style={{ position: 'relative' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${windChartHeight}`}
              style={{ width: '100%', height: `${windChartHeight}px`, display: 'block', overflow: 'hidden' }}
            >
              <defs>
                <linearGradient id="bmdWindGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, Math.round(maxWind * 0.33), Math.round(maxWind * 0.66), maxWind].map((wVal, idx) => (
                <g key={idx} style={{ pointerEvents: 'none' }}>
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
              <path d={windAreaPath} fill="url(#bmdWindGrad)" style={{ pointerEvents: 'none' }} />
              <path d={windSplinePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" style={{ pointerEvents: 'none' }} />

              {/* Crosshair indicator */}
              {hoverIndex !== null && (
                <line
                  x1={stepX(hoverIndex)}
                  y1={paddingTop - 10}
                  x2={stepX(hoverIndex)}
                  y2={paddingTop + windPlotHeight}
                  stroke="#0369a1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Points & Rotating Direction Arrows */}
              {steps.map((step, i) => {
                const x = stepX(i);
                const y = windY(step.windSpeed);
                const isHovered = hoverIndex === i;
                const { x: hitX, width: hitW } = getHitBounds(i);

                return (
                  <g key={i} onMouseEnter={() => setHoverIndex(i)} style={{ cursor: 'pointer' }}>
                    {/* Wind speed text */}
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#0f766e"
                      style={{ pointerEvents: 'none' }}
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
                      style={{ pointerEvents: 'none' }}
                    />

                    {/* Rotating Direction Pointer pinned below axis */}
                    <g transform={`translate(${x}, ${paddingTop + windPlotHeight + 20})`} style={{ pointerEvents: 'none' }}>
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

                    {/* Seamless Full-Height Hit Column */}
                    <rect
                      x={hitX}
                      y={0}
                      width={hitW}
                      height={windChartHeight}
                      fill="transparent"
                      style={{ pointerEvents: 'all' }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
}
