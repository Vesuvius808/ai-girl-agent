'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Timer, Wallet2, Zap, Bot } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PresalePage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const targetDate = new Date('2024-02-01T00:00:00')

    const interval = setInterval(() => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0B2F] text-white overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF69B4]/20 to-[#00FFFF]/20 blur-3xl" />
        <div className="relative container mx-auto px-4 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">
              AI Agent Token
            </h1>
            <p className="text-xl md:text-2xl text-gray-300">
              The future of decentralized AI is here
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-8 mb-16">
            {/* AI Agent Image */}
            <div className="md:w-1/2">
              <Card className="bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl overflow-hidden border-2 shadow-[0_0_15px_rgba(255,105,180,0.5)]">
                <CardContent className="p-0">
                  <div className="relative aspect-[16/12]">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0_0-SfMPsuHRyKXAAJOMgriVUvgKSB6Bq5.png"
                      alt="AI Agent Artwork"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Countdown and Presale Info */}
            <div className="md:w-1/2 space-y-8">
              {/* Countdown Timer */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(timeLeft).map(([unit, value]) => (
                  <Card key={unit} className="bg-black/30 border-[#00FFFF]/30 backdrop-blur-xl">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl md:text-4xl font-bold text-[#00FFFF]">
                        {Math.abs(value)}
                      </div>
                      <div className="text-sm text-gray-400 capitalize">{unit}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Presale Info */}
              <Card className="bg-black/30 border-[#00FFFF]/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Presale Details</h2>
                  <div className="grid gap-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Presale Price:</span>
                      <span className="text-[#00FFFF]">0.0001 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Listing Price:</span>
                      <span className="text-[#FF69B4]">0.0002 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Purchase:</span>
                      <span className="text-[#00FFFF]">0.1 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Purchase:</span>
                      <span className="text-[#FF69B4]">5 ETH</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] hover:opacity-90 text-black font-bold"
                  >
                    <Wallet2 className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Token Info */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Bot className="w-8 h-8 mb-4 text-[#FF69B4]" />
                <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
                <p className="text-gray-400">Advanced AI technology driving token utility and growth</p>
              </CardContent>
            </Card>
            <Card className="bg-black/30 border-[#00FFFF]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Timer className="w-8 h-8 mb-4 text-[#00FFFF]" />
                <h3 className="text-xl font-bold mb-2">Early Access</h3>
                <p className="text-gray-400">Be among the first to join the AI revolution</p>
              </CardContent>
            </Card>
            <Card className="bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Zap className="w-8 h-8 mb-4 text-[#FF69B4]" />
                <h3 className="text-xl font-bold mb-2">Instant Trading</h3>
                <p className="text-gray-400">Lightning-fast transactions on launch</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

