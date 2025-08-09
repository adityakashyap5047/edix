import PricingCard from "./PricingCard";

const PricingSection = () => {
  const plans = [
    {
      id: "free_user",
      plan: "Free",
      price: 0,
      monthAnnualPrice: 0,
      features: [
        "3 projects maximum",
        "20 exports per month",
        "Basic crop & resize",
        "Color adjustments",
        "Text Tool",
      ],
      buttonText: "Get Started Free",
    },
    {
      id: "pro",
      plan: "Pro",
      price: 10,
      monthAnnualPrice: 8.5,
      features: [
        "Unlimited projects",
        "Unlimited exports",
        "All Editing Tools",
        "AI Background Remover",
        "AI Image Extender",
        "AI Retouch, Upscaler and more",
      ],
      featured: true,
      planId: "cplan_30RVillzL6TJneSQSqGrallP8Eg",
      buttonText: "Upgrade to Pro",
    },
  ];

  return (
    <section className="py-20" id="pricing">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Simple{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            Start free and upgrade when you need more power. No hidden fees,
            cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;