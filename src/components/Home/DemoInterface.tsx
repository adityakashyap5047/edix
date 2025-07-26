"use client";

import { useState } from "react";

const DemoInterface = ({ textVisible }: {textVisible: boolean}) => {
  
    const [demoHovered, setDemoHovered] = useState<boolean>(false);

    return (
        <div
            className={`relative max-w-4xl mx-auto transition-all duration-1000 ${
            textVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-20"
            } ${demoHovered ? "transform scale-105 rotate-y-6" : ""}`}
            onMouseEnter={() => setDemoHovered(true)}
            onMouseLeave={() => setDemoHovered(false)}
            style={{ perspective: "1000px" }}
        >
            <div className="backdrop-blur-lg bg-slate-700/10 border border-white/20 rounded-3xl p-6 transform-gpu">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 min-h-96">
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-gray-400 text-sm">Pixxel Pro</div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: "✂️", label: "Crop" },
                        { icon: "📐", label: "Resize" },
                        { icon: "🎨", label: "Adjust" },
                        { icon: "🤖", label: "AI Tools" },
                    ].map((tool, index) => (
                        <div
                        key={index}
                        className="backdrop-blur-lg bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-all cursor-pointer"
                        title={tool.label}
                        >
                        <div className="text-2xl mb-1">{tool.icon}</div>
                        <div className="text-xs text-gray-400">{tool.label}</div>
                        </div>
                    ))}
                    </div>

                    <div className="flex items-center justify-center">
                    <div className="w-full h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/50 flex items-center justify-center">
                        <div className="text-white font-bold">Your Canvas</div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
  )
}

export default DemoInterface