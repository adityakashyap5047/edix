"use client";

import { useIntersectionObserver } from "@/hooks/useLanding";
import { useState } from "react";

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    delay: number;
}

const FeatureCard = ({ icon, title, description, delay = 0 }: FeatureCardProps) => {
    const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            ref={ref}
            className={`backdrop-blur-lg bg-slate-800/5 border border-white/10 rounded-2xl p-8 transition-all duration-700 cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            } ${isHovered ? "transform scale-105 rotate-1 shadow-2xl" : ""}`}
            style={{ transitionDelay: `${delay}ms` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
    );
};

export default FeatureCard;