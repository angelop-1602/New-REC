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
import { Users, Crown, Shield, FileText, UserCog, Loader2 } from 'lucide-react';
import { reviewersManagementService, Reviewer, ReviewerRole } from '@/lib/services/reviewers/reviewersManagementService';
import { useRouter } from 'next/navigation';
import { ReviewersManagementService } from '@/lib/services/reviewers/reviewersManagementService';
import { toLocaleDateString } from '@/types';

const REC_MEMBER_ROLES: ReviewerRole[] = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member'];

const getRoleIcon = (role?: ReviewerRole) => {
  switch (role) {
    case 'chairperson':
      return <Crown className="h-4 w-4 text-yellow-600" />;
    case 'vice-chair':
      return <Shield className="h-4 w-4 text-blue-600" />;
    case 'secretary':
      return <FileText className="h-4 w-4 text-green-600" />;
    case 'office-secretary':
      return <UserCog className="h-4 w-4 text-purple-600" />;
    default:
      return <Users className="h-4 w-4 text-gray-600" />;
  }
};

const getRoleLabel = (role?: ReviewerRole) => {
  switch (role) {
    case 'chairperson':
      return 'Chairperson';
    case 'vice-chair':
      return 'Vice Chair';
    case 'secretary':
      return 'Secretary';
    case 'office-secretary':
      return 'Office Secretary';
    case 'member':
      return 'Member';
    default:
      return 'No Role';
  }
};

const getRoleBadgeVariant = (role?: ReviewerRole) => {
  switch (role) {
    case 'chairperson':
      return 'default';
    case 'vice-chair':
      return 'secondary';
    case 'secretary':
      return 'outline';
    case 'office-secretary':
      return 'outline';
    default:
      return 'secondary';
  }
};

export default function RECMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const allReviewers = await reviewersManagementService.getAllReviewers();
      // Filter only reviewers with REC member roles
      const recMembers = allReviewers.filter(r => 
        r.isActive && r.role && REC_MEMBER_ROLES.includes(r.role)
      );
      // Sort by role priority
      recMembers.sort((a, b) => {
        const roleOrder: Record<ReviewerRole, number> = {
          'chairperson': 1,
          'vice-chair': 2,
          'secretary': 3,
          'office-secretary': 4,
          'member': 5
        };
        return (roleOrder[a.role!] || 99) - (roleOrder[b.role!] || 99);
      });
      setMembers(recMembers);
    } catch (error) {
      console.error('Error loading REC members:', error);
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
              <Users className="h-5 w-5" />
              <CardTitle>All REC Members</CardTitle>
            </div>
            <CardDescription>
              Complete list of Research Ethics Committee members with their assigned roles and positions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <LoadingSkeleton className="h-4 w-48 rounded-md" />
                  <LoadingSkeleton className="h-4 w-32 rounded-md" />
                  <LoadingSkeleton className="h-4 w-28 rounded-md" />
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
            <Users className="h-5 w-5" />
            <CardTitle>All REC Members</CardTitle>
          </div>
          <CardDescription>
            Complete list of Research Ethics Committee members with their assigned roles and positions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#036635]/5 dark:bg-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20">
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Name</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Code</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Role</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Specialty</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Status</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isNavigating = navigatingId === member.id;
                  return (
                    <TableRow 
                      key={member.id}
                      className={`hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200 ${
                        isNavigating ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!isNavigating) {
                          setNavigatingId(member.id);
                          router.push(`/rec/chairperson/rec-members/${member.id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isNavigating && <Loader2 className="h-4 w-4 animate-spin text-[#036635] dark:text-[#FECC07]" />}
                          {member.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{member.code}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(member.role)}
                          {getRoleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.specialty || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.isActive ? "default" : "secondary"}
                          className={member.isActive ? "bg-[#036635] dark:bg-[#FECC07] text-white dark:text-black" : ""}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {toLocaleDateString(member.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-[#036635] dark:text-[#FECC07] mb-4" />
              <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
                No REC Members Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Assign reviewers to REC member roles in Settings to see them here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

