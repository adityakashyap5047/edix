"use client";

import { useEffect } from "react";
import {
  useAnimatedCounter,
  useIntersectionObserver,
} from "@/hooks/useLanding";

interface AnimatedCounterProps {
    target: number;
    suffix: string;
    duration?: number;
}

export const AnimatedCounter = ({ target, suffix = "", duration = 2000 }: AnimatedCounterProps) => {
  const [ref, isVisible] = useIntersectionObserver<HTMLSpanElement>();
  const [count, setIsActive] = useAnimatedCounter(target, duration);

  useEffect(() => {
    if (isVisible) setIsActive(true);
  }, [isVisible, setIsActive]);

  return (
    <span
      ref={ref}
      className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
    >
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};