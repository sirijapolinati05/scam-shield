
import React from 'react';
import { cn } from '@/lib/utils';

type RiskLevel = 'high' | 'medium' | 'low';

interface RiskTagProps {
  level: RiskLevel;
  className?: string;
}

const RiskTag: React.FC<RiskTagProps> = ({ level, className }) => {
  const getIcon = () => {
    switch (level) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '';
    }
  };

  const getText = () => {
    switch (level) {
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Medium Risk';
      case 'low':
        return 'Low Risk';
      default:
        return '';
    }
  };

  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs';
  const riskClass = `risk-tag-${level}`;

  return (
    <span className={cn(baseClass, riskClass, className)}>
      <span className="mr-1">{getIcon()}</span>
      {getText()}
    </span>
  );
};

export default RiskTag;
