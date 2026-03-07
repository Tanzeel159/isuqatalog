import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function AnimatedBackground({ variant = 'auth' }: { variant?: 'auth' | 'catalog' | 'dashboard' }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const orbs = variant === 'catalog' ? catalogOrbs : variant === 'dashboard' ? dashboardOrbs : authOrbs;

  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="noise-overlay" />
        {orbs.map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.x,
              top: orb.y,
              background: orb.color,
              filter: `blur(${orb.blur}px)`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="noise-overlay" />

      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
          }}
          animate={{
            x: [0, orb.dx, -orb.dx * 0.6, 0],
            y: [0, -orb.dy, orb.dy * 0.8, 0],
            scale: [1, orb.scaleTo, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

const authOrbs = [
  { x: '-10%', y: '60%', size: '55%', color: 'rgba(200,16,46,0.12)', blur: 140, dx: 30, dy: 20, scaleTo: 1.1, duration: 20 },
  { x: '55%', y: '65%', size: '50%', color: 'rgba(241,190,72,0.15)', blur: 140, dx: -25, dy: 25, scaleTo: 1.08, duration: 24 },
  { x: '30%', y: '-10%', size: '35%', color: 'rgba(200,16,46,0.06)', blur: 120, dx: 20, dy: 15, scaleTo: 1.15, duration: 28 },
];

const catalogOrbs = [
  { x: '-15%', y: '15%', size: '45%', color: 'rgba(200,16,46,0.1)', blur: 140, dx: 35, dy: 20, scaleTo: 1.12, duration: 22 },
  { x: '60%', y: '-5%', size: '50%', color: 'rgba(241,190,72,0.12)', blur: 140, dx: -30, dy: 30, scaleTo: 1.08, duration: 26 },
  { x: '70%', y: '50%', size: '40%', color: 'rgba(200,16,46,0.07)', blur: 120, dx: 25, dy: -20, scaleTo: 1.1, duration: 30 },
  { x: '-10%', y: '70%', size: '45%', color: 'rgba(241,190,72,0.1)', blur: 140, dx: -20, dy: 25, scaleTo: 1.06, duration: 24 },
  { x: '50%', y: '80%', size: '35%', color: 'rgba(200,16,46,0.08)', blur: 120, dx: 15, dy: -15, scaleTo: 1.12, duration: 32 },
];

const dashboardOrbs = [
  { x: '-15%', y: '60%', size: '50%', color: 'rgba(200,16,46,0.06)', blur: 160, dx: 20, dy: 15, scaleTo: 1.08, duration: 25 },
  { x: '65%', y: '65%', size: '45%', color: 'rgba(241,190,72,0.08)', blur: 160, dx: -15, dy: 20, scaleTo: 1.06, duration: 30 },
  { x: '25%', y: '-15%', size: '35%', color: 'rgba(241,190,72,0.05)', blur: 140, dx: 10, dy: 10, scaleTo: 1.1, duration: 35 },
];
