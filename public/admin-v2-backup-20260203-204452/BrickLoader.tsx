import React from 'react';

// "Moving Bricks" Animation Component - Pure CSS Version
// CSS is now defined in index.html to ensure reliability
export const BrickLoader = () => {
  return (
    <div className="fixed bottom-0 right-0 pointer-events-none z-0 p-8 lg:p-12 opacity-30 mix-blend-screen">
      <svg width="120" height="120" viewBox="0 0 100 100" overflow="visible">
        {/* Set 1 */}
        <g>
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '0s' }} x="5" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '0.15s' }} x="53" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '0.3s' }} x="29" y="32" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>

        {/* Set 2 (Offset by 2s for continuous flow) */}
        <g>
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '2s' }} x="5" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '2.15s' }} x="53" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '2.3s' }} x="29" y="32" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};