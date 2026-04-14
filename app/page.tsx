"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/layout/navbar';
import { 
  PawPrint, 
  Heart, 
  Activity, 
  Shield, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';

type User = {
  id: string;
  email: string;
  name?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
        });
      } else {
        setUser(null);
      }
      setLoading(false);  
    }
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


 

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      {/* Hero Section with Abstract Art & Paw Prints */}
      <section className="relative overflow-hidden py-20 min-h-[600px] flex items-center">
        {/* Abstract Background with Paw Prints */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
          
          <div className="absolute top-10 left-[10%] opacity-20 animate-float-slow">
            <PawPrint className="w-32 h-32 text-primary" />
          </div>
          <div className="absolute bottom-20 right-[15%] opacity-15 animate-float-medium">
            <PawPrint className="w-40 h-40 text-accent" />
          </div>
          <div className="absolute top-1/3 right-[5%] opacity-10 animate-float-fast">
            <PawPrint className="w-24 h-24 text-primary" />
          </div>
          
          <div className="absolute top-40 left-[20%] opacity-30 animate-bounce-slow">
            <PawPrint className="w-12 h-12 text-accent" />
          </div>
          <div className="absolute bottom-32 left-[30%] opacity-25 animate-bounce-medium">
            <PawPrint className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute top-60 right-[25%] opacity-20 animate-bounce-fast">
            <PawPrint className="w-10 h-10 text-accent" />
          </div>
          <div className="absolute bottom-40 right-[40%] opacity-15 animate-float-slow">
            <PawPrint className="w-14 h-14 text-primary" />
          </div>
          
          <div className="absolute top-20 right-[20%] w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-[5%] w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse delay-1000" />
          
          <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" 
              fill="currentColor" className="text-accent/20" />
          </svg>
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse z-0" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000 z-0" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Content */}
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">AI-Powered Pet Care</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                Smart Care for{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Happy Pets
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                Monitor your pet&apos;s health with AI-powered insights, real-time sensor data, and smart feeding schedules.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent text-white shadow-lg">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="gap-2">
                    Sign In
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-border">
                <div>
                  <p className="text-2xl font-bold text-primary">1K+</p>
                  <p className="text-sm text-muted-foreground">Happy Pets</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">99%</p>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">Monitoring</p>
                </div>
              </div>
            </motion.div>
            
            {/* Right Side - Abstract art */}
            <motion.div 
              className="flex-1 hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative w-full h-96 lg:h-[500px] flex items-center justify-center">
                <div className="absolute w-64 h-64 rounded-full border-2 border-accent/20 animate-ping" />
                <div className="absolute w-48 h-48 rounded-full border-2 border-primary/30 animate-pulse" />
                <div className="absolute w-32 h-32 rounded-full bg-accent/20 animate-bounce-slow" />
                
                <PawPrint className="relative z-10 w-24 h-24 text-primary/40 animate-float-slow" />
                
                <div className="absolute -top-10 left-1/2 animate-float-medium">
                  <PawPrint className="w-8 h-8 text-accent/50" />
                </div>
                <div className="absolute bottom-0 left-0 animate-bounce-medium">
                  <PawPrint className="w-6 h-6 text-primary/50" />
                </div>
                <div className="absolute top-1/3 -right-5 animate-float-fast">
                  <PawPrint className="w-10 h-10 text-accent/40" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Smart Animal?
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to keep your pet healthy and happy in one place
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Health Monitoring',
                description: 'Track vital signs, activity levels, and receive AI-powered health insights in real-time.'
              },
              {
                icon: Activity,
                title: 'Smart Feeding',
                description: 'Schedule meals, track portions, and get reminders for your pet&apos;s feeding times.'
              },
              {
                icon: Shield,
                title: 'AI Disease Detection',
                description: 'Upload photos for instant AI analysis and early detection of potential health issues.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-card rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-8 md:p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Give Your Pet the Best Care?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join thousands of happy pet parents using Smart Animal System
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent text-white">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}