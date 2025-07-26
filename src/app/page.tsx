import FeatureSection from "@/components/Home/FeatureSection"
import HeroSection from "@/components/Home/HeroSection"
import Stats from "@/components/Home/Stats"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const page = () => {
  return (
    <div className="pt-36">

      <HeroSection />

      <Stats />

      <FeatureSection />

      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-6">
            Ready to 
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Create Something Amazing?</span></h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of creators who are already using AI to transform their images and bring their vision to life.
          </p>
          <Link href={"/dashboard"}>
            <Button variant={"primary"} size={"xl"}>
              🌟 Start Creating Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default page