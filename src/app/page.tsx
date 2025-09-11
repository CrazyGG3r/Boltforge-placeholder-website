"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

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
      audio.volume = 0.2; // range: 0.0 (silent) → 1.0 (max)
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
