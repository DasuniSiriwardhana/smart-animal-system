"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Loader2, ExternalLink } from 'lucide-react';

export default function MarketAnalysisPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
        // Your actual Looker Studio embed URL
        setEmbedUrl('https://lookerstudio.google.com/embed/reporting/2b9f6883-c894-486f-ad6a-92c70c9d79cd/page/bDquF');
      }
      setLoading(false);
    };

    checkAdminAndLoad();
  }, [user]);

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Market Analysis Dashboard</h1>
            <p className="text-muted-foreground">
              Sales trends, brand performance, and ML predictions (auto-refreshes every 15 minutes)
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://lookerstudio.google.com', '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Looker Studio
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <iframe
              src={embedUrl}
              width="100%"
              height="800px"
              frameBorder="0"
              allowFullScreen
              title="Market Analysis Dashboard"
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}