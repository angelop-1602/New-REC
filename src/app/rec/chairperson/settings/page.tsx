"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Loader2, Settings, Users } from 'lucide-react';
import RECLineupManager from '@/components/rec/settings/rec-lineup-manager';
import { useAuth } from '@/hooks/useAuth';

export default function RECSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInitializeSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/rec-settings/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to initialize REC settings');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          REC Settings
        </h1>
        <p className="text-muted-foreground">
          Manage Research Ethics Committee settings and configuration
        </p>
      </div>

      <Tabs defaultValue="lineup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lineup">REC Lineup</TabsTrigger>
          <TabsTrigger value="initialize">Initialize Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup">
          <RECLineupManager />
        </TabsContent>

        <TabsContent value="initialize">
          <Card>
            <CardHeader>
              <CardTitle>Initialize REC Settings</CardTitle>
              <CardDescription>
                Set up default REC members and initial configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This action will create the following default REC members:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Dr. Maria Elena Santos - REC Chairperson</li>
                  <li>Dr. Robert Cruz - REC Vice Chairperson</li>
                  <li>Ms. Angela Torres - REC Secretary</li>
                  <li>Mr. John Reyes - REC Staff</li>
                  <li>Dr. Elena Garcia - REC Member (Medical Ethics)</li>
                  <li>Dr. Michael Lim - REC Member (Social Sciences)</li>
                </ul>
              </div>

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    REC settings have been successfully initialized! You can now manage the lineup in the REC Lineup tab.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleInitializeSettings}
                disabled={loading || success || !user}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Initializing...' : success ? 'Initialized Successfully' : 'Initialize REC Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
