'use client';

import { motion } from 'framer-motion';

export default function GameElements() {
    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* 왼쪽 마을 장면 */}
            <div className="absolute bottom-20 left-5 md:left-20">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="relative"
                >
                    {/* 집들 */}
                    <div className="flex items-end gap-2 mb-2">
                        {/* 집 1 */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-t-lg"
                            style={{
                                clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            }}
                        />
                        {/* 집 2 */}
                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-lg"
                            style={{
                                clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            }}
                        />
                    </div>
                    {/* 풀밭 */}
                    <div className="w-24 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-lg"
                        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    />
                </motion.div>
            </div>

            {/* 오른쪽 성/유적 */}
            <div className="absolute bottom-32 right-5 md:right-20">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="relative"
                >
                    {/* 기둥들 */}
                    <div className="flex gap-1 items-end">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-6 h-16 bg-gradient-to-b from-stone-400 to-stone-600 rounded-t-lg"
                            style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                        />
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            className="w-6 h-20 bg-gradient-to-b from-stone-400 to-stone-600 rounded-t-lg"
                            style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                        />
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            className="w-6 h-14 bg-gradient-to-b from-stone-400 to-stone-600 rounded-t-lg"
                            style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* 중앙 페어리 캐릭터 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.5 }}
                    className="relative"
                >
                    <motion.div
                        animate={{ 
                            y: [0, -15, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="text-8xl md:text-9xl"
                        style={{
                            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                        }}
                    >
                        🧚
                    </motion.div>
                    {/* 마법 빛 효과 */}
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-300 rounded-full blur-2xl"
                    />
                </motion.div>
            </div>

            {/* 떠다니는 섬들 */}
            <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
                className="absolute top-20 left-10 md:left-32"
            >
                <motion.div
                    animate={{ 
                        y: [-10, 10, -10],
                        rotate: [-2, 2, -2]
                    }}
                    transition={{ 
                        duration: 6, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="w-20 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg"
                    style={{
                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                        clipPath: 'polygon(10% 0%, 90% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)',
                    }}
                />
                {/* 섬 위 작은 나무 */}
                <motion.div
                    animate={{ 
                        rotate: [-3, 3, -3]
                    }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl"
                >
                    🌳
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 1.1 }}
                className="absolute top-32 right-10 md:right-32"
            >
                <motion.div
                    animate={{ 
                        y: [-8, 8, -8],
                        rotate: [2, -2, 2]
                    }}
                    transition={{ 
                        duration: 7, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="w-16 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg"
                    style={{
                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                        clipPath: 'polygon(15% 0%, 85% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)',
                    }}
                />
                {/* 섬 위 보물상자 */}
                <motion.div
                    animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0]
                    }}
                    transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="absolute top-1 left-1/2 -translate-x-1/2 text-xl"
                >
                    💎
                </motion.div>
            </motion.div>

            {/* 하단 장식 요소들 */}
            <div className="absolute bottom-10 left-1/4">
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                    className="text-4xl"
                >
                    🌸
                </motion.div>
            </div>
            <div className="absolute bottom-16 right-1/4">
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.5 }}
                    className="text-4xl"
                >
                    ⭐
                </motion.div>
            </div>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.7 }}
                    className="text-3xl"
                >
                    🍄
                </motion.div>
            </div>
        </div>
    );
}

