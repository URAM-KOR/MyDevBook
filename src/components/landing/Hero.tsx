'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* 배경 이미지 */}
            <div className="absolute inset-0 w-full h-full">
                {/* 데스크톱 이미지 */}
                <img
                    src="/landing-image.png"
                    alt="FairyQuest Landing"
                    className="hidden md:block w-full h-full object-cover"
                    style={{
                        objectPosition: 'center',
                    }}
                />
                {/* 모바일 이미지 */}
                <img
                    src="/landing_mobile.jpg"
                    alt="FairyQuest Landing Mobile"
                    className="block md:hidden w-full h-full object-cover"
                    style={{
                        objectPosition: 'center',
                    }}
                />
            </div>

            {/* 로그인 버튼 */}
            <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="relative z-10 flex items-center justify-center px-4"
                style={{
                    position: 'absolute',
                    bottom: '35%',
                    left: 0,
                    right: 0,
                    width: '100%',
                }}
            >
                <motion.a
                    href="/api/auth/google"
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    className="group relative inline-flex items-center gap-2 md:gap-3 px-6 md:px-10 py-4 md:py-5 bg-white hover:bg-gray-50 text-gray-800 text-base md:text-xl font-bold rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 border-2 border-gray-200 w-full md:w-auto max-w-sm md:max-w-none"
                    style={{
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="flex-1 md:flex-none text-center md:text-left">Login with Google</span>
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform text-gray-600" />
                </motion.a>
            </motion.div>
        </div>
    );
}
