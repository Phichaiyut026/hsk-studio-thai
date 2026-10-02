"use client";
/* eslint-disable react/no-unknown-property -- React Three Fiber JSX props (position, intensity, args...) */

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Text } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense } from "react";
import * as THREE from "three";

interface FloatingHanziProps {
  char: string;
  position: [number, number, number];
  color: string;
  delay: number;
}

function FloatingHanzi({ char, position, color, delay }: FloatingHanziProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + delay) * 0.2;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text
          // Noto Sans SC Bold, subset to only the glyphs rendered here (学中文好) to keep it tiny
          font="/fonts/hanzi-hero.ttf"
          fontSize={1.5}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#f7f3ec" // --page background color to blend edge
        >
          {char}
          <meshStandardMaterial attach="material" color={color} roughness={0.3} metalness={0.2} />
        </Text>
      </Float>
    </group>
  );
}

export default function Hanzi3DBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Delay rendering 3D until after initial animations to prevent stutter
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const characters = [
    { char: "学", pos: [-4, 2, -2], color: "#22806b", delay: 0 }, // --teal
    { char: "中", pos: [4, 1, -3], color: "#dd4b39", delay: 1 },  // --red
    { char: "文", pos: [-3, -2, -1], color: "#2f6db5", delay: 2 }, // --blue
    { char: "好", pos: [3, -1, -2], color: "#f29f05", delay: 3 }, // --gold
  ];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-1000" aria-hidden="true" style={{ opacity: isMounted ? 0.6 : 0 }}>
      {isMounted && (
        <Canvas 
          camera={{ position: [0, 0, 8], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: "high-performance", antialias: false }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
          
          <Suspense fallback={null}>
            {characters.map((c, i) => (
              <FloatingHanzi 
                key={i} 
                char={c.char} 
                position={c.pos as [number, number, number]} 
                color={c.color} 
                delay={c.delay} 
              />
            ))}
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
