"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSkeleton } from '@/components/ui/loading';
import { UserCheck, Loader2 } from 'lucide-react';
import { reviewersManagementService, Reviewer, ReviewerRole } from '@/lib/services/reviewers/reviewersManagementService';
import { useRouter } from 'next/navigation';
import { ReviewersManagementService } from '@/lib/services/reviewers/reviewersManagementService';
import { toLocaleDateString } from '@/types';

const REC_MEMBER_ROLES: ReviewerRole[] = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member'];

export default function ReviewersPage() {
  const router = useRouter();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  useEffect(() => {
    loadReviewers();
  }, []);

  const loadReviewers = async () => {
    setLoading(true);
    try {
      const allReviewers = await reviewersManagementService.getAllReviewers();
      // Filter out reviewers with REC member roles (they're shown in Members page)
      // Only show reviewers without roles or with roles that are not REC member roles
      const nonMemberReviewers = allReviewers.filter(r => 
        !r.role || !REC_MEMBER_ROLES.includes(r.role)
      );
      // Sort by name alphabetically
      nonMemberReviewers.sort((a, b) => a.name.localeCompare(b.name));
      setReviewers(nonMemberReviewers);
    } catch (error) {
      console.error('Error loading reviewers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <CardTitle>All Reviewers</CardTitle>
            </div>
            <CardDescription>
              Reviewers without REC member roles. Reviewers with assigned roles are shown in the Members page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <LoadingSkeleton className="h-4 w-48 rounded-md" />
                  <LoadingSkeleton className="h-4 w-32 rounded-md" />
                  <LoadingSkeleton className="h-4 w-24 rounded-md" />
                  <LoadingSkeleton className="h-4 w-28 rounded-md ml-auto" />
                </div>
              ))}
        </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            <CardTitle>All Reviewers</CardTitle>
          </div>
          <CardDescription>
            Reviewers without REC member roles. Reviewers with assigned roles are shown in the Members page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#036635]/5 dark:bg-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20">
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Name</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Code</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Role</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Status</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewers.map((reviewer) => {
                  const isNavigating = navigatingId === reviewer.id;
                  return (
                    <TableRow 
                      key={reviewer.id}
                      className={`hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200 ${
                        isNavigating ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!isNavigating) {
                          setNavigatingId(reviewer.id);
                          router.push(`/rec/chairperson/reviewers/${reviewer.id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isNavigating && <Loader2 className="h-4 w-4 animate-spin text-[#036635] dark:text-[#FECC07]" />}
                          {reviewer.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{reviewer.code}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <UserCheck className="h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                          Reviewer
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={reviewer.isActive ? "default" : "secondary"}
                          className={reviewer.isActive ? "bg-[#036635] dark:bg-[#FECC07] text-white dark:text-black" : ""}
                        >
                          {reviewer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {toLocaleDateString(reviewer.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <UserCheck className="h-12 w-12 mx-auto text-[#036635] dark:text-[#FECC07] mb-4" />
              <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
                No Reviewers Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Add reviewers in Settings to see them here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
