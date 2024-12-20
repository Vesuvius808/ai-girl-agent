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

// Type for signTransaction
type SignTransaction = (tx: Transaction) => Promise<Transaction>;

// Define a wallet interface that matches Anchor's Wallet requirement (no `any`)
interface Wallet {
  publicKey: PublicKey;
  signTransaction: SignTransaction;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

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

const PROGRAM_ID = new PublicKey("DY5LZb7nuNzaJeKrrxo3UbUE2qN8nMrXJprYJqHvCmTD")
const SOL_RECEIVER = new PublicKey("9457hfGKDSKk2oM1qe4qpuchjXFa5CHENzWDvLC3otUs")
const MINT = new PublicKey("2EqGuqPAipp9kPCrRbgxf5njgZ9NgCpzpiCZQJ6wYjN6")

// Function to purchase tokens
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

  // Construct a wallet object without `any`
  const wallet: Wallet = {
    publicKey: publicKey, // Guaranteed non-null by caller
    signTransaction,
    signAllTransactions: async (txs) => txs
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
  // State for input amount
  const [inputAmount, setInputAmount] = useState("")
  // State for countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()

  // Countdown effect
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

  // Handle purchase
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
    <div className="element-0 min-h-screen bg-[#0B0B2F] text-white overflow-hidden flex flex-col">
      <div className="element-1 relative flex flex-col flex-grow">
        <div className="element-2 absolute inset-0 bg-gradient-to-r from-[#FF69B4]/20 to-[#00FFFF]/20 blur-3xl" />
        <div className="element-3 relative container mx-auto px-4 py-20">
          {/* Social Media Links */}
          <div className="element-4 absolute top-4 left-4 z-10 flex space-x-4">
            <a
              href="https://twitter.com/YourTwitterProfile"
              target="_blank"
              rel="noopener noreferrer"
              className="element-5 text-white hover:text-[#FF69B4] transition-colors flex items-center justify-center"
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
              className="element-6 text-white hover:text-[#00FFFF] transition-colors"
            >
              <Send className="w-6 h-6" />
            </a>
          </div>
          
          {/* Connect Wallet Button */}
          <div className="element-7 absolute top-4 right-4 z-10">
            <WalletMultiButtonDynamic className="element-8 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] hover:opacity-90 text-black font-bold text-xs py-1" />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="element-9 text-center mb-16"
          >
            <h1 className="element-10 text-5xl md:text-7xl font-bold mb-6 pb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">
              Alin, Our Favorite AI Agent
            </h1>
            <p className="element-11 text-xl md:text-2xl text-gray-300">
              The future of decentralized AI is here
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="element-12 flex flex-col md:flex-row gap-8 mb-16">
            {/* AI Agent Image */}
            <div className="element-13 md:w-1/2">
              <Card className="element-14 bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl overflow-hidden border-2 shadow-[0_0_15px_rgba(255,105,180,0.5)]">
                <CardContent className="element-15 p-0 relative aspect-[16/12]">
                  <Image
                    src="https://i.imgur.com/jzRWMH8.png"
                    alt="AI Agent Artwork"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="element-16 absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </CardContent>
              </Card>
            </div>

            {/* Countdown and Presale Info */}
            <div className="element-17 md:w-1/2 space-y-4">
              {/* Countdown Timer */}
              <div className="element-18 grid grid-cols-2 gap-4">
                {Object.entries(timeLeft).map(([unit, value], i) => (
                  <Card key={unit} className={`element-${19 + i} bg-black/30 border-[#00FFFF]/30 backdrop-blur-xl`}>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl md:text-4xl font-bold text-[#00FFFF]">
                        {Math.abs(value)}
                      </div>
                      <div className="text-sm text-gray-400 capitalize">{unit}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Presale Info */}
              <Card className="element-23 bg-black/30 border-[#00FFFF]/30 backdrop-blur-xl">
                <CardContent className="element-24 p-4">
                  <h2 className="element-25 text-lg font-bold mb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">Presale Details</h2>
                  <div className="element-26 grid gap-1 text-xs mb-3">
                    <div className="element-27 flex justify-between">
                      <span className="text-gray-400">Presale Price:</span>
                      <span className="text-[#00FFFF]">0.0001 SOL</span>
                    </div>
                    <div className="element-28 flex justify-between">
                      <span className="text-gray-400">Listing Price:</span>
                      <span className="text-[#FF69B4]">0.0002 SOL</span>
                    </div>
                    <div className="element-29 flex justify-between">
                      <span className="text-gray-400">Min Purchase:</span>
                      <span className="text-[#00FFFF]">0.1 SOL</span>
                    </div>
                    <div className="element-30 flex justify-between">
                      <span className="text-gray-400">Max Purchase:</span>
                      <span className="text-[#FF69B4]">1000 SOL</span>
                    </div>
                  </div>
                  <div className="element-31 mb-3">
                    <label htmlFor="amount" className="block text-xs mb-1 text-gray-400">Amount: (SOL)</label>
                    <input
                      type="number"
                      id="amount"
                      className="element-32 w-full p-1 bg-black/30 border border-[#00FFFF]/30 rounded text-white text-xs"
                      placeholder="Enter amount"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="element-33 w-full bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] hover:opacity-90 text-black font-bold text-xs py-1 rounded"
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
          <div className="element-34 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <Card className="element-35 bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Bot className="w-8 h-8 mb-4 text-[#FF69B4]" />
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">AI-Powered</h3>
                <p className="text-gray-400">Advanced AI technology driving token utility and growth</p>
              </CardContent>
            </Card>
            <Card className="element-36 bg-black/30 border-[#00FFFF]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Timer className="w-8 h-8 mb-4 text-[#00FFFF]" />
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#00FFFF] to-[#1E90FF] text-transparent bg-clip-text">Early Access</h3>
                <p className="text-gray-400">Be among the first to join the AI revolution</p>
              </CardContent>
            </Card>
            <Card className="element-37 bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <Scale className="w-8 h-8 mb-4 text-[#FF69B4]" />
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">Fair Launch</h3>
                <p className="text-gray-400">Lightning-fast transactions on launch</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Description */}
          <div className="element-38 max-w-4xl mx-auto mb-16">
            <Card className="element-39 bg-black/30 border-[#FF69B4]/30 backdrop-blur-xl">
              <CardContent className="element-40 p-8">
                <h2 className="element-41 text-2xl font-bold mb-4 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">Hey Anon, allow me to introduce myself!</h2>
                <div className="element-42 space-y-4 text-gray-300">
                  <p>Kon&#39;nichiwa, Anon~! I&#39;m Alin, your extra-kinky, extra-cute anime memecoin whisperer...</p>
                  <p>Picture me as a soft, cat-eared cutie with a playful wink and a sly smile...</p>
                  <p>Let&#39;s snuggle up in this digital den while I purr secret alphα into your ear...</p>
                  <p>So lean in, Anon, and let&#39;s become partners in all things mischievous and magical...</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="element-43 flex-grow flex items-center justify-center">
            <div className="element-44 text-center">
              <p className="element-45 text-xl font-semibold mb-4 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] text-transparent bg-clip-text">
                Ready to join the cutest revolution in crypto? Don&#39;t miss out on the Alin presale!
              </p>
              <Button 
                className="element-46 bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] hover:opacity-90 text-black font-bold px-8 py-3 text-lg rounded"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
