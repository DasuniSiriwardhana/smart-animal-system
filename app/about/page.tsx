"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Heart, Shield, Users, Award, Sparkles, PawPrint, Linkedin, Mail, MapPin, GraduationCap, Code, Brain, Calendar, Github, Database, Cloud, Layout, Lock, BarChart, Activity, Cpu, Server } from 'lucide-react';

export default function AboutPage() {
  useEffect(() => {
    // Disable Print Screen key
    const disablePrintScreen = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        alert('📸 Screenshot protection is enabled!');
        e.preventDefault();
        return false;
      }
    };

    // Disable common screenshot shortcuts
    const disableShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
          (e.ctrlKey && e.key === 'p') ||
          (e.metaKey && e.shiftKey && e.key === 'S')) {
        e.preventDefault();
        alert('📸 Screenshot protection is enabled!');
        return false;
      }
    };

    window.addEventListener('keydown', disablePrintScreen);
    window.addEventListener('keydown', disableShortcuts);

    return () => {
      window.removeEventListener('keydown', disablePrintScreen);
      window.removeEventListener('keydown', disableShortcuts);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Navbar />
      
      {/* Floating Paw Prints Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Large floating paw prints */}
        <div className="absolute top-20 left-[5%] opacity-10 animate-float-slow">
          <PawPrint className="w-32 h-32 text-primary" />
        </div>
        <div className="absolute top-1/3 right-[8%] opacity-15 animate-float-medium">
          <PawPrint className="w-40 h-40 text-accent" />
        </div>
        <div className="absolute bottom-20 left-[15%] opacity-10 animate-float-fast">
          <PawPrint className="w-28 h-28 text-primary" />
        </div>
        
        {/* Medium floating paw prints */}
        <div className="absolute top-40 right-[20%] opacity-20 animate-bounce-slow">
          <PawPrint className="w-16 h-16 text-accent" />
        </div>
        <div className="absolute bottom-1/3 left-[25%] opacity-15 animate-bounce-medium">
          <PawPrint className="w-20 h-20 text-primary" />
        </div>
        <div className="absolute top-60 left-[40%] opacity-10 animate-float-medium">
          <PawPrint className="w-12 h-12 text-accent" />
        </div>
        
        {/* Small floating paw prints */}
        <div className="absolute bottom-40 right-[30%] opacity-20 animate-bounce-fast">
          <PawPrint className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute top-1/2 right-[45%] opacity-15 animate-float-fast">
          <PawPrint className="w-6 h-6 text-accent" />
        </div>
        <div className="absolute bottom-20 right-[10%] opacity-25 animate-bounce-slow">
          <PawPrint className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute top-32 left-[60%] opacity-10 animate-float-slow">
          <PawPrint className="w-14 h-14 text-accent" />
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 z-10">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Our Story</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Making Pet Care{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Smarter Together
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We&apos;re on a mission to help pet parents provide the best possible care 
              for their furry family members through innovative technology and AI-powered insights.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 z-10 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                To empower pet parents with real-time health insights and AI-driven recommendations, 
                making proactive pet care accessible to everyone.
              </p>
              <p className="text-muted-foreground">
                We believe every pet deserves the best care possible, and technology can bridge 
                the gap between pet owners and veterinary expertise.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 text-center"
            >
              <div className="flex justify-center mb-4">
                <Image
                  src="/images/navbarimage-removebg-preview.png"
                  alt="Pet care mission"
                  width={450}
                  height={100}
                  className="object-contain"
                />
              </div>
              <PawPrint className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="text-xl italic">
                &quot;Making pet care smarter, one paw at a time.&quot;
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30 z-10 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              What drives us every day
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: 'Compassion', description: 'We care deeply about every pet&apos;s wellbeing' },
              { icon: Shield, title: 'Trust', description: 'Building reliable, accurate health insights' },
              { icon: Users, title: 'Community', description: 'Connecting pet parents and experts' }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center hover:shadow-lg transition-all relative overflow-hidden group"
              >
                <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <PawPrint className="w-16 h-16" />
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Profile Section */}
<section className="py-16 z-10 relative">
  <div className="container mx-auto px-4">
    <motion.div 
      className="text-center mb-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-3xl font-bold mb-4">Meet the Developer</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        The passionate mind behind Smart Animal System
      </p>
    </motion.div>

    <div className="grid md:grid-cols-2 gap-12 items-center">
      {/* Photo Section with Abstract Art Background */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative flex justify-center"
      >
        {/* Abstract Background Elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl animate-pulse delay-1000" />
        
        {/* Floating Paw Prints around photo */}
        <div className="absolute -top-8 -right-8 opacity-60 animate-float-slow">
          <PawPrint className="w-10 h-10 text-accent" />
        </div>
        <div className="absolute -bottom-8 -left-8 opacity-60 animate-float-medium">
          <PawPrint className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute top-1/2 -left-12 opacity-40 animate-bounce-slow">
          <PawPrint className="w-8 h-8 text-accent" />
        </div>
        <div className="absolute top-1/3 -right-12 opacity-40 animate-bounce-medium">
          <PawPrint className="w-8 h-8 text-primary" />
        </div>
        
        {/* Decorative circles */}
        <div className="absolute top-1/4 -left-6 w-12 h-12 rounded-full border-2 border-accent/30 animate-ping" />
        <div className="absolute bottom-1/4 -right-6 w-12 h-12 rounded-full border-2 border-primary/30 animate-pulse" />
        
              
        {/* Main Photo Frame with Gradient Border */}
        <div className="relative group">
          {/* Animated gradient border ring */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full opacity-75 group-hover:opacity-100 blur-md transition duration-1000 group-hover:duration-200 animate-spin-slow" />
          
          <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 p-1 shadow-xl">
            <div className="relative w-full h-full rounded-full overflow-hidden select-none">
              <Image
                src="/images/Dasuni.png"
                alt="Dasuni Siriwardhana"
                fill
                className="object-cover rounded-full"
                draggable={false}
                onContextMenu={(e) => {
                  e.preventDefault();
                  alert("📸 Photo protection enabled! Screenshots are disabled.");
                  return false;
                }}
                onDragStart={(e) => {
                  e.preventDefault();
                  return false;
                }}
              />
              <div className="absolute inset-0 bg-transparent pointer-events-none" />
            </div>
          </div>
          
          {/* Bottom decoration */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white flex items-center gap-1 whitespace-nowrap z-10">
            <Shield className="h-3 w-3" />
            Protected
          </div>
        </div>
        
        {/* Abstract tech elements around photo */}
        <div className="absolute top-0 right-0 text-xs font-mono text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity">
          &lt;/&gt;
        </div>
        <div className="absolute bottom-0 left-0 text-xs font-mono text-accent/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {'{ }'}
        </div>
      </motion.div>
      
      {/* Developer Info */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-2">Dasuni Siriwardhana</h2>
        <p className="text-accent font-medium mb-4">Full Stack Developer & AI Enthusiast</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>Data Science Student at ESOFT (ESU) Kandy</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Code className="h-5 w-5 text-primary" />
            <span>Software Engineering Student</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Brain className="h-5 w-5 text-primary" />
            <span>AI & Machine Learning Enthusiast</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Kandy, Sri Lanka</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Student at ESOFT Metro Campus Kandy</span>
          </div>
        </div>
        
        <div className="prose prose-sm dark:prose-invert mb-6">
          <p className="text-muted-foreground">
            I&apos;m a passionate data science and software engineering student at ESOFT Kandy, 
            dedicated to building innovative solutions that make a difference. The Smart Animal System 
            is my vision to combine AI, IoT, and pet care into one seamless platform.
          </p>
          <p className="text-muted-foreground mt-2">
            With expertise in full-stack development, machine learning, and database management, 
            I created this platform to help pet parents monitor their furry friends&apos; health 
            with cutting-edge technology.
          </p>
        </div>
        
        {/* Social Links */}
        <div className="flex flex-wrap gap-4">
          <Link 
            href="https://www.linkedin.com/in/dasuni-siriwardhana/" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#0077B5]/80 transition-colors"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Link>
          <Link 
            href="mailto:siriwardhanadasuni183@gmail.com"
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Mail className="h-4 w-4 text-primary" />
            Email
          </Link>
          <Link 
            href="https://github.com/dasunii" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Github className="h-4 w-4 text-primary" />
            GitHub
          </Link>
        </div>
      </motion.div>
    </div>
  </div>
</section>

      {/* Technologies Used Section - UPDATED with all technologies */}
      <section className="py-16 bg-muted/30 z-10 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Technologies Used</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with modern technologies to deliver the best pet care experience
            </p>
          </motion.div>

          {/* Frontend Technologies */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Frontend
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'Next.js 15', icon: '⚛️', color: 'from-blue-500 to-cyan-500', desc: 'React Framework' },
                { name: 'TypeScript', icon: '📘', color: 'from-blue-600 to-blue-400', desc: 'Type Safety' },
                { name: 'Tailwind CSS', icon: '🎨', color: 'from-cyan-600 to-blue-500', desc: 'Styling' },
                { name: 'Framer Motion', icon: '🎭', color: 'from-purple-500 to-pink-500', desc: 'Animations' },
                { name: 'Recharts', icon: '', color: 'from-green-500 to-emerald-500', desc: 'Data Visualization' },
                { name: 'Lucide Icons', icon: '✨', color: 'from-yellow-500 to-orange-500', desc: 'Icons' },
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="bg-card rounded-xl p-3 text-center hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div className={`text-2xl mb-1 inline-block p-2 rounded-full bg-gradient-to-br ${tech.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    {tech.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Backend & Database */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Backend & Database
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { name: 'Supabase', icon: '🔥', color: 'from-green-600 to-emerald-500', desc: 'Database & Auth' },
                { name: 'PostgreSQL', icon: '🐘', color: 'from-blue-600 to-indigo-500', desc: 'Database' },
                { name: 'FastAPI', icon: '🚀', color: 'from-teal-500 to-green-500', desc: 'API Framework' },
                { name: 'Python', icon: '🐍', color: 'from-yellow-500 to-green-500', desc: 'Backend Language' },
                { name: 'REST API', icon: '🔗', color: 'from-purple-500 to-pink-500', desc: 'API Architecture' },
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="bg-card rounded-xl p-3 text-center hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div className={`text-2xl mb-1 inline-block p-2 rounded-full bg-gradient-to-br ${tech.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    {tech.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI & Machine Learning */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI & Machine Learning
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { name: 'TensorFlow', icon: '🧠', color: 'from-orange-500 to-red-500', desc: 'Deep Learning' },
                { name: 'Keras', icon: '🔬', color: 'from-red-500 to-orange-500', desc: 'Neural Networks' },
                { name: 'LSTM', icon: '📈', color: 'from-purple-500 to-pink-500', desc: 'Time Series' },
                { name: 'EfficientNet', icon: '🖼️', color: 'from-blue-500 to-cyan-500', desc: 'Image Classification' },
                { name: 'Random Forest', icon: '🌲', color: 'from-green-500 to-emerald-500', desc: 'Regression' },
                { name: 'Scikit-learn', icon: '📐', color: 'from-yellow-500 to-orange-500', desc: 'ML Library' },
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="bg-card rounded-xl p-3 text-center hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div className={`text-2xl mb-1 inline-block p-2 rounded-full bg-gradient-to-br ${tech.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    {tech.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Data & Analytics */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Data & Analytics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { name: 'Google Looker Studio', icon: '', color: 'from-yellow-500 to-orange-500', desc: 'Data Visualization' },
                { name: 'Pandas', icon: '🐼', color: 'from-blue-500 to-purple-500', desc: 'Data Analysis' },
                { name: 'NumPy', icon: '🔢', color: 'from-blue-600 to-cyan-500', desc: 'Numerical Computing' },
                { name: 'Matplotlib', icon: '📉', color: 'from-green-500 to-teal-500', desc: 'Plotting' },
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="bg-card rounded-xl p-3 text-center hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div className={`text-2xl mb-1 inline-block p-2 rounded-full bg-gradient-to-br ${tech.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    {tech.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Deployment & DevOps */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Deployment & DevOps
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { name: 'Vercel', icon: '▲', color: 'from-gray-700 to-black', desc: 'Frontend Hosting' },
                { name: 'Google Colab', icon: '📓', color: 'from-yellow-500 to-orange-500', desc: 'ML Training' },
                { name: 'ngrok', icon: '🔌', color: 'from-blue-500 to-cyan-500', desc: 'API Tunneling' },
                { name: 'Git', icon: '📝', color: 'from-orange-500 to-red-500', desc: 'Version Control' },
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="bg-card rounded-xl p-3 text-center hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div className={`text-2xl mb-1 inline-block p-2 rounded-full bg-gradient-to-br ${tech.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    {tech.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Total Technologies Count */}
      <section className="py-8 z-10 relative">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-6 py-3"
          >
            <Award className="h-5 w-5 text-primary" />
            <span className="font-medium">Powered by 25+ Modern Technologies</span>
          </motion.div>
        </div>
      </section>
    </div>
  );
}