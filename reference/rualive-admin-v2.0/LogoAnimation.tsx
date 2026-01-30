import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const RuaLogo = ({ className = "" }: { className?: string }) => {
  const lineRef = useRef<SVGPathElement>(null);
  
  useEffect(() => {
    if (lineRef.current) {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
      tl.fromTo(lineRef.current, 
        { strokeDasharray: 400, strokeDashoffset: 400, opacity: 0.5 },
        { strokeDashoffset: 0, opacity: 1, duration: 1.2, ease: "power2.out" }
      ).to(lineRef.current, 
        { opacity: 0.6, duration: 0.8 }
      );
    }
  }, []);

  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M55 130 L90 35 Q100 10 110 35 L145 130" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      <path d="M10 95 H 45 L 60 65 L 80 115 L 100 55 L 115 95 H 190" stroke="#050505" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path ref={lineRef} d="M10 95 H 45 L 60 65 L 80 115 L 100 55 L 115 95 H 190" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};