import React from 'react';

interface BmdWeatherIconProps {
  iconType: string;
  size?: number;
  className?: string;
  title?: string;
  isNight?: boolean;
}

export default function BmdWeatherIcon({
  iconType,
  size = 48,
  className = '',
  title,
  isNight = false
}: BmdWeatherIconProps) {
  const norm = (iconType || 'sunny').toLowerCase();
  const effectiveIsNight = isNight || norm.includes('night');

  // Color Palette
  const sunGold = '#f59e0b';
  const sunYellow = '#fbbf24';
  const cloudWhite = '#f8fafc';
  const cloudLight = '#e2e8f0';
  const cloudGray = '#94a3b8';
  const cloudDark = '#64748b';
  const rainBlue = '#38bdf8';
  const rainDarkBlue = '#0284c7';
  const moonSilver = '#cbd5e1';
  const moonGlow = '#e2e8f0';

  // 1. Sunny (Day)
  if (!effectiveIsNight && norm.includes('sunny') && !norm.includes('cloud') && !norm.includes('rain')) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-label={title || 'Sunny'}>
        <circle cx="32" cy="32" r="14" fill={sunGold} />
        <circle cx="32" cy="32" r="11" fill={sunYellow} />
        {/* Rays */}
        <g stroke={sunGold} strokeWidth="3" strokeLinecap="round">
          <line x1="32" y1="6" x2="32" y2="12" />
          <line x1="32" y1="52" x2="32" y2="58" />
          <line x1="6" y1="32" x2="12" y2="32" />
          <line x1="52" y1="32" x2="58" y2="32" />
          <line x1="13.6" y1="13.6" x2="17.8" y2="17.8" />
          <line x1="46.2" y1="46.2" x2="50.4" y2="50.4" />
          <line x1="13.6" y1="50.4" x2="17.8" y2="46.2" />
          <line x1="46.2" y1="17.8" x2="50.4" y2="13.6" />
        </g>
      </svg>
    );
  }

  // 2. Clear Night
  if (effectiveIsNight && (!norm.includes('cloud') && !norm.includes('rain')) || norm.includes('clear_night') || norm === 'night' || norm === 'clear') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-label={title || 'Clear Night'}>
        <path
          d="M44 38C44 48 35 56 24 56C19.5 56 15.3 54.4 12 51.7C15.5 53.2 19.4 54 23.5 54C37.6 54 49 42.6 49 28.5C49 22.8 47.1 17.6 43.9 13.4C44 14.3 44 15.1 44 16C44 26 38 34 28 36C33 37.3 38.3 38 44 38Z"
          fill={moonSilver}
          stroke={moonGlow}
          strokeWidth="1.5"
        />
        {/* Stars */}
        <circle cx="48" cy="16" r="2" fill="#fef08a" />
        <circle cx="54" cy="26" r="1.5" fill="#fef08a" />
        <circle cx="20" cy="18" r="1.5" fill="#fef08a" />
        <circle cx="36" cy="12" r="1.2" fill="#ffffff" />
      </svg>
    );
  }

  // 3. Rain / Rainy Variations
  if (norm.includes('rain')) {
    const isHeavy = norm.includes('heavy');
    const isModerate = norm.includes('moderate');
    const isDay = !norm.includes('night');

    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-label={title || 'Rain'}>
        {/* Sun in background for day */}
        {isDay && (
          <g>
            <circle cx="22" cy="20" r="10" fill={sunGold} />
            <line x1="22" y1="6" x2="22" y2="9" stroke={sunGold} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="20" x2="13" y2="20" stroke={sunGold} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="13.5" y1="11.5" x2="15.6" y2="13.6" stroke={sunGold} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Night moon for night */}
        {!isDay && (
          <path
            d="M26 12C26 18 21 23 15 23C13.5 23 12.1 22.7 10.9 22.1C12.8 24.5 15.7 26 19 26C24.5 26 29 21.5 29 16C29 13.8 28.3 11.7 27.1 10C26.4 10.6 26 11.2 26 12Z"
            fill={moonSilver}
          />
        )}

        {/* Primary Rain Cloud */}
        <path
          d="M20 40H48C52.4 40 56 36.4 56 32C56 27.8 52.8 24.3 48.6 24C47.8 17.3 42 12 35 12C29.2 12 24.2 15.6 22.4 20.7C21.6 20.3 20.8 20 20 20C15.6 20 12 23.6 12 28C12 32.4 15.6 40 20 40Z"
          fill={cloudDark}
          stroke={cloudGray}
          strokeWidth="1.5"
        />

        {/* Raindrops */}
        <g stroke={isHeavy ? rainDarkBlue : rainBlue} strokeWidth={isHeavy ? '3' : '2'} strokeLinecap="round">
          <line x1="22" y1="44" x2="19" y2="52" />
          <line x1="32" y1="44" x2="29" y2="52" />
          <line x1="42" y1="44" x2="39" y2="52" />
          {(isModerate || isHeavy) && (
            <>
              <line x1="27" y1="48" x2="24" y2="56" />
              <line x1="37" y1="48" x2="34" y2="56" />
              <line x1="47" y1="48" x2="44" y2="56" />
            </>
          )}
        </g>
      </svg>
    );
  }

  // 4. Overcast
  if (norm.includes('overcast') || norm === 'cloudy') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-label={title || 'Overcast'}>
        {/* Background cloud */}
        <path
          d="M18 32H44C47.5 32 50.5 29.5 50.5 26C50.5 22.7 48 20 44.7 19.8C44 14.5 39.5 10.5 34 10.5C29.4 10.5 25.5 13.3 24 17.3C23.4 17 22.7 16.8 22 16.8C18.5 16.8 15.5 19.7 15.5 23.2C15.5 26.7 18.5 32 18 32Z"
          fill={cloudGray}
        />
        {/* Foreground cloud */}
        <path
          d="M20 48H50C54.4 48 58 44.4 58 40C58 35.8 54.8 32.3 50.6 32C49.8 25.3 44 20 37 20C31.2 20 26.2 23.6 24.4 28.7C23.6 28.3 22.8 28 22 28C17.6 28 14 31.6 14 36C14 40.4 17.6 48 20 48Z"
          fill={cloudDark}
          stroke={cloudGray}
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  // 5. Partly Cloudy / Mostly Cloudy (Day & Night)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-label={title || 'Partly Cloudy'}>
      {/* Sun or Moon in background */}
      {!effectiveIsNight ? (
        <g>
          <circle cx="26" cy="24" r="11" fill={sunGold} />
          <line x1="26" y1="8" x2="26" y2="11" stroke={sunGold} strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="24" x2="15" y2="24" stroke={sunGold} strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="14" x2="18.5" y2="16.5" stroke={sunGold} strokeWidth="3" strokeLinecap="round" />
          <line x1="36" y1="14" x2="33.5" y2="16.5" stroke={sunGold} strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : (
        <path
          d="M32 14C32 21 26 27 19 27C17.2 27 15.5 26.6 14.1 25.9C16.4 28.8 19.9 30.7 23.9 30.7C30.5 30.7 36 25.2 36 18.5C36 15.9 35.2 13.4 33.7 11.4C32.9 12.1 32 13 32 14Z"
          fill={moonSilver}
        />
      )}

      {/* Fluffy Foreground Cloud */}
      <path
        d="M22 46H48C52.4 46 56 42.4 56 38C56 33.8 52.8 30.3 48.6 30C47.8 23.3 42 18 35 18C29.2 18 24.2 21.6 22.4 26.7C21.6 26.3 20.8 26 20 26C15.6 26 12 29.6 12 34C12 38.4 15.6 46 22 46Z"
        fill={cloudWhite}
        stroke={cloudLight}
        strokeWidth="1.5"
      />
    </svg>
  );
}
