"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function StickyPet() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-50 cursor-pointer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", delay: 0.5 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Main Pet Character */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32">
        <Image
          src="/images/sticky2-removebg-preview.png"
          alt="Cute pet character"
          fill
          className="object-contain drop-shadow-2xl"
          priority
        />
        
        {/* Speech bubble on hover */}
        {isHovered && (
          <motion.div 
            className="absolute bottom-full right-0 mb-4 bg-white rounded-2xl px-4 py-2 shadow-lg whitespace-nowrap"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-medium text-gray-700">🐾 Hi there! 🐾</p>
            <div className="absolute bottom-0 right-4 translate-y-1/2 w-3 h-3 bg-white rotate-45" />
          </motion.div>
        )}
      </div>
      
      {/* Pulse ring effect */}
      <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping pointer-events-none" />
    </motion.div>
  );
}