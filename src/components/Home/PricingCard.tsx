"use client";

import { useIntersectionObserver } from "@/hooks/useLanding";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "../ui/button";

declare global {
  interface Window {
    Clerk?: {
      __internal_openCheckout?: (options: {
        planId?: string;
        planPeriod?: string;
        subscriberType?: string;
      }) => Promise<void>;
    };
  }
}

interface PricingCardProps {
    id: string;
    plan: string;
    price: number;
    features: string[];
    featured?: boolean;
    planId?: string;
    buttonText: string;
}

const PricingCard = ({
  id,
  plan,
  price,
  features,
  featured = false,
  planId,
  buttonText,
}: PricingCardProps) => {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>();
  const [isHovered, setIsHovered] = useState(false);
  const { has } = useAuth();

  const isCurrentPlan = id ? has?.({ plan: id }) : false;

  const handlePopup = async () => {
    if (isCurrentPlan) return;

    try {
      if (window.Clerk && window.Clerk.__internal_openCheckout) {
        await window.Clerk.__internal_openCheckout({
          planId: planId,
          planPeriod: "month",
          subscriberType: "user",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <div
      ref={ref}
      className={`relative backdrop-blur-lg border rounded-3xl p-8 transition-all duration-700 cursor-pointer ${
        featured
          ? "bg-gradient-to-b from-blue-500/20 to-purple-600/20 border-blue-400/50 scale-100"
          : "bg-white/5 border-white/10"
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${
        isHovered ? "transform scale-105 rotate-1 z-10" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>
        <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
          ${price}
          {price > 0 && <span className="text-lg text-gray-400">/month</span>}
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-300">
              <span className="text-green-400 mr-3">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <Button
          variant={featured ? "primary" : "glass"}
          size="xl"
          className="w-full"
          onClick={handlePopup}
          disabled={isCurrentPlan || !planId}
        >
          {isCurrentPlan ? "Current Plan" : buttonText}
        </Button>
      </div>
    </div>
  );
};

export default PricingCard;