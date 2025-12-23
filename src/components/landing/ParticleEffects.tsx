'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
}

export default function ParticleEffects() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate random particles on client-side to avoid hydration mismatch
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 10 + 5,
            duration: Math.random() * 20 + 10,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    initial={{ x: `${particle.x}vw`, y: `${particle.y}vh`, opacity: 0 }}
                    animate={{
                        y: [
                            `${particle.y}vh`,
                            `${particle.y - 20}vh`,
                            `${particle.y}vh`,
                        ],
                        x: [
                            `${particle.x}vw`,
                            `${particle.x + 10}vw`,
                            `${particle.x}vw`,
                        ],
                        opacity: [0, 0.6, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute rounded-full bg-white blur-sm"
                    style={{
                        width: particle.size,
                        height: particle.size,
                    }}
                />
            ))}
        </div>
    );
}
