import React, { useEffect, useRef } from 'react';
import type { KinematicCoordinate } from '../types/engine';

interface ChalkboardProps {
  kinematicPath: KinematicCoordinate[];
}

export const Chalkboard: React.FC<ChalkboardProps> = ({ kinematicPath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pathRef = useRef<KinematicCoordinate[]>([]);

  useEffect(() => {
    pathRef.current = kinematicPath;
  }, [kinematicPath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let currentIndex = 0;
    let progress = 0;

    const playDrawing = () => {
      // Ensure canvas size always matches its displayed CSS size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const currentPath = pathRef.current;
      
      if (currentPath.length === 0) {
        animationFrameId = requestAnimationFrame(playDrawing);
        return;
      }

      // --- 1. State Advancement (Two-Thirds Power Law Physics) ---
      // If we've reached the end of the available path, we pause and wait for more (streaming)
      if (currentIndex >= currentPath.length) {
         // Draw ghost cursor at last known position
         const lastPoint = currentPath[currentPath.length - 1];
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         ctx.fillStyle = '#1e1e1e';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         
         ctx.lineCap = 'round';
         ctx.lineJoin = 'round';
         
         // Redraw everything up to the end
         for (let i = 1; i < currentPath.length; i++) {
           const p1 = currentPath[i - 1];
           const p2 = currentPath[i];
           if (p2.velocity === 0) continue;
           
           ctx.beginPath();
           const startX = p1.x + (p1.overshootX || 0);
           const startY = p1.y + (p1.overshootY || 0);
           const endX = p2.x + (p2.overshootX || 0);
           const endY = p2.y + (p2.overshootY || 0);
           
           ctx.moveTo(startX, startY);
           ctx.lineTo(endX, endY);
           ctx.lineWidth = 1 + (p2.pressure * 3);
           ctx.strokeStyle = '#00ffcc';
           ctx.stroke();
         }
         
         // Draw ghost cursor
         const cursorX = lastPoint.x + (lastPoint.overshootX || 0);
         const cursorY = lastPoint.y + (lastPoint.overshootY || 0);
         ctx.beginPath();
         ctx.arc(cursorX, cursorY, 6, 0, Math.PI * 2);
         ctx.lineWidth = 2;
         ctx.strokeStyle = '#ffffff';
         ctx.stroke();

         animationFrameId = requestAnimationFrame(playDrawing);
         return;
      }
      
      const currentPoint = currentPath[currentIndex];
      
      // If velocity is 0, it's a teleportation (moveTo jump). Advance instantly.
      if (currentPoint.velocity === 0) {
        currentIndex++;
        progress = 0;
      } else {
        // Accumulate velocity to progress
        progress += currentPoint.velocity;
        
        // Consume points while progress is >= 1.0
        while (progress >= 1.0 && currentIndex < currentPath.length - 1) {
          currentIndex++;
          progress -= 1.0;
        }
      }

      // Ensure we don't go out of bounds
      if (currentIndex >= currentPath.length) {
        currentIndex = currentPath.length - 1;
      }

      // --- 2. Screen Clear ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- 3. The Path Rendering ---
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Replay the history of the stroke up to the current simulated index
      for (let i = 1; i <= currentIndex; i++) {
        const p1 = currentPath[i - 1];
        const p2 = currentPath[i];

        // Velocity 0 indicates a moveTo jump, so no line segment should connect p1 to p2
        if (p2.velocity === 0) continue;

        ctx.beginPath();
        
        // We apply the mathematical overshoots to the visual coordinates so the strokes visibly extend
        const startX = p1.x + (p1.overshootX || 0);
        const startY = p1.y + (p1.overshootY || 0);
        const endX = p2.x + (p2.overshootX || 0);
        const endY = p2.y + (p2.overshootY || 0);
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        // Dynamically adjust line width based on pressure (higher pressure = thicker bleed)
        // pressure runs 0.3 (fast) -> 1.0 (slow)
        ctx.lineWidth = 1 + (p2.pressure * 3);
        ctx.strokeStyle = '#00ffcc'; // Bright neon contrast color
        ctx.stroke();
      }

      // --- 4. The Ghost Cursor (Marker Tip) ---
      const activePoint = currentPath[currentIndex];
      const cursorX = activePoint.x + (activePoint.overshootX || 0);
      const cursorY = activePoint.y + (activePoint.overshootY || 0);
      
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 6, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Loop naturally continues to wait for more stream
      animationFrameId = requestAnimationFrame(playDrawing);
    };

    // Kickoff the loop
    playDrawing();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1e1e1e'
      }}
    />
  );
};
