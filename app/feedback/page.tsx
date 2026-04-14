"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Lightbulb, Bug, Heart, Star } from 'lucide-react';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            We Value Your{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Feedback
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us improve Smart Animal System. Your feedback makes a difference!
          </p>
        </motion.div>

        <motion.div 
          className="bg-card rounded-2xl p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" placeholder="David Warner" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" required className="mt-1.5" />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Feedback Type</Label>
              <Select>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">💡 Suggestion / Idea</SelectItem>
                  <SelectItem value="bug">🐛 Bug Report</SelectItem>
                  <SelectItem value="feature">✨ Feature Request</SelectItem>
                  <SelectItem value="general">💬 General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rating">Rating (Optional)</Label>
              <div className="flex gap-2 mt-2">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} type="button" className="hover:scale-110 transition-transform">
                    <Star className="h-6 w-6 text-muted-foreground hover:text-accent" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="message">Your Feedback</Label>
              <Textarea 
                id="message" 
                placeholder="Tell us what you think, what features you'd like to see, or any issues you've encountered..."
                rows={6}
                required 
                className="mt-1.5"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? 'Sending...' : <><Send className="h-4 w-4" /> Submit Feedback</>}
            </Button>

            {submitted && (
              <p className="text-green-600 text-center"> Thank you for your feedback! We appreciate your input.</p>
            )}
          </form>
        </motion.div>

        {/* Thank you note */}
        <motion.div 
          className="text-center mt-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p>Every feedback is read by our team and helps shape the future of Smart Animal System.</p>
        </motion.div>
      </div>
    </div>
  );
}