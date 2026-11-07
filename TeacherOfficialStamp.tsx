import React from 'react';
import { MemoConfig } from '../types';

interface TeacherOfficialStampProps {
  config: MemoConfig;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'purple' | 'red' | 'teal';
  className?: string;
}

export const TeacherOfficialStamp: React.FC<TeacherOfficialStampProps> = ({
  config,
  size = 'md',
  color = 'blue',
  className = '',
}) => {
  // If custom uploaded image exists, render it
  if (config.teacherStamp) {
    const sizeClasses = {
      sm: 'w-20 h-20',
      md: 'w-40 h-40',
      lg: 'w-48 h-48',
    };
    return (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <img
          src={config.teacherStamp}
          alt="ختم وتوقيع الأستاذ"
          className="max-w-full max-h-full object-contain filter drop-shadow-xs"
        />
      </div>
    );
  }

  // Dimension settings for auto-generated vector stamp
  const dimensions = {
    sm: { width: 100, height: 100, outerR: 46, innerR: 36, fontSizeOuter: 6.5, fontSizeCenter: 9, fontSub: 6 },
    md: { width: 170, height: 170, outerR: 80, innerR: 62, fontSizeOuter: 10.5, fontSizeCenter: 15, fontSub: 9.5 },
    lg: { width: 210, height: 210, outerR: 99, innerR: 77, fontSizeOuter: 12.5, fontSizeCenter: 17, fontSub: 10.5 },
  }[size];

  const colorStyles = {
    blue: {
      border: '#1d4ed8',
      text: '#1e40af',
      bg: 'rgba(239, 246, 255, 0.5)',
      star: '#2563eb',
    },
    purple: {
      border: '#7c3aed',
      text: '#6d28d9',
      bg: 'rgba(250, 245, 255, 0.5)',
      star: '#8b5cf6',
    },
    red: {
      border: '#c2185b',
      text: '#9d174d',
      bg: 'rgba(253, 242, 248, 0.5)',
      star: '#db2777',
    },
    teal: {
      border: '#0f766e',
      text: '#115e59',
      bg: 'rgba(240, 253, 250, 0.5)',
      star: '#14b8a6',
    },
  }[color];

  const teacherName = config.teacherName || '';
  const schoolName = config.schoolName ? config.schoolName.slice(0, 32) : '';
  const directorate = config.directorate ? config.directorate.replace('مديرية التربية لولاية', 'م.ت.و.').slice(0, 24) : '';

  const center = dimensions.width / 2;

  return (
    <div
      className={`inline-block select-none transform -rotate-3 transition-transform hover:rotate-0 ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      title={`الختم الرقمي للأستاذ: ${teacherName}`}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="overflow-visible"
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.12))' }}
      >
        <defs>
          {/* Top text path */}
          <path
            id={`top-arc-${size}`}
            d={`M ${center - dimensions.outerR + 5} ${center} A ${dimensions.outerR - 5} ${dimensions.outerR - 5} 0 1 1 ${center + dimensions.outerR - 5} ${center}`}
            fill="none"
          />
          {/* Bottom text path */}
          <path
            id={`bottom-arc-${size}`}
            d={`M ${center + dimensions.outerR - 5} ${center} A ${dimensions.outerR - 5} ${dimensions.outerR - 5} 0 1 1 ${center - dimensions.outerR + 5} ${center}`}
            fill="none"
          />
        </defs>

        {/* Circular background fill */}
        <circle
          cx={center}
          cy={center}
          r={dimensions.outerR}
          fill={colorStyles.bg}
          stroke={colorStyles.border}
          strokeWidth="3"
          strokeDasharray="4 2"
        />

        {/* Inner solid ring */}
        <circle
          cx={center}
          cy={center}
          r={dimensions.innerR}
          fill="none"
          stroke={colorStyles.border}
          strokeWidth="1.8"
        />

        {/* Outer Circular Top Text */}
        <text
          fill={colorStyles.text}
          fontSize={dimensions.fontSizeOuter}
          fontWeight="800"
          letterSpacing="0.35"
          style={{ fontFamily: 'Arial, Tahoma, sans-serif' }}
        >
          <textPath href={`#top-arc-${size}`} startOffset="50%" textAnchor="middle">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </textPath>
        </text>

        {/* Outer Circular Bottom Text */}
        <text
          fill={colorStyles.text}
          fontSize={dimensions.fontSizeOuter}
          fontWeight="800"
          style={{ fontFamily: 'Arial, Tahoma, sans-serif' }}
        >
          <textPath href={`#bottom-arc-${size}`} startOffset="50%" textAnchor="middle">
            ★ وزارة التربية الوطنية ★
          </textPath>
        </text>

        {/* Center content */}
        <g textAnchor="middle">
          {/* Specialty */}
          <text
            x={center}
            y={center - dimensions.innerR / 2.2}
            fill={colorStyles.text}
            fontSize={dimensions.fontSub}
            fontWeight="800"
            style={{ fontFamily: 'Arial, Tahoma, sans-serif' }}
          >
            علوم الطبيعة والحياة
          </text>

          {/* Decorative Divider */}
          <line
            x1={center - dimensions.innerR * 0.7}
            y1={center - dimensions.innerR / 4.5}
            x2={center + dimensions.innerR * 0.7}
            y2={center - dimensions.innerR / 4.5}
            stroke={colorStyles.border}
            strokeWidth="0.75"
            strokeDasharray="2 1"
          />

          {/* Teacher Name */}
          <text
            x={center}
            y={center + 2}
            fill={colorStyles.text}
            fontSize={dimensions.fontSizeCenter}
            fontWeight="900"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {teacherName}
          </text>

          {/* Teacher Rank/Grade or School */}
          <text
            x={center}
            y={center + dimensions.innerR / 2.4}
            fill={colorStyles.text}
            fontSize={dimensions.fontSub - 0.5}
            fontWeight="bold"
          >
            {config.teacherGrade ? config.teacherGrade.replace('للتعليم المتوسط', '').replace('في التعليم المتوسط', '') : 'أستاذ المادة'}
          </text>

          {/* School abbreviation */}
          <text
            x={center}
            y={center + dimensions.innerR / 1.4}
            fill={colorStyles.text}
            fontSize={dimensions.fontSub - 1}
            fontWeight="medium"
            opacity="0.85"
          >
            {schoolName}
          </text>
        </g>
      </svg>
    </div>
  );
};
