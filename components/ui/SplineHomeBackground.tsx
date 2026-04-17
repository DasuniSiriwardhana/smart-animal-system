"use client";

import { useState, useEffect } from 'react';

export function SplineHomeBackground() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY <= 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 right-0 w-full md:w-1/2 h-screen z-0 pointer-events-none">
      <iframe
        src="https://my.spline.design/hanastarterfile-s7Tf8jMOVIqVZZOxHWO0ZDsF-hZd/"
        className="absolute inset-0 w-full h-full"
        style={{ 
          border: 'none',
          opacity: 0.8
        }}
        title="Spline 3D Animation"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
      
      {/* Overlay matching your page background color */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: '#F5F0E8',
          opacity: 0.3,
          mixBlendMode: 'color'
        }}
      />
    </div>
  );
}