import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-black/30 backdrop-blur-xl border-t border-[#FF69B4]/30 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-400">
              © 2024 Alin AI. All rights reserved.
            </p>
          </div>
          <nav className="flex space-x-4">
            <Link href="/terms" className="text-sm text-gray-400 hover:text-[#FF69B4] transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-[#FF69B4] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/disclaimer" className="text-sm text-gray-400 hover:text-[#FF69B4] transition-colors">
              Disclaimer
            </Link>
            <Link href="/contact" className="text-sm text-gray-400 hover:text-[#FF69B4] transition-colors">
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

