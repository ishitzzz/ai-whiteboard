import React, { useState } from 'react';
import { CanvasInterceptor } from './utils/CanvasInterceptor';
import { applyHumanKinematics } from './utils/kinematicEngine';
import { Chalkboard } from './components/Chalkboard';
import type { KinematicCoordinate } from './types/engine';

function App() {
  const [path, setPath] = useState<KinematicCoordinate[]>([]);
  const [concept, setConcept] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    
    setIsGenerating(true);
    // Clear previous drawing immediately
    setPath([]);
    
    try {
      const response = await fetch('http://localhost:8000/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept })
      });
      
      if (!response.body) {
        throw new Error("ReadableStream not yet supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedCode = "";
      const interceptor = new CanvasInterceptor();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedCode += chunk;
        
        let codeToExecute = accumulatedCode;
        // If backend was not restarted, it sends a JSON object with 'code' at the end.
        // We gracefully try to extract it to prevent a forever-SyntaxError.
        try {
          const parsed = JSON.parse(accumulatedCode);
          if (parsed.code) codeToExecute = parsed.code;
        } catch (e) {
          // Normal behavior: it's not JSON, it's a raw JS stream.
        }

        try {
          // AI might stream backticks split across chunks, which backend replace misses. 
          // We must clean the string here before evaluating.
          const cleanedCode = codeToExecute
            .replace(/```(?:javascript|js)?\n?/g, "")
            .replace(/```/g, "")
            .replace(/\{\{[\w_]+\}\}/g, "");

          // Extract raw coordinates safely from the procedural JS string
          const rawPath = interceptor.execute(cleanedCode);
          // Process physics: velocity, tapering, overshoots
          const processedPath = applyHumanKinematics(rawPath);
          // Trigger render loop (Chalkboard pathRef will pick it up)
          setPath(processedPath);
        } catch (execError) {
          // SyntaxError is expected due to an incomplete stream chunk.
          // The interceptor gracefully falls back to the last valid path.
          // We ignore the error and wait for the next chunk to complete the statement.
        }
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
      alert("Failed to connect to the backend server or processing error. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#1e1e1e' }}>
      
      {/* The Core Render Layer */}
      <Chalkboard kinematicPath={path} />

      {/* The UI Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        background: 'rgba(25, 25, 25, 0.7)',
        backdropFilter: 'blur(12px)',
        padding: '16px 32px',
        borderRadius: '50px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 10
      }}>
        <input 
          type="text" 
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
          placeholder="What should I draw? (e.g. A right triangle)"
          disabled={isGenerating}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontSize: '16px',
            padding: '8px 12px',
            width: '350px',
            outline: 'none',
            fontFamily: 'sans-serif',
            transition: 'border-color 0.2s ease'
          }}
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !concept.trim()}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0, 255, 204, 0.4)',
            color: '#00ffcc',
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 24px',
            borderRadius: '24px',
            cursor: (isGenerating || !concept.trim()) ? 'not-allowed' : 'pointer',
            opacity: (isGenerating || !concept.trim()) ? 0.5 : 1,
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {isGenerating ? "Thinking..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

export default App;
