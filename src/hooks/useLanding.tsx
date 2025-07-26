"use client";

import { useEffect, useState, useRef, RefObject } from "react";

export const useIntersectionObserver = <T extends HTMLElement>(
  threshold = 0.1
): [RefObject<T | null>, boolean] => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
};

export const useAnimatedCounter = (target: number, duration = 2000): [number, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const step = target / (duration / 16);
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + step;
        if (next >= target) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration, isActive]);

  return [Math.floor(count), setIsActive];
};