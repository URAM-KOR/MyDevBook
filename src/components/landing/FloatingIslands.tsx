'use client';

import { motion } from 'framer-motion';

export default function FloatingIslands() {
    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Top Left Cloud Island */}
            <motion.div
                animate={{
                    y: [-10, 10, -10],
                    rotate: [-1, 1, -1],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-20 left-10 w-32 h-24 bg-white/40 rounded-full blur-xl filter"
            />

            {/* Bottom Right Magic Stone */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-40 right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"
            />

            {/* Center glow */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-400/20 rounded-full blur-3xl"
            />
        </div>
    );
}
