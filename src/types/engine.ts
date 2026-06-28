/**
 * Core foundational interfaces for the Whiteboard Architecture.
 * 
 * Pipeline:
 * 1. Director (LLM) -> procedural canvas API code
 * 2. Extractor (Mock Canvas) -> intercepts calls -> RawCoordinate[]
 * 3. Kinematic Engine -> calculates physics/overshoots -> KinematicCoordinate[]
 * 4. Renderer -> draws to screen
 */

/**
 * Commands intercepted from the Director's simulated Canvas API execution.
 */
export type CanvasCommandType = 
  | 'moveTo' 
  | 'lineTo' 
  | 'bezierCurveTo' 
  | 'quadraticCurveTo' 
  | 'beginPath' 
  | 'closePath' 
  | 'stroke' 
  | 'fill';

/**
 * THE EXTRACTOR PAYLOAD
 * A raw coordinate extracted directly from the Director's output.
 * These are the mathematical anchor points before any kinematic processing.
 */
export interface RawCoordinate {
  // Absolute position
  x: number;
  y: number;
  
  // The Canvas API operation that generated this point
  commandType: CanvasCommandType;
  
  // Optional control points for bezier/quadratic curves
  cp1x?: number;
  cp1y?: number;
  cp2x?: number;
  cp2y?: number;
  
  // High-resolution timestamp of when this point was "drawn" by the Extractor
  timestamp: number;
}

/**
 * THE KINEMATIC ENGINE PAYLOAD
 * A processed coordinate that has passed through the Kinematic Engine.
 * It contains movement physics like velocity, acceleration, curvature, and organic imperfections.
 */
export interface KinematicCoordinate {
  // Base coordinates (may be slightly perturbed for organic feel)
  x: number;
  y: number;
  
  // The instantaneous velocity calculated via the Two-Thirds Power Law
  // V = k * R^(1/3) where R is the radius of curvature.
  // Straight lines -> accelerate; Sharp curves -> decelerate.
  velocity: number;
  
  // Local curvature at this specific point.
  curvature: number;
  
  // The calculated overshoot displacement to apply for sharp corners
  // mimicking human momentum and wrist flick.
  overshootX: number;
  overshootY: number;

  // The intended pressure/thickness of the stroke at this point.
  // Directly inversely correlated to velocity (faster = thinner line).
  pressure: number;
}

/**
 * A continuous stroke of processed points ready for the Renderer.
 */
export interface Stroke {
  id: string;
  color: string; // The neon high-contrast color chosen by the Director
  points: KinematicCoordinate[];
  isComplete: boolean;
}
