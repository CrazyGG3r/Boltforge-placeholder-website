"use client";
import { useState, useEffect, useRef,useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import { OrbitControls, useGLTF,Line} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";



// Terrain Component
function Terrain(props) {
  const { scene } = useGLTF("/3d shi/s2.glb"); // put your terrain .glb file in /public/3d shi/
  return <primitive object={scene} {...props} />;
}
// Rock Component
function Rock(props) {
  const { scene } = useGLTF("/3d shi/s1.glb"); // path in public/
  return <primitive object={scene} {...props} />;
}
var clicked = 0;

// Lightning Component
// Lightning Component
// Lightning Component
function Lightning({ target = [0, -1, -10], trigger }) {
  const [points, setPoints] = useState([]);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    if (clicked === 1) {
      clicked = 0;

      // build strike
      const start = [Math.random() * 10 - 5, 150, Math.random() * -10];
      const end = target;

      const segments =200;
      const newPoints = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = start[0] + (end[0] - start[0]) * t;
        const y = start[1] + (end[1] - start[1]) * t;
        const z = start[2] + (end[2] - start[2]) * t;
        newPoints.push([
          x + (Math.random() - 0.5) * 2,
          y + (Math.random() - 0.5) * 2,
          z + (Math.random() - 0.5) * 2,
        ]);
      }
      setPoints(newPoints);
      setOpacity(1);

      // fade out
      const fadeInterval = setInterval(() => {
        setOpacity((o) => {
          if (o <= 0.05) {
            clearInterval(fadeInterval);
            setPoints([]);   // <- remove the lightning completely
            return 0;
          }
          return o - 0.05;   // smoother fade step
        });
      }, 50); // 50ms per step
    }
  }, [trigger, target]);

  if (!points.length || opacity <= 0) return null;

  return (
    <>
      <Line
        points={points}
        color="white"
        lineWidth={5}
        transparent
        opacity={opacity}
      />
      <pointLight
        position={target}
        intensity={50 * opacity}
        decay={2}
        distance={40}
        color="white"
      />
    </>
  );
}


// --- Main Scene ---
export function Background3D() {
  const [strike, setStrike] = useState(false);

  function handleClick() {
    if (strike) return; // one strike at a time
    setStrike(true);
    clicked = 1;
    setTimeout(() => setStrike(false), 1000); // reset trigger
  }

  return (
    <Canvas
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      camera={{ position: [0, 5, 25], fov: 50, near: 0.1, far: 2000 }}
      onClick={handleClick}
    >
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} />

      {/* Orbit Controls (hand-held rotation) */}
      <OrbitControls 
        enableDamping={true} 
        dampingFactor={0.1} 
        rotateSpeed={0.6} 
        zoomSpeed={0.8} 
        panSpeed={0.6}
        enablePan={false} // disables sideways movement
      />

      <Rock scale={2} position={[0, -1, -10]} />
      <Terrain
  scale={[5, 5, 5]}   // make bigger or smaller
  position={[0, 3, -10]} // move it up/down/forward/back
  rotation={[0, 0, 0]}    // tilt it if needed
/>

      <Lightning trigger={strike} target={[0, -1, -10]} />
    </Canvas>
  );
}

// --- Main Component ---
export default function Home() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [lines, setLines] = useState([]);
  const [particles, setParticles] = useState([]);
  const [rotation, setRotation] = useState(0);
  const velocityRef = useRef(0);
  const controls = useAnimation();

  const SPACING = 12;
  const color1 = "hsl(0, 0%, 0%)";
  const color2 = "hsl(100, 100%, 100%)";

  const zapSounds = [
    "/sounds/zap1.mp3",
    "/sounds/zap2.mp3",
    "/sounds/zap3.mp3",
    "/sounds/zap4.mp3",
    "/sounds/zap5.mp3",
    "/sounds/zap6.mp3",
  ];

  // track mouse
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // main animation loop for cursor + particles
  useEffect(() => {
    let frame;
    const update = () => {
      setRotation((r) => r + velocityRef.current);
      velocityRef.current *= 0.92;

      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.dx,
            y: p.y + p.dy,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );

      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      const randomSound =
        zapSounds[Math.floor(Math.random() * zapSounds.length)];
      const audio = new Audio(randomSound);
      audio.volume = 0.2;
      audio.play();

      velocityRef.current = (Math.random() - 0.5) * 4;

      controls.start({
        filter: ["invert(1)", "invert(0)"],
        x: [0, -2, 2, -2, 2, 0],
        y: [0, -1, 1, -1, 1, 0],
        transition: { duration: 0.5 },
      });

      const newParticles = Array.from({ length: 8 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        return {
          id: crypto.randomUUID(),
          x: e.clientX,
          y: e.clientY,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 5,
          life: 1,
        };
      });
      setParticles((prev) => [...prev, ...newParticles]);

      const w = window.innerWidth;
      const h = window.innerHeight;

      const edge = Math.floor(Math.random() * 4);
      let start = { x: 0, y: 0 };
      if (edge === 0) start = { x: Math.random() * w, y: 0 };
      if (edge === 1) start = { x: w, y: Math.random() * h };
      if (edge === 2) start = { x: Math.random() * w, y: h };
      if (edge === 3) start = { x: 0, y: Math.random() * h };

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return;

      const ux = dx / dist,
        uy = dy / dist;
      const px = -uy,
        py = ux;

      const makeZigzag = (startX, startY, targetX, targetY) => {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.hypot(dx, dy);
        const ux = dx / dist,
          uy = dy / dist;
        const px = -uy,
          py = ux;

        const segments = [];
        let remaining = dist;
        let side = 1;
        while (remaining > 0) {
          const segLength = 40 + Math.random() * 100;
          const segAmp = 10 + Math.random() * 30;
          segments.push({ length: segLength, amp: segAmp * side });
          remaining -= segLength;
          side *= -1;
        }

        const points = [];
        let segIndex = 0;
        let segUsed = 0;

        for (let s = 0; s <= dist; s += SPACING) {
          while (
            segIndex < segments.length &&
            segUsed >= segments[segIndex].length
          ) {
            segUsed = 0;
            segIndex++;
          }
          const seg = segments[Math.min(segIndex, segments.length - 1)];
          segUsed += SPACING;

          const f = Math.min(segUsed / seg.length, 1);
          const offset = seg.amp * (2 * f - 1);

          const x = startX + ux * s + px * offset;
          const y = startY + uy * s + py * offset;

          points.push(`${x},${y}`);
        }
        return points;
      };

      const mainPoints = makeZigzag(start.x, start.y, e.clientX, e.clientY);

      const branches = [];
      const numBranches = 1 + Math.floor(Math.random() * 2);
      for (let b = 0; b < numBranches; b++) {
        const branchStart =
          mainPoints[Math.floor(Math.random() * mainPoints.length)];
        const [bx, by] = branchStart.split(",").map(Number);
        const angle = Math.random() * Math.PI * 2;
        const len = 80 + Math.random() * 100;
        const target = {
          x: bx + Math.cos(angle) * len,
          y: by + Math.sin(angle) * len,
        };
        branches.push(makeZigzag(bx, by, target.x, target.y));
      }

      setLines((prev) => [
        ...prev,
        { id: crypto.randomUUID(), points: mainPoints, branches },
      ]);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [controls]);

  return (
    <div className="min-h-screen w-full bg-black cursor-none relative overflow-hidden flex flex-col">
      <Background3D /> {/* 👈 New 3D cubes in background */}

      <div className="flex-1 flex items-center justify-center">
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="zigGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>

          {lines.map((line) => (
            <g key={line.id}>
              <motion.polyline
                points={line.points.join(" ")}
                fill="none"
                stroke="url(#zigGradient)"
                strokeWidth="3"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1 }}
              />
              {line.branches.map((branch, i) => (
                <motion.polyline
                  key={i}
                  points={branch.join(" ")}
                  fill="none"
                  stroke="url(#zigGradient)"
                  strokeWidth="2"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              ))}
            </g>
          ))}

          {particles.map((p) => (
            <rect
              key={p.id}
              x={p.x}
              y={p.y}
              width={p.size}
              height={p.size}
              fill="white"
              opacity={p.life}
            />
          ))}
        </svg>

        <MagicButton>Zaapa</MagicButton>

        <motion.img
          src="/images/cursor3.png"
          alt="cursor"
          animate={controls}
          className="fixed pointer-events-none select-none z-[9999]"
          style={{
            left: pos.x,
            top: pos.y,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            filter: "invert(0)",
          }}
        />
      </div>
    </div>
  );
}

// --- Button Component ---
function MagicButton({ children }) {
  const controls = useAnimation();

  const handleClick = () => {
    controls.start({
      backgroundColor: ["#ffffff", "#000000"],
      color: ["#000000", "#9ca3af"],
      borderColor: ["#000000", "#9ca3af"],
      boxShadow: [
        "0 0 20px 5px rgba(255,255,255,0.8)",
        "0 0 0px rgba(0,0,0,0)",
      ],
      x: [0, -3, 3, -3, 3, 0],
      transition: { duration: 0.3 },
    });
  };
  return (
    <div className="relative inline-block">
      <motion.button
        animate={controls}
        onClick={handleClick}
        className="relative z-10 px-6 py-3 border rounded-md font-f1 font-semibold 
                 bg-black text-gray-400 border-gray-400 
                 hover:text-white hover:border-white 
                 transition-colors duration-200 cursor-none select-none "
      >
        {children}
      </motion.button>
    </div>
  );
}
useGLTF.preload("/models/rock.glb");
