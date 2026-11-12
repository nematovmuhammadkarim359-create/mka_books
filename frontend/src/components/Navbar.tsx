import React from 'react';
import { ShoppingCart, Search, BookOpen, User } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => {
  return (
    <header className="bg-[#2c1d11] text-[#fbf9f5] shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-[#c5a880]" />
          <div>
            <span className="text-2xl font-bold tracking-wider font-serif">MKA BOOKS</span>
            <p className="text-xs text-[#c5a880] tracking-widest uppercase">Read. Learn. Become.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center bg-[#3d2919] px-4 py-2 rounded-full border border-[#c5a880]/30 w-96">
          <Search className="w-5 h-5 text-[#c5a880] mr-2" />
          <input 
            type="text" 
            placeholder="Kitob nomi, muallif yoki kategoriya..." 
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-[#c5a880]/60"
          />
        </div>
        <div className="flex items-center space-x-6">
          <a href="#" className="hover:text-[#c5a880] transition text-sm font-medium">Bosh sahifa</a>
          <a href="#" className="hover:text-[#c5a880] transition text-sm font-medium">Katalog</a>
          <a href="#" className="hover:text-[#c5a880] transition text-sm font-medium">Elektron kitoblar</a>
          
          <button onClick={onOpenCart} className="relative p-2 hover:bg-[#3d2919] rounded-full transition flex items-center">
            <ShoppingCart className="w-6 h-6 text-[#c5a880]" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-sans">
                {cartCount}
              </span>
            )}
          </button>

          <a href="#" className="p-2 hover:bg-[#3d2919] rounded-full transition">
            <User className="w-6 h-6 text-[#c5a880]" />
          </a>
        </div>
      </div>
    </header>
  );
};
