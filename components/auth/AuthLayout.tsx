"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  type: 'signin' | 'signup';
}

export function AuthLayout({ children, type }: AuthLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use a timeout to avoid the setState warning
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const isSignIn = type === 'signin';

  // Different images for each page
  const imageSrc = isSignIn 
    ? '/images/signin2.jpg'  // Replace with your image
    : '/images/signup.jpg'; // Replace with your image

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <div className="container mx-auto px-4 py-8 h-screen flex items-center justify-center">
        <div className="relative w-full max-w-6xl">
          {/* Main Card with morphing effect */}
          <motion.div 
            className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row min-h-[600px]">
              
              {/* Image Section - Changes side based on signin/signup */}
              <motion.div 
                className={`hidden md:block w-full md:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 ${
                  isSignIn ? 'order-last' : 'order-first'
                }`}
                initial={{ x: isSignIn ? 50 : -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                <Image
  src={imageSrc}
  alt="Pet"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"  
  className="object-cover transition-transform duration-700 hover:scale-110"
  priority
/>
                
                {/* Decorative overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 mix-blend-overlay" />
                
                {/* Quote or text overlay */}
                <div className="absolute bottom-8 left-8 right-8 z-20 text-white">
                  <p className="text-xl font-semibold italic">
                    {isSignIn 
                      ? "Welcome back! Your furry friend misses you."
                      : "Join us! Start your pet's health journey today."
                    }
                  </p>
                  <p className="text-sm opacity-80 mt-2">
                    Smart Animal System
                  </p>
                </div>
              </motion.div>

              {/* Form Section with Morph Transition */}
              <motion.div 
                className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {/* Morphing Title */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                  >
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {isSignIn ? 'Welcome Back!' : 'Create Account'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      {isSignIn 
                        ? 'Sign in to access your pet\'s dashboard'
                        : 'Join thousands of happy pet parents'
                      }
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Form Content with Morph Transition */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, x: isSignIn ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isSignIn ? 20 : -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>

                {/* Switch Link */}
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm text-muted-foreground">
                    {isSignIn ? "Don't have an account?" : "Already have an account?"}
                    {' '}
                    <Link 
                      href={isSignIn ? '/signup' : '/login'}
                      className="text-primary hover:text-accent font-semibold transition-colors"
                    >
                      {isSignIn ? 'Sign Up' : 'Sign In'}
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Decorative floating elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>
    </div>
  );
}