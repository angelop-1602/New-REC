"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnalyticsFilters as FiltersType } from '@/types/analytics.types';

interface AnalyticsFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

const researchTypes = [
  { value: 'SR', label: 'Social/Behavioral Research (SR)' },
  { value: 'PR', label: 'Public Health Research (PR)' },
  { value: 'HO', label: 'Health Operations (HO)' },
  { value: 'BS', label: 'Biomedical Research (BS)' },
  { value: 'EX', label: 'Exempted from Review (EX)' },
];

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
  { value: 'rejected', label: 'Rejected' },
];

export function AnalyticsFilters({
  filters,
  onFiltersChange,
}: AnalyticsFiltersProps) {
  const handleResearchTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      researchType: value ? [value] : undefined,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value ? [value] : undefined,
    });
  };

  return (
    <Card className="border-[#036635]/20 dark:border-[#FECC07]/30">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="research-type">Research Type</Label>
          <Select
            value={filters.researchType?.[0] || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                handleResearchTypeChange('');
              } else {
                handleResearchTypeChange(value);
              }
            }}
          >
            <SelectTrigger id="research-type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {researchTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status?.[0] || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                handleStatusChange('');
              } else {
                handleStatusChange(value);
              }
            }}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(filters.researchType || filters.status) && (
          <div className="pt-2">
            <button
              onClick={() => onFiltersChange({})}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

