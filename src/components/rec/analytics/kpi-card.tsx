"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number | string;
  unit?: string;
  description?: string;
  icon: LucideIcon;
  isPrimary?: boolean;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export function KPICard({
  label,
  value,
  unit,
  description,
  icon: Icon,
  isPrimary = false,
  color = 'text-[#036635] dark:text-[#FECC07]',
  trend,
  trendValue,
}: KPICardProps) {
  return (
    <Card 
      className={cn(
        "border-[#036635]/20 dark:border-[#FECC07]/30 hover:shadow-lg transition-all duration-300",
        isPrimary && "ring-2 ring-[#036635]/20 dark:ring-[#FECC07]/30"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", color)} />
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            {isPrimary && (
              <span className="text-xs bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07] px-2 py-0.5 rounded-full font-semibold">
                KPI
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className={cn("text-3xl font-bold", color)}>
            {typeof value === 'number' 
              ? value.toLocaleString() 
              : value}
            {unit && (
              <span className="text-lg font-normal text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {trend && trendValue !== undefined && (
            <div className={cn(
              "text-xs flex items-center gap-1 mt-1",
              trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-muted-foreground'
            )}>
              <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
              <span>{Math.abs(trendValue)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

