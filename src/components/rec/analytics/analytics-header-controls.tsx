"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange, DateRangePreset, AnalyticsFilters as FiltersType } from '@/types/analytics.types';

interface AnalyticsHeaderControlsProps {
  dateRange: DateRange;
  filters: FiltersType;
  onDateRangeChange: (dateRange: DateRange) => void;
  onFiltersChange: (filters: FiltersType) => void;
}

const presets: { label: string; value: DateRangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: '7D', value: 'last7days' },
  { label: '30D', value: 'last30days' },
  { label: '3M', value: 'last3months' },
  { label: '6M', value: 'last6months' },
  { label: '1Y', value: 'lastyear' },
  { label: 'All', value: 'alltime' },
];

const researchTypes = [
  { value: 'SR', label: 'SR' },
  { value: 'PR', label: 'PR' },
  { value: 'HO', label: 'HO' },
  { value: 'BS', label: 'BS' },
  { value: 'EX', label: 'EX' },
];

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
  { value: 'rejected', label: 'Rejected' },
];

export function AnalyticsHeaderControls({
  dateRange,
  filters,
  onDateRangeChange,
  onFiltersChange,
}: AnalyticsHeaderControlsProps) {
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
        start.setFullYear(2020, 0, 1);
        break;
    }

    onDateRangeChange({ start, end, preset });
  };

  const hasActiveFilters = filters.researchType || filters.status;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date Range Presets */}
      <div className="flex items-center gap-1 flex-wrap">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={dateRange.preset === preset.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className={cn(
              'h-7 px-2 text-xs',
              dateRange.preset === preset.value &&
                'bg-[#036635] text-white dark:bg-[#FECC07] dark:text-black'
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 space-y-2">
            <div className="text-sm font-medium">Start Date</div>
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
            <div className="text-sm font-medium mt-4">End Date</div>
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
          </div>
        </PopoverContent>
      </Popover>

      {/* Filters */}
      <div className="flex items-center gap-2 border-l border-border pl-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select
          value={filters.researchType?.[0] || 'all'}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              researchType: value === 'all' ? undefined : [value],
            });
          }}
        >
          <SelectTrigger className="h-7 w-[90px] text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {researchTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status?.[0] || 'all'}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              status: value === 'all' ? undefined : [value],
            });
          }}
        >
          <SelectTrigger className="h-7 w-[90px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({})}
            className="h-7 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

