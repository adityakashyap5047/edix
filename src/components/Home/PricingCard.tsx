"use client";

import { useIntersectionObserver } from "@/hooks/useLanding";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Switch } from "../ui/switch"; // shadcn/ui switch

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
  monthAnnualPrice: number;
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
  monthAnnualPrice,
}: PricingCardProps) => {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>();
  const [isHovered, setIsHovered] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const { has } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const isCurrentPlan = id ? has?.({ plan: id }) : false;

  const yearlyPrice = Math.round(monthAnnualPrice * 12);

  const handlePopup = async () => {
    if (isCurrentPlan) return;

    try {
      if (window.Clerk?.__internal_openCheckout) {
        await window.Clerk.__internal_openCheckout({
          planId,
          planPeriod: isYearly ? "annual" : "month",
          subscriberType: "user",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  const handleSignIn = () => {
    if (user) {
      handlePopup();
    } else {
      router.push("/sign-in");
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
        <div className="flex justify-center gap-6 my-4">
          <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>

          {monthAnnualPrice > 0 && <>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span className={isYearly ? "text-white" : "text-gray-400"}>
                Yearly{" "}
                <span className="text-green-400 text-xs">
                  ${yearlyPrice}
                </span>
              </span>
            </div>
          </>}
        </div>

        <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
          ${isYearly ? monthAnnualPrice : price}
          <span className="text-lg text-gray-400">
            /month
          </span>
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
          onClick={user ? handlePopup : handleSignIn}
          disabled={user && (isCurrentPlan || !planId)}
        >
          {isCurrentPlan ? "Current Plan" : buttonText}
        </Button>
      </div>
    </div>
  );
};

export default PricingCard;