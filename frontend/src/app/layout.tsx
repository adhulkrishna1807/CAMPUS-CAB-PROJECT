import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { DemoBanner } from '@/components/DemoBanner';
import { Navbar } from '@/components/Navbar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ToastContainer } from '@/components/ToastContainer';
import Link from 'next/link';
import { Bike, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Campus Cab — Campus Mobility, Laundry & Rental Platform',
  description: 'Your Campus. Your Ride. Your Campus Cab. Bike rides, laundry pickup, and vehicle rentals all in one platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-[#102A43] flex flex-col min-h-screen antialiased selection:bg-[#EAF4FF] selection:text-[#1557C0]">
        <AuthProvider>
          <DemoBanner />
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>

          {/* Footer */}
          <footer className="bg-[#062B68] text-white mt-auto border-t border-[#073B8F]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Brand */}
                <div className="space-y-4 md:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1557C0] flex items-center justify-center relative shadow-sm">
                      <Bike className="w-5 h-5 text-white stroke-[2.2]" />
                      <MapPin className="w-2.5 h-2.5 text-blue-200 fill-blue-200 absolute -top-0.5 -right-0.5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-lg text-white tracking-tight">CAMPUS CAB</span>
                      <p className="text-[11px] text-blue-300">Ride • Connect • Campus</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-200 leading-relaxed">
                    A centralized campus mobility platform replacing scattered WhatsApp messages with transparent fares, verified riders, and real-time tracking.
                  </p>
                </div>

                {/* Services */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Services</h4>
                  <ul className="space-y-2 text-xs text-blue-200">
                    <li><Link href="/user/book-ride" className="hover:text-white transition-colors">Bike Pickup &amp; Drop</Link></li>
                    <li><Link href="/user/book-laundry" className="hover:text-white transition-colors">Laundry Pickup &amp; Delivery</Link></li>
                    <li><Link href="/user/rent-vehicle" className="hover:text-white transition-colors">Bike Rental</Link></li>
                    <li><Link href="/user/rent-vehicle" className="hover:text-white transition-colors">Scooty Rental</Link></li>
                  </ul>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-xs text-blue-200">
                    <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                    <li><Link href="/fare-chart" className="hover:text-white transition-colors">Fare Chart</Link></li>
                    <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                    <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                  </ul>
                </div>

                {/* Info */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Service Info</h4>
                  <p className="text-xs text-blue-200 leading-relaxed mb-3">
                    Campus-based operations covering hostels, gates, departments and university travel routes.
                  </p>
                  <div className="p-3 bg-[#073B8F]/60 rounded-xl border border-[#1557C0]/40 text-[11px] text-blue-100 space-y-1.5">
                    <p>🧺 Laundry: <strong>Wed &amp; Sat</strong></p>
                    <p>🏍️ Rides: <strong>24/7 on availability</strong></p>
                    <p>🔑 Deposit: <strong>₹1000 (Refundable)</strong></p>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-[#1557C0]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300 gap-4">
                <p>© {new Date().getFullYear()} Campus Cab. All rights reserved.</p>
                <p>Built for campus students.</p>
              </div>
            </div>
          </footer>

          <BottomNavigation />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
