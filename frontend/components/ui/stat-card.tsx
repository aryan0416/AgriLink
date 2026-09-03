'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  prefix?: string;
  suffix?: string;
  color?: 'green' | 'blue' | 'amber' | 'rose' | 'purple' | 'teal';
  icon?: string;
  badge?: React.ReactNode;
  trend?: { value: number; label: string };
  animateCount?: boolean;
  className?: string;
  delay?: number;
}

const colorMap = {
  green: 'border-l-brand-600 text-brand-700',
  blue: 'border-l-blue-600 text-blue-700',
  amber: 'border-l-amber-500 text-amber-700',
  rose: 'border-l-rose-500 text-rose-700',
  purple: 'border-l-violet-500 text-violet-700',
  teal: 'border-l-teal-500 text-teal-700',
};

function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

export function StatCard({
  label,
  value,
  subLabel,
  prefix = '',
  suffix = '',
  color = 'green',
  icon,
  badge,
  trend,
  animateCount = true,
  className,
  delay = 0,
}: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const count = useCountUp(numericValue, 1200, visible && animateCount);
  const displayValue = animateCount && typeof value === 'number' ? count : value;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        'glass-card p-6 border-l-4 space-y-2 transition-all duration-500',
        colorMap[color],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={cn('flex items-end gap-2 kpi-number', colorMap[color].split(' ')[1])}>
        {prefix}<span>{displayValue}</span>{suffix}
        {badge}
      </div>
      {subLabel && <div className="text-xs text-gray-400">{subLabel}</div>}
      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-semibold', trend.value >= 0 ? 'text-brand-600' : 'text-rose-600')}>
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
}
