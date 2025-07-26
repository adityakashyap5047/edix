import { AnimatedCounter } from "./AnimatedCounter";

const Stats = () => {

    const stats = [
        { label: "Images Processed", value: 10000, suffix: "+" },
        { label: "Active Users", value: 500, suffix: "+" },
        { label: "AI Transformations", value: 45000, suffix: "+" },
        { label: "User Satisfaction", value: 98, suffix: "%" },
    ];

    return (
        <section className="pt-36">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, idx) => {
                        return (
                            <div key={idx} className="text-center">
                                <div className="text-4xl lg:text-5xl font-bold mb-2">
                                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="text-gray-400 uppercase tracking-wider text-sm">
                                    {stat.label}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default Stats