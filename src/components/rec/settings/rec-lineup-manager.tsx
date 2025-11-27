"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Save, 
  AlertCircle, 
  Crown,
  Shield,
  FileText,
  UserCog,
  Loader2
} from 'lucide-react';
import { recSettingsService } from '@/lib/services/core/recSettingsService';
import { RECMember, RECLineup, CreateRECMemberRequest } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function RECLineupManager() {
  const { user } = useAuth();
  const [members, setMembers] = useState<RECMember[]>([]);
  const [currentLineup, setCurrentLineup] = useState<RECLineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [selectedChair, setSelectedChair] = useState('');
  const [selectedViceChair, setSelectedViceChair] = useState('');
  const [selectedSecretary, setSelectedSecretary] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState<CreateRECMemberRequest>({
    name: '',
    email: '',
    position: '',
    department: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, lineupData] = await Promise.all([
        recSettingsService.getAllMembers(),
        recSettingsService.getCurrentLineup()
      ]);
      
      setMembers(membersData);
      setCurrentLineup(lineupData);
      
      // Set current selections
      if (lineupData) {
        setSelectedChair(lineupData.chair?.id || '');
        setSelectedViceChair(lineupData.viceChair?.id || '');
        setSelectedSecretary(lineupData.secretary?.id || '');
        setSelectedStaff(lineupData.staff?.map(s => s.id) || []);
        setSelectedMembers(lineupData.members?.map(m => m.id) || []);
      }
    } catch (error) {
      console.error('Error loading REC data:', error);
      toast.error('Failed to load REC data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim() || !user) return;
    
    setSaving(true);
    try {
      const memberId = await recSettingsService.createMember(newMember, user.uid);
      if (memberId) {
        toast.success('Member added successfully');
        setAddMemberOpen(false);
        setNewMember({ name: '', email: '', position: '', department: '' });
        await loadData(); // Refresh data
      } else {
        toast.error('Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLineup = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const success = await recSettingsService.updateLineup({
        chairId: selectedChair,
        viceChairId: selectedViceChair,
        secretaryId: selectedSecretary,
        staffIds: selectedStaff,
        memberIds: selectedMembers
      }, user.uid);
      
      if (success) {
        toast.success('REC lineup updated successfully');
        await loadData(); // Refresh data
      } else {
        toast.error('Failed to update lineup');
      }
    } catch (error) {
      console.error('Error updating lineup:', error);
      toast.error('Failed to update lineup');
    } finally {
      setSaving(false);
    }
  };

  const getPositionIcon = (position: string) => {
    if (position.toLowerCase().includes('chair')) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (position.toLowerCase().includes('vice')) return <Shield className="h-4 w-4 text-blue-600" />;
    if (position.toLowerCase().includes('secretary')) return <FileText className="h-4 w-4 text-green-600" />;
    if (position.toLowerCase().includes('staff')) return <UserCog className="h-4 w-4 text-purple-600" />;
    return <Users className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading REC settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">REC Lineup Management</h1>
          <p className="text-muted-foreground">Manage Research Ethics Committee members and positions</p>
        </div>
        <Button onClick={() => setAddMemberOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <Tabs defaultValue="lineup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lineup">Current Lineup</TabsTrigger>
          <TabsTrigger value="manage">Manage Positions</TabsTrigger>
          <TabsTrigger value="members">All Members</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Current REC Lineup
              </CardTitle>
              <CardDescription>
                Active Research Ethics Committee members and their positions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentLineup ? (
                <div className="grid gap-4">
                  {/* Chair */}
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">{currentLineup.chair?.name || 'Not assigned'}</p>
                        <p className="text-sm text-muted-foreground">REC Chairperson</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Chair</Badge>
                  </div>

                  {/* Vice Chair */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{currentLineup.viceChair?.name || 'Not assigned'}</p>
                        <p className="text-sm text-muted-foreground">REC Vice Chairperson</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Vice Chair</Badge>
                  </div>

                  {/* Secretary */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{currentLineup.secretary?.name || 'Not assigned'}</p>
                        <p className="text-sm text-muted-foreground">REC Secretary</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Secretary</Badge>
                  </div>

                  {/* Staff */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm text-muted-foreground">REC Staff</p>
                    {currentLineup.staff?.length > 0 ? (
                      currentLineup.staff.map(staff => (
                        <div key={staff.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <UserCog className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-sm text-muted-foreground">{staff.department}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Staff</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No staff assigned</p>
                    )}
                  </div>

                  {/* Members */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm text-muted-foreground">REC Members</p>
                    {currentLineup.members?.length > 0 ? (
                      currentLineup.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.department}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Member</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No members assigned</p>
                    )}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No REC lineup has been configured yet. Use the &quot;Manage Positions&quot; tab to set up the lineup.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Positions</CardTitle>
              <CardDescription>
                Select members for each REC position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {/* Chair Selection */}
                <div>
                  <Label>REC Chairperson</Label>
                  <Select value={selectedChair} onValueChange={setSelectedChair}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chairperson" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vice Chair Selection */}
                <div>
                  <Label>REC Vice Chairperson</Label>
                  <Select value={selectedViceChair} onValueChange={setSelectedViceChair}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vice chairperson" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.filter(m => m.id !== selectedChair).map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Secretary Selection */}
                <div>
                  <Label>REC Secretary</Label>
                  <Select value={selectedSecretary} onValueChange={setSelectedSecretary}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select secretary" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.filter(m => m.id !== selectedChair && m.id !== selectedViceChair).map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleUpdateLineup} 
                disabled={saving || !selectedChair}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update REC Lineup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All REC Members</CardTitle>
              <CardDescription>
                Complete list of Research Ethics Committee members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getPositionIcon(member.position)}
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.position} • {member.department}
                        </p>
                        {member.email && (
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New REC Member</DialogTitle>
            <DialogDescription>
              Add a new member to the Research Ethics Committee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Dr. John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@spup.edu.ph"
              />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={newMember.position}
                onChange={(e) => setNewMember(prev => ({ ...prev, position: e.target.value }))}
                placeholder="REC Member"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={newMember.department}
                onChange={(e) => setNewMember(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Research Ethics Committee"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember} 
              disabled={saving || !newMember.name.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
