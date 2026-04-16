import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

export interface AttackData {
  id: string;
  sourceLatLng: [number, number]; // [lat, lng]
  targetLatLng: [number, number];
  sourceIp: string;
  countryCode: string;
  timestamp: string;
}

const GLOBE_RADIUS = 2;

// --- Utility Functions ---
const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

const getColorForType = () => {
  return '#ff2d2d'; // default volumetric red color
};

const getPulseSpeed = (seed: string) => {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return 0.005 + ((hash % 5000) / 5000) * 0.005;
};

// --- Components ---

const Earth = () => {
  // Using a public higher-res earth texture
  const colorMap = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
  
  return (
    <group>
      {/* Main Earth Sphere */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          map={colorMap}
          color="#dbe8ff"
          roughness={0.4}
          metalness={0.05}
          emissive="#17345d"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Atmospheric Glow */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.05, 64, 64]} />
        <meshBasicMaterial 
          color="#0066ff" 
          transparent={true} 
          opacity={0.22} 
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

interface AttackArcProps {
  attack: AttackData;
}

const AttackArc: React.FC<AttackArcProps> = ({ attack }) => {
  const { sourceLatLng, targetLatLng } = attack;
  const color = getColorForType();
  const [hovered, setHovered] = useState(false);
  
  // Calculate curves
  const { curve, linePoints, startPos, endPos } = useMemo(() => {
    const start = latLonToVector3(sourceLatLng[0], sourceLatLng[1], GLOBE_RADIUS);
    const end = latLonToVector3(targetLatLng[0], targetLatLng[1], GLOBE_RADIUS);
    
    // Calculate distance to determine arc height
    const distance = start.distanceTo(end);
    const midPoint = start.clone().lerp(end, 0.5);
    
    // Push the midpoint outwards based on distance
    const heightOffset = Math.max(0.2, distance * 0.4);
    const controlPoint = midPoint.normalize().multiplyScalar(GLOBE_RADIUS + heightOffset);

    const quadCurve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
    return {
      curve: quadCurve,
      linePoints: quadCurve.getPoints(50),
      startPos: start,
      endPos: end
    };
  }, [sourceLatLng, targetLatLng]);

  // Pulse animation state
  const pulseRef = useRef<THREE.Mesh>(null);
  const targetRingRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);
  const pulseSpeed = getPulseSpeed(attack.id);

  useFrame(() => {
    if (!pulseRef.current) return;
    
    // Update progress
    setProgress((p) => {
      let nextP = p + pulseSpeed;
      if (nextP > 1) nextP = 0; // loop
      return nextP;
    });

    // Position pulse
    const point = curve.getPointAt(progress);
    pulseRef.current.position.copy(point);

    // Animate target ring (pulse scale)
    if (targetRingRef.current) {
      const scale = 1 + (progress * 2);
      targetRingRef.current.scale.set(scale, scale, scale);
      (targetRingRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
    }
  });

  return (
    <group 
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* The Arc Line */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={0.6}
      />

      {/* The traveling Pulse Dot */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Source Marker */}
      <mesh position={startPos}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#ffe066" />
      </mesh>

      {/* Target Marker Ring */}
      <mesh ref={targetRingRef} position={endPos}>
        <torusGeometry args={[0.04, 0.01, 8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={1} />
        {/* Make ring face outward from globe center roughly */}
        <group rotation={[Math.PI/2, 0, 0]} />
      </mesh>

      {/* Tooltip on Hover */}
      {hovered && (
        <Html position={curve.getPointAt(0.5)} center style={{ pointerEvents: 'none' }}>
          <div className="globe-tooltip volumetric">
            <div className="tooltip-row">
              <span className="tooltip-label">Source IP</span>
              <span className="tooltip-value">{attack.sourceIp}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Country</span>
              <span className="tooltip-value">{attack.countryCode}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Target</span>
              <span className="tooltip-value">{attack.targetLatLng[0].toFixed(2)}, {attack.targetLatLng[1].toFixed(2)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Time</span>
              <span className="tooltip-value">{new Date(attack.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Main Scene ---

interface GlobeSceneProps {
  attacks: AttackData[];
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({ attacks }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startInteraction = () => {
    setAutoRotate(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const endInteraction = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAutoRotate(true);
    }, 3000); // Resume auto-rotate after 3s of inactivity
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <color attach="background" args={['#020205']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.45} color="#dbe8ff" />
      <hemisphereLight args={['#9cc7ff', '#08111f', 0.85]} />
      <directionalLight position={[5, 3, 5]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-4, 1, 3]} intensity={0.9} color="#72b7ff" />
      <pointLight position={[0, 0, 6]} intensity={0.75} distance={16} color="#9fd3ff" />

      {/* Background Starfield */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Globe Group to handle overall rotation possibly later, for now OrbitControls does it */}
      <group>
        <React.Suspense fallback={null}>
          <Earth />
        </React.Suspense>

        {/* Render Attack Arcs */}
        {attacks.map((attack) => (
          <AttackArc key={attack.id} attack={attack} />
        ))}
      </group>

      {/* Controls */}
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={12}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        onStart={startInteraction}
        onEnd={endInteraction}
      />
    </Canvas>
  );
};
