"use client";

import Link from "next/link";
import { useEffect, useState } from "react"
import { Button } from "../ui/button";
import DemoInterface from "./DemoInterface";

const HeroSection = () => {

    const [textVisible, setTextVisible] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(() => setTextVisible(true), 500);

        return () => clearTimeout(timer);
    }, []);

  return (
   <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="text-center z-10 px-6">
            <div className={`transition-all duration-1000 ${textVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                <h1 className="text-3xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tight">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">Create</span>
                    <span className="text-xl sm:text-4xl md:text-5xl bg-gradient-to-r from-orange-400 via-cyan-500 to-orange-400 bg-clip-text text-transparent"> With </span>
                    <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">Edix</span>
                    <br />
                    <span className="text-white">Without Limits</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Professional image powered by AI. Crop, resize, adjust colors, remove backgrounds, and enhance your images with cutting-edge technology.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Link href={"/dashboard"}>
                    <Button variant={"primary"} size={"xl"}>
                        Start Creating
                    </Button>
                </Link>
                <Link href={"https://github.com/adityakashyap5047/edix"} target="_blank">
                    <Button variant={"glass"} size={"xl"}>
                        ⭐ Star Us
                    </Button>
                </Link>
            </div>

            <DemoInterface textVisible={textVisible}  />
        </div>
   </section>
  )
}

export default HeroSection