"use client";

/* React Three Fiber extends JSX with Three.js element properties. */
/* eslint-disable react/no-unknown-property */

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import { useRef, useState } from "react";
import type { Mesh } from "three";

function Crystal() {
  const mesh = useRef<Mesh>(null);
  const [target, setTarget] = useState({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += (target.y * 0.45 - mesh.current.rotation.x) * delta * 2.4;
    mesh.current.rotation.y += (target.x * 0.7 - mesh.current.rotation.y) * delta * 2.4;
    mesh.current.rotation.z += delta * 0.12;
  });

  return (
    <group onPointerMove={(event) => setTarget({ x: event.pointer.x, y: event.pointer.y })}>
      <Float speed={1.25} rotationIntensity={0.16} floatIntensity={0.55}>
        <mesh ref={mesh} scale={1.65}>
          <icosahedronGeometry args={[1, 1]} />
          <MeshTransmissionMaterial
            backside
            thickness={0.65}
            chromaticAberration={0.08}
            anisotropy={0.35}
            distortion={0.24}
            distortionScale={0.55}
            temporalDistortion={0.15}
            transmission={0.92}
            roughness={0.08}
            ior={1.45}
            color="#72d8d2"
            emissive="#4d5eea"
            emissiveIntensity={0.45}
          />
        </mesh>
      </Float>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={2.65}>
        <torusGeometry args={[1, 0.008, 16, 96]} />
        <meshBasicMaterial color="#72d8d2" transparent opacity={0.48} />
      </mesh>
      <Sparkles count={90} scale={5} size={1.2} speed={0.28} color="#b8fff7" />
    </group>
  );
}

export default function CrystalScene() {
  return (
    <div className="crystal-stage" aria-label="คริสตัลสามมิติที่ตอบสนองต่อเมาส์" role="img">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 42 }} dpr={[1, 1.75]}>
        <color attach="background" args={["#101735"]} />
        <ambientLight intensity={1.3} />
        <pointLight position={[3, 3, 4]} intensity={22} color="#72d8d2" />
        <pointLight position={[-4, -2, 2]} intensity={16} color="#8278ff" />
        <Crystal />
      </Canvas>
      <div className="crystal-caption">move to explore / เลื่อนเพื่อสำรวจ</div>
    </div>
  );
}
