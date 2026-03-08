import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
    Wallet,
    PieChart,
    Bell,
    Brain,
    Mail,
    ArrowLeft
} from "lucide-react"

export default function Features() {
    const features = [
        {
            icon: Wallet,
            title: "Smart Expense Tracking",
            desc: "Automatically track income and expenses in a centralized dashboard for complete financial visibility."
        },
        {
            icon: Bell,
            title: "Real-Time Budget Monitoring",
            desc: "Set budgets for categories and receive alerts before reaching spending limits."
        },
        {
            icon: PieChart,
            title: "Advanced Financial Analytics",
            desc: "Visualize spending with interactive charts, monthly comparisons and insights."
        },
        {
            icon: Mail,
            title: "Auto Expense Detection",
            desc: "Fetch transaction details from bank emails to reduce manual data entry."
        },
        {
            icon: Brain,
            title: "AI Financial Assistant",
            desc: "Get personalized saving suggestions and predictive expense insights using AI."
        }
    ]

    return (
        <div className="min-h-screen bg-black text-white px-6 py-20">

            {/* Heading */}
            <div className="max-w-5xl mx-auto text-center mb-16">
                <h1 className="text-5xl font-bold mb-4">
                    FinEase Features
                </h1>
                <p className="text-gray-400 text-lg">
                    Everything you need to manage money smarter.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                {features.map((feature, i) => {
                    const Icon = feature.icon
                    return (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            className="p-6 rounded-xl border border-neutral-800 bg-neutral-900"
                        >
                            <Icon className="w-10 h-10 mb-4 text-blue-400" />

                            <h3 className="text-xl font-semibold mb-2">
                                {feature.title}
                            </h3>

                            <p className="text-gray-400 text-sm">
                                {feature.desc}
                            </p>
                        </motion.div>
                    )
                })}
            </div>

            {/* Go Home Button */}
            <div className="flex justify-center mt-20">
                <Link to="/">
                    <Button className="flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Go to Home
                    </Button>
                </Link>
            </div>

        </div>
    )
}