"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange, DateRangePreset } from '@/types/analytics.types';

interface AnalyticsDateRangeProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

const presets: { label: string; value: DateRangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: 'last7days' },
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'Last 3 Months', value: 'last3months' },
  { label: 'Last 6 Months', value: 'last6months' },
  { label: 'Last Year', value: 'lastyear' },
  { label: 'All Time', value: 'alltime' },
];

export function AnalyticsDateRange({
  dateRange,
  onDateRangeChange,
}: AnalyticsDateRangeProps) {
  const handlePresetClick = (preset: DateRangePreset) => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'last3months':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'last6months':
        start.setMonth(start.getMonth() - 6);
        break;
      case 'lastyear':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'alltime':
        start.setFullYear(2020, 0, 1); // Arbitrary start date
        break;
    }

    onDateRangeChange({ start, end, preset });
  };

  return (
    <Card className="border-[#036635]/20 dark:border-[#FECC07]/30">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Date Range</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              variant={dateRange.preset === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset.value)}
              className={cn(
                dateRange.preset === preset.value &&
                  'bg-[#036635] text-white dark:bg-[#FECC07] dark:text-black'
              )}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange.start && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.start ? (
                  format(dateRange.start, 'PPP')
                ) : (
                  <span>Start date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.start}
                onSelect={(date) => {
                  if (date) {
                    onDateRangeChange({
                      ...dateRange,
                      start: date,
                      preset: undefined,
                    });
                  }
                }}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange.end && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.end ? (
                  format(dateRange.end, 'PPP')
                ) : (
                  <span>End date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.end}
                onSelect={(date) => {
                  if (date) {
                    onDateRangeChange({
                      ...dateRange,
                      end: date,
                      preset: undefined,
                    });
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}

