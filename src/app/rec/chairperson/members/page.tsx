"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck } from 'lucide-react';
import RECLineupManager from '@/components/rec/settings/rec-lineup-manager';
import ReviewersManagement from '@/components/rec/chairperson/components/reviewers-management';

export default function MembersPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Members Management
        </h1>
        <p className="text-muted-foreground">
          Manage Research Ethics Committee members and reviewers
        </p>
      </div>

      <Tabs defaultValue="reviewers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reviewers" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Reviewers
          </TabsTrigger>
          <TabsTrigger value="rec-members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            REC Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviewers">
          <ReviewersManagement />
        </TabsContent>

        <TabsContent value="rec-members">
          <RECLineupManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
