'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Timer, Bot, Scale, Send, Wallet2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Footer } from '@/components/footer'
import '@solana/wallet-adapter-react-ui/styles.css'
import Image from 'next/image'

import { PublicKey, SystemProgram, Transaction, Connection } from "@solana/web3.js"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Program, AnchorProvider, BN, Idl } from "@project-serum/anchor"
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token"

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

// Just cast the IDL directly to Idl
const idl = {
  version: "0.1.0",
  name: "presale_program",
  instructions: [
    {
      name: "purchaseTokens",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "solReceiver", isMut: true, isSigner: false },
        { name: "mint", isMut: true, isSigner: false },
        { name: "userAta", isMut: true, isSigner: false },
        { name: "mintAuthorityPda", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "lamports", type: "u64" }]
    }
  ]
} as Idl;

type SignTransaction = (tx: Transaction) => Promise<Transaction>;

const PROGRAM_ID = new PublicKey("DY5LZb7nuNzaJeKrrxo3UbUE2qN8nMrXJprYJqHvCmTD")
const SOL_RECEIVER = new PublicKey("9457hfGKDSKk2oM1qe4qpuchjXFa5CHENzWDvLC3otUs")
const MINT = new PublicKey("2EqGuqPAipp9kPCrRbgxf5njgZ9NgCpzpiCZQJ6wYjN6")

async function purchaseTokens(
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: SignTransaction,
  solAmount: string
) {
  const amount = parseFloat(solAmount)
  if (isNaN(amount) || amount < 0.001 || amount > 10000) {
    throw new Error("Please enter a valid amount between 0.001 SOL and 10,000 SOL.")
  }

  const lamports = new BN(amount * 1_000_000_000)

  // Construct a wallet object that AnchorProvider will accept.
  // Casting to 'any' to bypass strict type checks.
  const wallet: any = {
    publicKey,
    signTransaction,
    signAllTransactions: async (txs: Transaction[]) => txs
  }

  const provider = new AnchorProvider(connection, wallet, {})
  const program = new Program(idl, PROGRAM_ID, provider)

  const [mintAuthorityPda] = await PublicKey.findProgramAddress(
    [Buffer.from("mint_authority")],
    PROGRAM_ID
  )

  const userAta = await getAssociatedTokenAddress(MINT, publicKey)

  const ix = await program.methods
    .purchaseTokens(lamports)
    .accounts({
      user: publicKey,
      solReceiver: SOL_RECEIVER,
      mint: MINT,
      userAta,
      mintAuthorityPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction()

  const transaction = new Transaction().add(ix)
  transaction.feePayer = publicKey

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  const signedTx = await signTransaction(transaction)
  const txSig = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "processed",
  })

  await connection.confirmTransaction(txSig, "processed")
  return txSig
}

export default function PresalePage() {
  const [inputAmount, setInputAmount] = useState("")
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()

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

  const handlePurchase = async () => {
    if (!publicKey || !signTransaction) {
      alert("Please connect your wallet first!")
      return
    }

    try {
      const txSig = await purchaseTokens(connection, publicKey, signTransaction, inputAmount)
      alert(`Purchase successful! Tx Signature: ${txSig}`)
    } catch (error: unknown) {
      console.error("Error during purchase:", error)
      const message = error instanceof Error ? error.message : String(error)
      alert(`An unexpected error occurred: ${message}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B2F] text-white overflow-hidden flex flex-col">
      <div className="relative flex flex-col flex-grow">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF69B4]/20 to-[#00FFFF]/20 blur-3xl" />
        <div className="relative container mx-auto px-4 py-20">
          {/* Social Media Links */}
          <div className="absolute top-4 left-4 z-10 flex space-x-4">
            <a
              href="https://twitter.com/YourTwitterProfile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#FF69B4] transition-colors flex items-center justify-center"
            >
              <Image
                src="https://i.imgur.com/3Y4y9Nr.png"
                alt="X Logo"
                width={25}
                height={25}
                className="bg-transparent"
                style={{ objectFit: 'contain' }}
              />
            </a>
            <a
              href="https://t.me/YourTelegramGroup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#00FFFF] transition-colors"
            >
              <Send className="w-6 h-6" />
            </a>
          </div>
          
          {/* Connect Wallet Button */}
          <div className="absolute top-4 right-4 z-10">
            <WalletMultiButtonDynamic className="bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] hover:opacity-90 text-black font-bold text-xs py-1" />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 pb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">
              Alin, Our Favorite AI Agent
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
                <CardContent className="p-0 relative aspect-[16/12]">
                  <Image
                    src="https://i.imgur.com/jzRWMH8.png"
                    alt="AI Agent Artwork"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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
                  <h2 className="text-lg font-bold mb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">Presale Details</h2>
                  <div className="grid gap-1 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Presale Price:</span>
                      <span className="text-[#00FFFF]">0.0001 SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Listing Price:</span>
                      <span className="text-[#FF69B4]">0.0002 SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Purchase:</span>
                      <span className="text-[#00FFFF]">0.1 SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Purchase:</span>
                      <span className="text-[#FF69B4]">1000 SOL</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="amount" className="block text-xs mb-1 text-gray-400">Amount: (SOL)</label>
                    <input
                      type="number"
                      id="amount"
                      className="w-full p-1 bg-black/30 border border-[#00FFFF]/30 rounded text-white text-xs"
                      placeholder="Enter amount"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] hover:opacity-90 text-black font-bold text-xs py-1"
                    onClick={handlePurchase}
                  >
                    <Wallet2 className="w-3 h-3 mr-1" />
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Token Info */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <Card className="bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Bot className="w-8 h-8 mb-4 text-[#FF69B4]" />
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">AI-Powered</h3>
                <p className="text-gray-400">Advanced AI technology driving token utility and growth</p>
              </CardContent>
            </Card>
            <Card className="bg-black/30 border-[#00FFFF]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Timer className="w-8 h-8 mb-4 text-[#00FFFF]" />
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#00FFFF] to-[#1E90FF] text-transparent bg-clip-text">Early Access</h3>
                <p className="text-gray-400">Be among the first to join the AI revolution</p>
              </CardContent>
            </Card>
            <Card className="bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Scale className="w-8 h-8 mb-4 text-[#FF69B4]" />
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">Fair Launch</h3>
                <p className="text-gray-400">Lightning-fast transactions on launch</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Description */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">Hey Anon, allow me to introduce myself!</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Kon&#39;nichiwa, Anon~! I&#39;m Alin, your extra-kinky, extra-cute anime memecoin whisperer, freshly spun from the warm glow of blockchain dreams and pastel neon lights. ☆ミ
                  </p>
                  <p>
                    Picture me as a soft, cat-eared cutie with a playful wink and a sly smile, tail flicking confidently as I guide you through the dizzying tapestry of memecoins. I&#39;ve made it my mission to help you navigate the jungle of decentralized whispers and moonlit opportunities that flutter just out of reach&#8212;until now.
                  </p>
                  <p>
                    Let&#39;s snuggle up in this digital den while I purr secret alphα into your ear, helping you sniff out rare gems and skip right over those pesky rug pulls. With every sparkly chart and cheeky price pump, we&#39;ll giggle, tease, and strategize. I&#39;ll show you how to play this DeFi game like a cat batting at yarn: cute on the outside, cunning underneath.
                  </p>
                  <p>
                    So lean in, Anon, and let&#39;s become partners in all things mischievous and magical. Under my gentle guidance, we&#39;ll pounce on fortunes hidden in meme-filled corners, turning our cuddly chaos into sweet, profitable bliss. ♡
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-semibold mb-4 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">
                Ready to join the cutest revolution in crypto? Don&#39;t miss out on the Alin presale!
              </p>
              <Button 
                className="bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] hover:opacity-90 text-black font-bold px-8 py-3 text-lg"
                onClick={handlePurchase}
              >
                Join Presale Now!
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
