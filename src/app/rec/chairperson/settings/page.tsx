"use client"

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, Palette, UserCheck, Users, Crown, Shield, FileText, UserCog, Check, Copy, CheckCircle2, Mail } from 'lucide-react';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { reviewersManagementService, Reviewer, CreateReviewerRequest, ReviewerRole } from '@/lib/services/reviewers/reviewersManagementService';
import { generateReviewerCode } from '@/lib/services/reviewers/reviewerCodeGenerator';
import { useAuth } from '@/hooks/useAuth';
import { customToast } from '@/components/ui/custom/toast';
import { LoadingSimple, InlineLoading } from "@/components/ui/loading";
import { EmailService } from "@/lib/services/email/emailService";

export default function RECSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('theme');

  // Add Reviewer State
  const [newReviewer, setNewReviewer] = useState<CreateReviewerRequest>({
    name: '',
    email: '',
    role: undefined
  });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [savingReviewer, setSavingReviewer] = useState(false);

  // Test Email State (Reviewers tab)
  const [testEmail, setTestEmail] = useState<string>('');
  const [testName, setTestName] = useState<string>('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Member Management State
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingMembers, setSavingMembers] = useState(false);
  const [chairperson, setChairperson] = useState<string>('');
  const [viceChair, setViceChair] = useState<string>('');
  const [secretary, setSecretary] = useState<string>('');
  const [officeSecretary, setOfficeSecretary] = useState<string>('');
  const [members, setMembers] = useState<string[]>([]);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle tab query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['theme', 'reviewers', 'members'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load members data when members tab is active
  useEffect(() => {
    loadMembersData();
  }, []);

  // Generate code preview when name changes
  useEffect(() => {
    const generateCodePreview = async () => {
      if (newReviewer.name.trim()) {
        try {
          const code = await generateReviewerCode(newReviewer.name.trim());
          setGeneratedCode(code);
        } catch (error) {
          console.error('Error generating code preview:', error);
          setGeneratedCode('');
        }
      } else {
        setGeneratedCode('');
      }
    };

    const timeoutId = setTimeout(generateCodePreview, 500);
    return () => clearTimeout(timeoutId);
  }, [newReviewer.name]);

  const loadMembersData = async () => {
    setLoadingMembers(true);
    try {
      const reviewersData = await reviewersManagementService.getAllReviewers();
      setReviewers(reviewersData.filter(r => r.isActive));
      
      // Load current assignments from reviewer roles
      const chairReviewer = reviewersData.find(r => r.role === 'chairperson' && r.isActive);
      if (chairReviewer) setChairperson(chairReviewer.id);
      
      const viceChairReviewer = reviewersData.find(r => r.role === 'vice-chair' && r.isActive);
      if (viceChairReviewer) setViceChair(viceChairReviewer.id);
      
      const secretaryReviewer = reviewersData.find(r => r.role === 'secretary' && r.isActive);
      if (secretaryReviewer) setSecretary(secretaryReviewer.id);
      
      const officeSecretaryReviewer = reviewersData.find(r => r.role === 'office-secretary' && r.isActive);
      if (officeSecretaryReviewer) setOfficeSecretary(officeSecretaryReviewer.id);
      
      // Get all reviewers with 'member' role
      const memberReviewers = reviewersData.filter(r => r.role === 'member' && r.isActive);
      setMembers(memberReviewers.map(r => r.id));
    } catch (error) {
      console.error('Error loading data:', error);
      customToast.error(
        'Load Failed',
        'Failed to load reviewers data. Please try again.'
      );
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddReviewer = async () => {
    if (!newReviewer.name.trim() || !user) return;
    
    setSavingReviewer(true);
    try {
      const reviewerId = await reviewersManagementService.createReviewer(newReviewer);
      if (reviewerId) {
        customToast.success(
          'Reviewer Added',
          `Reviewer was added successfully. Code: ${generatedCode}`
        );
        setNewReviewer({ name: '', role: undefined });
        setGeneratedCode('');
        setCodeCopied(false);
        await loadMembersData(); // Refresh members data
      } else {
        customToast.error(
          'Add Failed',
          'Failed to add reviewer.'
        );
      }
    } catch (error) {
      console.error('Error adding reviewer:', error);
      customToast.error(
        'Add Failed',
        'Failed to add reviewer. Please try again.'
      );
    } finally {
      setSavingReviewer(false);
    }
  };

  const handleCopyCode = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setCodeCopied(true);
        customToast.success(
          'Code Copied',
          'Reviewer code copied to clipboard.'
        );
        setTimeout(() => setCodeCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
        customToast.error(
          'Copy Failed',
          'Failed to copy code. Please try again.'
        );
      }
    }
  };

  const handleSaveMembers = async () => {
    if (!user) return;
    
    if (!chairperson) {
      customToast.error(
        'Missing Chairperson',
        'Please select a Chairperson before saving.'
      );
      return;
    }
    
    setSavingMembers(true);
    try {
      const allReviewers = await reviewersManagementService.getAllReviewers();
      const memberRoles: ReviewerRole[] = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member'];
      const currentMembers = allReviewers.filter(r => r.role && memberRoles.includes(r.role));
      
      const selectedIds = [
        chairperson,
        viceChair,
        secretary,
        officeSecretary,
        ...members
      ].filter(Boolean) as string[];
      
      // Remove roles from reviewers who are no longer selected
      const removeRolePromises = currentMembers
        .filter(r => !selectedIds.includes(r.id))
        .map(async (reviewer) => {
          await reviewersManagementService.updateReviewer(reviewer.id, { role: null });
        });
      
      await Promise.all(removeRolePromises);
      
      // Update roles for selected reviewers
      const updatePromises = selectedIds.map(async (reviewerId) => {
        const reviewer = reviewers.find(r => r.id === reviewerId);
        if (!reviewer) return;
        
        let newRole: ReviewerRole | undefined;
        if (reviewerId === chairperson) newRole = 'chairperson';
        else if (reviewerId === viceChair) newRole = 'vice-chair';
        else if (reviewerId === secretary) newRole = 'secretary';
        else if (reviewerId === officeSecretary) newRole = 'office-secretary';
        else if (members.includes(reviewerId)) newRole = 'member';
        
        if (newRole && reviewer.role !== newRole) {
          await reviewersManagementService.updateReviewer(reviewerId, { role: newRole });
        }
      });
      
      await Promise.all(updatePromises);
      
      customToast.success(
        'Assignments Saved',
        'Member assignments have been updated successfully.'
      );
      await loadMembersData();
    } catch (error) {
      console.error('Error saving member assignments:', error);
      customToast.error(
        'Save Failed',
        'Failed to save member assignments. Please try again.'
      );
    } finally {
      setSavingMembers(false);
    }
  };

  const getAvailableReviewers = (excludeIds: string[] = []) => {
    return reviewers.filter(r => !excludeIds.includes(r.id));
  };

  const getSelectedIds = () => {
    return [chairperson, viceChair, secretary, officeSecretary].filter(Boolean) as string[];
  };

  const toggleMember = (reviewerId: string) => {
    if (members.includes(reviewerId)) {
      setMembers(members.filter(id => id !== reviewerId));
    } else {
      const selectedIds = getSelectedIds();
      if (!selectedIds.includes(reviewerId)) {
        setMembers([...members, reviewerId]);
      }
    }
  };

  const getAvailableMembers = () => {
    const selectedIds = getSelectedIds();
    return reviewers.filter(r => !selectedIds.includes(r.id));
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
        customToast.error(
        'Missing Email',
        'Please enter an email address to send a test email.'
        );
        return;
      }

    setSendingTestEmail(true);
    try {
      const name = testName.trim() || 'Reviewer';
      const result = await EmailService.sendTestNotification(testEmail.trim(), name);
      if (result.success) {
        customToast.success(
          'Test Email Sent',
          `A test email was sent to ${testEmail.trim()}.`
        );
      } else {
        customToast.error(
          'Send Failed',
          result.error || 'Failed to send test email.'
        );
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      customToast.error(
        'Send Failed',
        'Failed to send test email. Please check your email settings.'
      );
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences, reviewers, and REC members
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Tabs */}
          <div className="col-span-12 md:col-span-3">
            <TabsList className="flex flex-col h-auto w-full bg-muted/50 p-1.5 gap-1">
              <TabsTrigger 
                value="theme" 
                className="w-full justify-start gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <Palette className="h-4 w-4" />
                Theme
              </TabsTrigger>
              <TabsTrigger 
                value="reviewers" 
                className="w-full justify-start gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <UserCheck className="h-4 w-4" />
                Reviewers
              </TabsTrigger>
              <TabsTrigger 
                value="members" 
                className="w-full justify-start gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <Users className="h-4 w-4" />
                REC Members
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right Column - Content */}
          <div className="col-span-12 md:col-span-9">
            {/* Theme Tab */}
            <TabsContent value="theme" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    <CardTitle>Theme</CardTitle>
                  </div>
                  <CardDescription>
                    Customize the appearance of the application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Appearance</Label>
                    <RadioGroup value={theme} onValueChange={setTheme}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Sun className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Light</div>
                            <div className="text-sm text-muted-foreground">Use light theme</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Moon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Dark</div>
                            <div className="text-sm text-muted-foreground">Use dark theme</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="system" id="system" />
                        <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Monitor className="h-4 w-4" />
                          <div>
                            <div className="font-medium">System</div>
                            <div className="text-sm text-muted-foreground">Use system theme</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviewers Tab - Add Reviewer Form + Test Email */}
            <TabsContent value="reviewers" className="mt-0 space-y-6">
              {/* Test Email Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <CardTitle>Send Test Email</CardTitle>
                  </div>
                  <CardDescription>
                    Use this to verify that your email settings are working before assigning reviewers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="test-email">Email Address</Label>
                        <Input
                          id="test-email"
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="reviewer@example.com"
                          className="mt-2"
                        />
                      </div>
                            <div>
                        <Label htmlFor="test-name">Reviewer Name (optional)</Label>
                        <Input
                          id="test-name"
                          value={testName}
                          onChange={(e) => setTestName(e.target.value)}
                          placeholder="Dr. Jane Doe"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendTestEmail}
                        disabled={sendingTestEmail}
                        className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black"
                      >
                        {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Reviewer Form */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    <CardTitle>Add Reviewer</CardTitle>
                  </div>
                  <CardDescription>
                    Add a new research ethics reviewer to the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newReviewer.name}
                        onChange={(e) => setNewReviewer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Dr. Janette Fermin"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        A unique code will be automatically generated based on the name initials
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newReviewer.email || ''}
                        onChange={(e) => setNewReviewer(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="reviewer@example.com"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email address for sending notifications about protocol assignments and updates
                      </p>
                    </div>
                    
                    {/* Generated Code Preview */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Generated Reviewer Code</Label>
                      {generatedCode ? (
                        <div className="p-4 bg-gradient-to-r from-[#036635]/10 to-[#036635]/5 dark:from-[#FECC07]/20 dark:to-[#FECC07]/10 rounded-lg border-2 border-[#036635]/30 dark:border-[#FECC07]/40">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 font-mono text-xl font-bold text-[#036635] dark:text-[#FECC07] bg-white dark:bg-gray-900 px-4 py-3 rounded border-2 border-[#036635]/40 dark:border-[#FECC07]/50 text-center">
                              {generatedCode}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopyCode}
                              className="flex-shrink-0 h-11"
                            >
                              {codeCopied ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3 text-center">
                            This code will be used by the reviewer to access their account. Copy it before saving.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
                          <p className="text-sm text-muted-foreground text-center">
                            Enter a name above to generate the reviewer code
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="role">Role (Optional)</Label>
                      <Select 
                        value={newReviewer.role || undefined} 
                        onValueChange={(value) => setNewReviewer(prev => ({ ...prev, role: value ? (value as ReviewerRole) : undefined }))}
                      >
                        <SelectTrigger id="role" className="mt-2">
                          <SelectValue placeholder="Select a role (optional)..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chairperson">Chairperson</SelectItem>
                          <SelectItem value="vice-chair">Vice Chair</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="secretary">Secretary</SelectItem>
                          <SelectItem value="office-secretary">Office Secretary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setNewReviewer({ name: '', email: '', role: undefined });
                          setGeneratedCode('');
                          setCodeCopied(false);
                        }}
                        disabled={savingReviewer}
                      >
                        Reset
                      </Button>
                      <Button 
                        onClick={handleAddReviewer} 
                        disabled={savingReviewer || !newReviewer.name.trim()}
                        className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black"
                      >
                        {savingReviewer ? 'Adding...' : 'Add Reviewer'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* REC Members Tab - Member Management Form */}
            <TabsContent value="members" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Member Management</CardTitle>
                  </div>
                  <CardDescription>
                    Assign reviewers to REC member positions. All selected reviewers will be added as REC members if they don&apos;t exist yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSimple size="md" text="Loading reviewers..." />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Chairperson */}
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          Chairperson *
                        </Label>
                        <Select 
                          value={chairperson} 
                          onValueChange={setChairperson}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select chairperson..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableReviewers([viceChair, secretary, officeSecretary].filter(Boolean) as string[]).map(reviewer => (
                              <SelectItem key={reviewer.id} value={reviewer.id}>
                                {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Vice Chair */}
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          Vice Chair
                        </Label>
                        <Select 
                          value={viceChair} 
                          onValueChange={setViceChair}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vice chair..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableReviewers([chairperson, secretary, officeSecretary].filter(Boolean) as string[]).map(reviewer => (
                              <SelectItem key={reviewer.id} value={reviewer.id}>
                                {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Secretary */}
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          Secretary
                        </Label>
                        <Select 
                          value={secretary} 
                          onValueChange={setSecretary}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select secretary..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableReviewers([chairperson, viceChair, officeSecretary].filter(Boolean) as string[]).map(reviewer => (
                              <SelectItem key={reviewer.id} value={reviewer.id}>
                                {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Office Secretary */}
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <UserCog className="h-4 w-4 text-purple-600" />
                          Office Secretary
                        </Label>
                        <Select 
                          value={officeSecretary} 
                          onValueChange={setOfficeSecretary}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select office secretary..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableReviewers([chairperson, viceChair, secretary].filter(Boolean) as string[]).map(reviewer => (
                              <SelectItem key={reviewer.id} value={reviewer.id}>
                                {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Members Checklist */}
                      <div>
                        <Label className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-gray-600" />
                          Members (Checklist)
                        </Label>
                        <div className="border rounded-lg p-4">
                          {getAvailableMembers().length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {getAvailableMembers().map(reviewer => (
                                <div key={reviewer.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`member-${reviewer.id}`}
                                    checked={members.includes(reviewer.id)}
                                    onCheckedChange={() => toggleMember(reviewer.id)}
                                  />
                                  <label
                                    htmlFor={`member-${reviewer.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                  >
                                    {reviewer.name}
                                    {reviewer.role && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {reviewer.role}
                                      </Badge>
                                    )}
                                  </label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No available reviewers (all are assigned to specific roles)
                            </p>
                          )}
                        </div>
                        {members.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {members.length} member{members.length !== 1 ? 's' : ''} selected
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setChairperson('');
                            setViceChair('');
                            setSecretary('');
                            setOfficeSecretary('');
                            setMembers([]);
                          }}
                          disabled={savingMembers}
                        >
                          Reset
                        </Button>
                        <Button 
                          onClick={handleSaveMembers} 
                          disabled={savingMembers || !chairperson}
                          className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black"
                        >
                          {savingMembers ? (
                            <>
                              <InlineLoading size="sm" />
                              <span className="ml-2">Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Save Assignments
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
