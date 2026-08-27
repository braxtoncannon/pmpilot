"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Planet() {
  const planet = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (planet.current) {
      planet.current.rotation.y += delta * 0.07;
    }

    if (ring.current) {
      ring.current.rotation.z += delta * 0.035;
    }
  });

  return (
    <Float speed={1} floatIntensity={0.3} rotationIntensity={0.1}>
      <group position={[4.2, 0.5, -4]}>
        <mesh ref={planet}>
          <sphereGeometry args={[1.65, 64, 64]} />

          <meshStandardMaterial
            color="#082f49"
            emissive="#0891b2"
            emissiveIntensity={0.35}
            roughness={0.6}
            metalness={0.25}
          />
        </mesh>

        <mesh scale={1.08}>
          <sphereGeometry args={[1.65, 64, 64]} />

          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
          />
        </mesh>

        <mesh ref={ring} rotation={[1.2, 0.3, 0]}>
          <torusGeometry args={[2.45, 0.025, 16, 160]} />

          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0.5}
          />
        </mesh>

        <mesh rotation={[1.2, 0.3, 0]}>
          <torusGeometry args={[2.9, 0.012, 16, 160]} />

          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}

function ShootingStar({
  start,
  speed,
  delay,
}: {
  start: [number, number, number];
  speed: number;
  delay: number;
}) {
  const star = useRef<THREE.Group>(null);
  const timer = useRef(delay);

  useFrame((_, delta) => {
    if (!star.current) return;

    if (timer.current > 0) {
      timer.current -= delta;
      star.current.visible = false;
      return;
    }

    star.current.visible = true;
    star.current.position.x += delta * speed;
    star.current.position.y -= delta * speed * 0.35;

    if (
      star.current.position.x > 10 ||
      star.current.position.y < -7
    ) {
      star.current.position.set(
        -10,
        5,
        start[2]
      );

      timer.current = 4;
    }
  });

  return (
    <group ref={star} position={start}>
      <mesh rotation={[0, 0, -0.34]}>
        <cylinderGeometry args={[0.012, 0.045, 2.2, 8]} />

        <meshBasicMaterial
          color="#bae6fd"
          transparent
          opacity={0.65}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <pointLight
        color="#67e8f9"
        intensity={3}
        distance={2}
      />
    </group>
  );
}

function Satellite({
  radius,
  speed,
  offset,
}: {
  radius: number;
  speed: number;
  offset: number;
}) {
  const satellite = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!satellite.current) return;

    const time = state.clock.elapsedTime * speed + offset;

    satellite.current.position.x =
      Math.cos(time) * radius;

    satellite.current.position.y =
      Math.sin(time * 1.3) * 1.8;

    satellite.current.position.z =
      -2 + Math.sin(time) * radius * 0.3;

    satellite.current.rotation.x += 0.004;
    satellite.current.rotation.y += 0.007;
  });

  return (
    <group ref={satellite}>
      <mesh>
        <octahedronGeometry args={[0.11]} />

        <meshStandardMaterial
          color="#e0f2fe"
          emissive="#22d3ee"
          emissiveIntensity={1}
        />
      </mesh>

      <mesh position={[-0.22, 0, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.02]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      <mesh position={[0.22, 0, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.02]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
    </group>
  );
}

function SpaceParticles() {
  const particles = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const array = new Float32Array(450 * 3);

    for (let i = 0; i < 450; i++) {
      const seedA = Math.sin(i * 12.9898) * 43758.5453;
      const seedB = Math.sin(i * 78.233) * 12345.6789;
      const seedC = Math.sin(i * 45.164) * 98765.4321;

      const x = seedA - Math.floor(seedA);
      const y = seedB - Math.floor(seedB);
      const z = seedC - Math.floor(seedC);

      array[i * 3] = (x - 0.5) * 30;
      array[i * 3 + 1] = (y - 0.5) * 20;
      array[i * 3 + 2] = -z * 20;
    }

    return array;
  }, []);

  useFrame((_, delta) => {
    if (!particles.current) return;

    particles.current.rotation.y += delta * 0.003;
    particles.current.rotation.x += delta * 0.001;
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.025}
        color="#67e8f9"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function CameraMotion() {
  useFrame((state) => {
    const targetX = state.pointer.x * 0.3;
    const targetY = state.pointer.y * 0.2;

    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      targetX,
      0.025
    );

    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      targetY,
      0.025
    );

    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function SpaceScene() {
  return (
    <>
      <ambientLight intensity={0.25} />

      <directionalLight
        position={[5, 4, 5]}
        intensity={2}
        color="#67e8f9"
      />

      <pointLight
        position={[4, -2, 1]}
        intensity={8}
        distance={15}
        color="#2563eb"
      />

      <Stars
        radius={100}
        depth={60}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.35}
      />

      <SpaceParticles />

      <Planet />

      <Satellite radius={5} speed={0.18} offset={0} />
      <Satellite radius={6.5} speed={0.12} offset={2} />

      <ShootingStar
        start={[-9, 6, -3]}
        speed={7}
        delay={1}
      />

      <ShootingStar
        start={[-11, 4, -6]}
        speed={5}
        delay={4}
      />

      <ShootingStar
        start={[-8, 8, -8]}
        speed={8}
        delay={7}
      />

      <CameraMotion />
    </>
  );
}

export default function MissionSpace() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#020617]">
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 50,
        }}
        dpr={[1, 1.5]}
      >
        <SpaceScene />
      </Canvas>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(8,145,178,0.10),transparent_38%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_80%,rgba(37,99,235,0.07),transparent_35%)]" />

      <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/5 to-slate-950/60" />
    </div>
  );
}

