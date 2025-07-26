import FeatureCard from "./FeatureCard";

const FeaturesSection = () => {
  const features = [
    {
      icon: "✂️",
      title: "Smart Crop & Resize",
      description:
        "Interactive cropping with aspect ratio constraints and intelligent resizing that preserves image quality across any dimension.",
    },
    {
      icon: "🎨",
      title: "Color & Light Adjustment",
      description:
        "Professional-grade brightness, contrast, saturation controls with real-time preview and auto-enhance capabilities.",
    },
    {
      icon: "🤖",
      title: "AI Background Removal",
      description:
        "Remove or replace backgrounds instantly using advanced AI that detects complex edges and fine details with precision.",
    },
    {
      icon: "🔧",
      title: "AI Content Editor",
      description:
        "Edit images with natural language prompts. Remove objects, change elements, or add new content using generative AI.",
    },
    {
      icon: "📏",
      title: "Image Extender",
      description:
        "Expand your canvas in any direction with AI-powered generative fill that seamlessly blends new content with existing images.",
    },
    {
      icon: "⬆️",
      title: "AI Upscaler",
      description:
        "Enhance image resolution up to 4x using AI upscaling technology that preserves details and reduces artifacts.",
    },
  ];

  return (
    <section className="py-20" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
            Powerful AI Features
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to create, edit, and enhance images with
            professional-grade tools powered by cutting-edge AI technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;