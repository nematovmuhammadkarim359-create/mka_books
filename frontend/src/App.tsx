import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, BookOpen, User, ArrowLeft, CheckCircle, 
  Filter, Loader2, Heart, CreditCard, PackageCheck, Plus, Minus, ShieldCheck, Truck, Tag 
} from 'lucide-react';

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  image_display: string;
  format: string;
  category_name: string;
  description: string;
  pages: number;
  publisher: string;
}

interface Category {
  id: number;
  name: string;
}

interface CartItem extends Book {
  quantity: number;
}

interface PromoCode {
  id: number;
  code: string;
  discount_percent: number;
}

interface OrderRecord {
  id: number;
  customer_name: string;
  phone: string;
  total_price: number;
  payment_method: string;
  is_paid: boolean;
  status: string;
  items_summary: string;
  created_at: string;
}

const API_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'detail' | 'wishlist' | 'track' | 'success' | 'profile'>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo-kod state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');

  // Filtrlar
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [selectedFormat, setSelectedFormat] = useState('Barchasi');
  const [searchQuery, setSearchQuery] = useState('');

  // Buyurtma formasi
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', paymentMethod: 'Click' });
  const [cardData, setCardData] = useState({ number: '', expiry: '' });
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  // Buyurtma kuzatuvi
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState<OrderRecord[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, catsRes, promosRes] = await Promise.all([
          fetch(`${API_URL}/books/`),
          fetch(`${API_URL}/categories/`),
          fetch(`${API_URL}/promocodes/`)
        ]);
        setBooks(await booksRes.json());
        setCategories(await catsRes.json());
        setPromoCodes(await promosRes.json());
      } catch (error) {
        console.error("Backend bilan ulanishda xato:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const addToCart = (book: Book) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) {
        return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...book, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Chegirmani hisoblash
  const discountAmount = appliedPromo ? (subtotalPrice * appliedPromo.discount_percent) / 100 : 0;
  const priceAfterDiscount = subtotalPrice - discountAmount;
  const deliveryFee = priceAfterDiscount > 150000 || priceAfterDiscount === 0 ? 0 : 15000;
  const finalTotal = priceAfterDiscount + deliveryFee;

  const handleApplyPromo = () => {
    const found = promoCodes.find(p => p.code.toLowerCase() === promoInput.trim().toLowerCase());
    if (found) {
      setAppliedPromo(found);
      setPromoError('');
      setPromoInput('');
    } else {
      setPromoError("Bunday promo-kod topilmadi yoki yaroqsiz!");
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesCat = selectedCategory === 'Barchasi' || book.category_name === selectedCategory;
    const matchesFormat = selectedFormat === 'Barchasi' || book.format === selectedFormat;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesFormat && matchesSearch;
  });

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckoutOpen(false);
    if (formData.paymentMethod === 'Cash') {
      submitOrderToBackend(false);
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handleConfirmOnlinePayment = (e: React.FormEvent) => {
    e.preventDefault();
    submitOrderToBackend(true);
  };

  const submitOrderToBackend = async (isPaid: boolean) => {
    setIsSubmitting(true);
    const promoInfo = appliedPromo ? `\nPromo-kod: ${appliedPromo.code} (-${appliedPromo.discount_percent}%)` : '';
    const itemsSummary = cart.map(item => `${item.title} (${item.quantity} dona) - ${(item.price * item.quantity).toLocaleString()} so'm`).join('\n') + promoInfo;

    try {
      const response = await fetch(`${API_URL}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          phone: formData.phone,
          address: formData.address,
          payment_method: formData.paymentMethod,
          is_paid: isPaid,
          total_price: finalTotal,
          items_summary: itemsSummary
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastOrderId(data.id);
        setIsPaymentModalOpen(false);
        setIsCartOpen(false);
        setCart([]);
        setAppliedPromo(null);
        setCardData({ number: '', expiry: '' });
        setActiveTab('success');
      } else {
        alert("Buyurtmani saqlashda xatolik yuz berdi!");
      }
    } catch {
      alert("Server bilan aloqa yo'q!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTracking(true);
    try {
      const res = await fetch(`${API_URL}/orders/`);
      const allOrders: OrderRecord[] = await res.json();
      const cleanInput = trackPhone.replace(/\D/g, '');
      const matched = allOrders.filter(o => o.phone.replace(/\D/g, '').includes(cleanInput));
      setTrackedOrders(matched);
    } catch {
      alert("Ma'lumotlarni yuklashda xato!");
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#2c1d11]">
      <div className="bg-[#1e130b] text-[#c5a880] text-xs py-2 px-4 text-center tracking-wide">
        150,000 so'mdan yuqori xaridlar uchun yetkazib berish BEPUL! Sinov promo-kod: <span className="font-bold underline">MKA2026</span> (15% chegirma)
      </div>

      {/* NAVBAR */}
      <header className="bg-[#2c1d11] text-[#fbf9f5] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <BookOpen className="w-8 h-8 text-[#c5a880]" />
            <div>
              <span className="text-2xl font-bold tracking-wider font-serif">MKA BOOKS</span>
              <p className="text-[10px] text-[#c5a880] tracking-[0.2em] uppercase">Read. Learn. Become.</p>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-[#3d2919] px-4 py-2 rounded-full border border-[#c5a880]/30 w-80">
            <Search className="w-4 h-4 text-[#c5a880] mr-2" />
            <input 
              type="text" 
              placeholder="Kitob qidirish..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (activeTab === 'home') setActiveTab('catalog'); }}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-[#c5a880]/60"
            />
          </div>

          <div className="flex items-center space-x-5">
            <button onClick={() => setActiveTab('home')} className={`hover:text-[#c5a880] transition text-sm font-medium ${activeTab === 'home' ? 'text-[#c5a880] border-b-2 border-[#c5a880] pb-1' : ''}`}>Bosh sahifa</button>
            <button onClick={() => setActiveTab('catalog')} className={`hover:text-[#c5a880] transition text-sm font-medium ${activeTab === 'catalog' ? 'text-[#c5a880] border-b-2 border-[#c5a880] pb-1' : ''}`}>Katalog</button>
            <button onClick={() => setActiveTab('wishlist')} className={`hover:text-[#c5a880] transition text-sm font-medium flex items-center ${activeTab === 'wishlist' ? 'text-[#c5a880] border-b-2 border-[#c5a880] pb-1' : ''}`}>
              Sevimlilar {wishlist.length > 0 && <span className="ml-1 bg-[#c5a880] text-[#2c1d11] text-xs px-1.5 py-0.5 rounded-full font-bold">{wishlist.length}</span>}
            </button>
            <button onClick={() => setActiveTab('track')} className={`hover:text-[#c5a880] transition text-sm font-medium ${activeTab === 'track' ? 'text-[#c5a880] border-b-2 border-[#c5a880] pb-1' : ''}`}>Buyurtma holati</button>
            
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-[#3d2919] rounded-full transition">
              <ShoppingCart className="w-6 h-6 text-[#c5a880]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-sans font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            <button onClick={() => setActiveTab("profile")} title="Shaxsiy kabinet" className="p-2 hover:bg-[#3d2919] rounded-full transition"><User className="w-6 h-6 text-[#c5a880]" /></button>
          </div>
        </div>
      </header>

      {/* ASOSIY QISM */}
      <main className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-[#c5a880] mb-4" />
            <p className="font-serif text-lg">Kutubxona yuklanmoqda...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <div>
                <section className="bg-gradient-to-r from-[#2c1d11] via-[#3b2718] to-[#2c1d11] text-[#fbf9f5] py-20 px-4 border-b-4 border-[#c5a880]">
                  <div className="max-w-5xl mx-auto text-center">
                    <span className="inline-block border border-[#c5a880]/50 text-[#c5a880] text-xs px-4 py-1 rounded-full uppercase tracking-widest mb-4">
                      O'zbekistonning klassik kitob olami
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                      Har Bir Sahifada Yangi Dunyo Kashf Eting
                    </h1>
                    <p className="text-lg text-[#e6d7c3] mb-8 max-w-2xl mx-auto font-light">
                      Eng sara badiiy, biznes va ilmiy asarlarni qog'oz yoki elektron formatda xarid qiling. Tezkor yetkazib berish va qulay to'lov usullari.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setActiveTab('catalog')}
                        className="bg-[#c5a880] text-[#2c1d11] font-bold px-8 py-3.5 rounded-md hover:bg-white transition shadow-lg"
                      >
                        Katalogni Ko'rish
                      </button>
                      <button 
                        onClick={() => setActiveTab('track')}
                        className="border border-[#c5a880] text-[#c5a880] font-semibold px-8 py-3.5 rounded-md hover:bg-[#c5a880]/10 transition"
                      >
                        Buyurtma holati
                      </button>
                    </div>
                  </div>
                </section>

                <section className="max-w-7xl mx-auto px-4 py-16">
                  <div className="flex justify-between items-end mb-10 border-b border-[#c5a880]/30 pb-4">
                    <div>
                      <h2 className="text-3xl font-serif font-bold">Tavsiya etilgan kitoblar</h2>
                      <p className="text-gray-600 text-sm mt-1">Kitobxonlarimiz tomonidan eng ko'p tanlangan asarlar</p>
                    </div>
                    <button onClick={() => setActiveTab('catalog')} className="font-semibold hover:text-[#c5a880] transition">Barchasini ko'rish &rarr;</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:p-6">
                    {books.slice(0, 4).map((book) => (
                      <div key={book.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-xl transition duration-300 flex flex-col group">
                        <div className="h-64 overflow-hidden bg-gray-100 relative">
                          <img 
                            src={book.image_display} 
                            alt={book.title} 
                            onClick={() => { setSelectedBook(book); setActiveTab('detail'); }}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 cursor-pointer" 
                          />
                          <span className="absolute top-3 left-3 bg-[#2c1d11]/90 text-[#c5a880] text-xs px-2.5 py-1 rounded font-sans">
                            {book.format}
                          </span>
                          <button 
                            onClick={() => toggleWishlist(book.id)}
                            className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow hover:scale-110 transition"
                          >
                            <Heart className={`w-4 h-4 ${wishlist.includes(book.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                          </button>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <span className="text-[11px] text-[#c5a880] font-semibold uppercase tracking-wider mb-1">{book.category_name}</span>
                          <h3 onClick={() => { setSelectedBook(book); setActiveTab('detail'); }} className="font-serif font-bold text-lg mb-1 cursor-pointer hover:text-[#c5a880] transition">{book.title}</h3>
                          <p className="text-sm text-gray-500 mb-4">{book.author}</p>
                          <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="font-bold text-base">{book.price.toLocaleString()} so'm</span>
                            <button 
                              onClick={() => addToCart(book)}
                              className="bg-[#2c1d11] text-[#c5a880] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d2919] transition"
                            >
                              Savatga
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'catalog' && (
              <div className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-serif font-bold mb-8">Kitoblar Katalogi</h1>
                
                <div className="flex flex-col md:flex-row gap-4 sm:p-6">
                  <div className="w-full md:w-64 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="font-serif font-bold text-lg mb-4 flex items-center">
                        <Filter className="w-5 h-5 mr-2 text-[#c5a880]" /> Kategoriyalar
                      </h3>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => setSelectedCategory('Barchasi')}
                          className={`w-full text-left px-3 py-2 rounded-lg transition text-sm font-medium ${selectedCategory === 'Barchasi' ? 'bg-[#2c1d11] text-[#c5a880]' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          Barchasi
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition text-sm font-medium ${selectedCategory === cat.name ? 'bg-[#2c1d11] text-[#c5a880]' : 'hover:bg-gray-100 text-gray-700'}`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {filteredBooks.map((book) => (
                        <div key={book.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-xl transition flex flex-col relative">
                          <div className="h-60 overflow-hidden bg-gray-100 relative">
                            <img src={book.image_display} alt={book.title} onClick={() => { setSelectedBook(book); setActiveTab('detail'); }} className="w-full h-full object-cover hover:scale-105 transition duration-300 cursor-pointer" />
                            <span className="absolute top-3 left-3 bg-[#2c1d11]/90 text-[#c5a880] text-xs px-2.5 py-1 rounded font-sans">
                              {book.format}
                            </span>
                            <button 
                              onClick={() => toggleWishlist(book.id)}
                              className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow hover:scale-110 transition"
                            >
                              <Heart className={`w-4 h-4 ${wishlist.includes(book.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                            </button>
                          </div>
                          <div className="p-5 flex flex-col flex-grow">
                            <h3 onClick={() => { setSelectedBook(book); setActiveTab('detail'); }} className="font-serif font-bold text-lg mb-1 cursor-pointer hover:text-[#c5a880]">{book.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{book.description}</p>
                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                              <span className="font-bold text-base">{book.price.toLocaleString()} so'm</span>
                              <button 
                                onClick={() => addToCart(book)}
                                className="bg-[#2c1d11] text-[#c5a880] px-4 py-2 rounded-lg text-sm hover:bg-[#3d2919] transition"
                              >
                                Savatga
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEVIMLILAR (WISHLIST) SAHIFASI */}
            {activeTab === 'wishlist' && (
              <div className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-serif font-bold mb-8 flex items-center">
                  <Heart className="w-8 h-8 fill-red-500 text-red-500 mr-3" /> Sevimli Kitoblarim
                </h1>
                {wishlist.length === 0 ? (
                  <div className="bg-white p-16 rounded-xl text-center border border-gray-200">
                    <p className="text-gray-500 text-lg mb-4">Sevimlilar ro'yxatingiz bo'sh.</p>
                    <button onClick={() => setActiveTab('catalog')} className="bg-[#2c1d11] text-[#c5a880] px-6 py-3 rounded-lg font-bold">Kitob tanlash</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {books.filter(b => wishlist.includes(b.id)).map(book => (
                      <div key={book.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
                        <div className="h-60 overflow-hidden bg-gray-100 relative">
                          <img src={book.image_display} alt={book.title} className="w-full h-full object-cover cursor-pointer" onClick={() => { setSelectedBook(book); setActiveTab('detail'); }} />
                          <button onClick={() => toggleWishlist(book.id)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </button>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-serif font-bold text-lg mb-1">{book.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{book.author}</p>
                          <div className="mt-auto flex items-center justify-between pt-3 border-t">
                            <span className="font-bold">{book.price.toLocaleString()} so'm</span>
                            <button onClick={() => addToCart(book)} className="bg-[#2c1d11] text-[#c5a880] px-3 py-1.5 rounded text-sm">Savatga</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'detail' && selectedBook && (
              <div className="max-w-5xl mx-auto px-4 py-12">
                <button onClick={() => setActiveTab('catalog')} className="flex items-center font-semibold mb-6 hover:text-[#c5a880]">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Katalogga qaytish
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6">
                  <div className="h-[420px] bg-gray-100 rounded-lg overflow-hidden shadow">
                    <img src={selectedBook.image_display} alt={selectedBook.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="bg-[#c5a880]/20 text-xs px-3 py-1 rounded-full font-semibold uppercase">{selectedBook.category_name}</span>
                      <h1 className="text-3xl font-serif font-bold mt-3 mb-2">{selectedBook.title}</h1>
                      <p className="text-lg text-gray-600 mb-4">Muallif: <span className="font-semibold text-[#2c1d11]">{selectedBook.author}</span></p>
                      <p className="text-gray-700 leading-relaxed mb-6">{selectedBook.description}</p>
                      
                      <div className="border-t border-b py-4 my-4 space-y-2 text-sm text-gray-600">
                        <p>Nashriyot: <span className="font-semibold text-[#2c1d11]">{selectedBook.publisher}</span></p>
                        <p>Sahifalar soni: <span className="font-semibold text-[#2c1d11]">{selectedBook.pages} bet</span></p>
                        <p>Format: <span className="font-semibold text-[#2c1d11]">{selectedBook.format}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <span className="text-3xl font-serif font-bold">{selectedBook.price.toLocaleString()} so'm</span>
                      <button 
                        onClick={() => addToCart(selectedBook)}
                        className="bg-[#2c1d11] text-[#c5a880] px-8 py-3.5 rounded-lg font-bold hover:bg-[#3d2919] transition shadow"
                      >
                        Savatchaga qo'shish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'track' && (
              <div className="max-w-3xl mx-auto px-4 py-16">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <PackageCheck className="w-8 h-8 text-[#c5a880]" />
                    <div>
                      <h1 className="text-2xl font-serif font-bold">Buyurtma Holatini Tekshirish</h1>
                      <p className="text-sm text-gray-500">Buyurtma berishda ko'rsatilgan telefon raqamingizni kiriting</p>
                    </div>
                  </div>

                  <form onSubmit={handleTrackOrders} className="flex gap-3 mb-8">
                    <input 
                      type="text" required placeholder="+998 90 123 45 67"
                      value={trackPhone}
                      onChange={(e) => setTrackPhone(e.target.value)}
                      className="flex-grow px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#2c1d11]"
                    />
                    <button type="submit" disabled={isTracking} className="bg-[#2c1d11] text-[#c5a880] px-6 py-3 rounded-lg font-bold">
                      {isTracking ? "Qidirilmoqda..." : "Tekshirish"}
                    </button>
                  </form>

                  <div className="space-y-4">
                    {trackedOrders.map(order => (
                      <div key={order.id} className="border rounded-lg p-5 bg-[#fbf9f5]">
                        <div className="flex justify-between items-center border-b pb-3 mb-3">
                          <span className="font-bold">Buyurtma #{order.id}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${order.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {order.is_paid ? "To'langan" : "To'lanmagan"}
                            </span>
                            <span className="bg-[#2c1d11] text-[#c5a880] text-xs px-3 py-1 rounded-full font-semibold">
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{order.items_summary}</p>
                        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                          <span>To'lov turi: {order.payment_method}</span>
                          <span className="font-bold text-sm text-[#2c1d11]">Jami: {order.total_price.toLocaleString()} so'm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

                                    {activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="mb-8">
                  <h1 className="text-3xl font-serif font-bold text-gray-900">Shaxsiy Kabinet</h1>
                  <p className="text-sm text-gray-500 mt-1">Mijoz ma'lumotlari va ulangan plastik kartalar</p>
                </div>

                {/* Asosiy Grid qism */}
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:p-6">
                  {/* Kartalar bo'limi (2 ustun) */}
                  <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-xl text-gray-900">Mening Kartalarim</h3>
                      <span className="text-xs bg-[#f4efe6] text-[#2c1d11] px-3 py-1 rounded-full font-medium">Xavfsiz to'lov</span>
                    </div>

                    {/* Mavjud karta kartochkasi */}
                    <div className="bg-gradient-to-br from-[#1a110a] to-[#3d2919] text-white p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between h-44">
                      <div className="flex justify-between items-start">
                        <span className="font-mono tracking-widest text-lg font-bold text-[#c5a880]">UZCARD</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-500/30">Faol</span>
                      </div>
                      <div>
                        <p className="font-mono text-xl tracking-wider text-gray-200">8600 **** **** 1234</p>
                        <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
                          <span>Muddati: 12/28</span>
                          <span>Hisob egasi: MUHAMMADKARIM</span>
                        </div>
                      </div>
                    </div>

                    {/* Yangi karta qo'shish formasi */}
                    <div className="bg-[#fbf9f5] p-6 rounded-2xl border border-gray-200/80 space-y-4">
                      <h4 className="font-bold text-sm text-gray-800">Yangi karta qo'shish</h4>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Karta raqami</label>
                        <input 
                          type="text" 
                          placeholder="8600 0000 0000 0000" 
                          maxLength={19}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none font-mono text-sm focus:border-[#c5a880] transition shadow-sm"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Amal qilish muddati</label>
                          <input type="text" placeholder="MM/YY" maxLength={5} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none font-mono text-sm focus:border-[#c5a880] transition shadow-sm" />
                        </div>
                        <div className="w-1/2 flex items-end">
                          <button onClick={() => alert("Karta muvaffaqiyatli ulandi!")} className="w-full bg-[#2c1d11] text-[#c5a880] py-3 rounded-xl font-bold text-sm hover:bg-[#3d2919] transition shadow-md">
                            Qo'shish
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yon panel (1 ustun) - Tezkor ma'lumotlar */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                      <h4 className="font-serif font-bold text-lg text-gray-900">Statistika</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-[#fbf9f5] rounded-xl">
                          <span className="text-sm text-gray-600">Buyurtmalar:</span>
                          <span className="font-bold text-[#2c1d11]">3 ta</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#fbf9f5] rounded-xl">
                          <span className="text-sm text-gray-600">Sevimli kitoblar:</span>
                          <span className="font-bold text-[#2c1d11]">5 ta</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#2c1d11]/5 rounded-2xl p-6 border border-[#2c1d11]/10 text-center space-y-3">
                      <h5 className="font-serif font-bold text-[#2c1d11]">Yordam kerakmi?</h5>
                      <p className="text-xs text-gray-600">Savollar bo'yicha Telegram botimizga murojaat qiling.</p>
                      <a href="https://t.me/mkabooks_bot" target="_blank" rel="noreferrer" className="inline-block bg-[#2c1d11] text-[#c5a880] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#3d2919] transition">
                        Botga yozish &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}{activeTab === 'success' && (
              <div className="max-w-xl mx-auto px-4 py-24 text-center">
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                <h1 className="text-3xl font-serif font-bold mb-2">Buyurtmangiz muvaffaqiyatli qabul qilindi!</h1>
                {lastOrderId && <p className="text-[#c5a880] font-bold text-lg mb-4">Buyurtma raqami: #{lastOrderId}</p>}
                <p className="text-gray-600 mb-8">Tez orada operatorimiz siz bilan bog'lanadi.</p>
                <button onClick={() => setActiveTab('home')} className="bg-[#2c1d11] text-[#c5a880] px-6 py-3 rounded-lg font-bold">Bosh sahifa</button>
              </div>
            )}
          </>
        )}
      </main>

      {/* SAVATCHA YON OYNASI */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white p-6 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-serif font-bold">Sizning Savatchangiz ({totalItems})</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-black text-2xl font-bold">&times;</button>
              </div>

              <div className="flex-grow overflow-y-auto py-4 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-16">Savatchangiz bo'sh</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4">
                      <img src={item.image_display} alt={item.title} className="w-16 h-20 object-cover rounded" />
                      <div className="flex-grow ml-4">
                        <h4 className="font-serif font-bold text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">{item.price.toLocaleString()} so'm</p>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 border rounded hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-bold px-2">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 border rounded hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-800 text-xs font-semibold">O'chirish</button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  {/* PROMO-KOD INPUT */}
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        placeholder="Promo-kod (masalan: MKA2026)"
                        value={promoInput}
                        onChange={e => setPromoInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg uppercase outline-none focus:ring-1 focus:ring-[#2c1d11]"
                      />
                    </div>
                    <button onClick={handleApplyPromo} className="bg-[#2c1d11] text-[#c5a880] px-4 py-2 rounded-lg text-sm font-bold">Qo'llash</button>
                  </div>
                  {promoError && <p className="text-xs text-red-600">{promoError}</p>}
                  {appliedPromo && <p className="text-xs text-green-600 font-semibold">Promo-kod qo'shildi: {appliedPromo.code} (-{appliedPromo.discount_percent}%)</p>}

                  <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                    <span>Kitoblar summasi:</span>
                    <span>{subtotalPrice.toLocaleString()} so'm</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Chegirma ({appliedPromo.discount_percent}%):</span>
                      <span>-{discountAmount.toLocaleString()} so'm</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Yetkazib berish:</span>
                    <span>{deliveryFee === 0 ? "Bepul" : `${deliveryFee.toLocaleString()} so'm`}</span>
                  </div>
                  <div className="flex justify-between font-serif font-bold text-lg pt-2 border-t">
                    <span>Jami to'lov:</span>
                    <span>{finalTotal.toLocaleString()} so'm</span>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full bg-[#2c1d11] text-[#c5a880] py-3.5 rounded-lg font-bold hover:bg-[#3d2919] transition shadow mt-2"
                  >
                    Buyurtma berishga o'tish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUYURTMA RASMIYLASHTIRISH OYNASI */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 relative">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl font-bold">&times;</button>
            <h2 className="text-2xl font-serif font-bold mb-6">Yetkazib berish va To'lov usuli</h2>

            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ism va familiyangiz</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg outline-none" placeholder="Muhammadkarim" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqamingiz</label>
                <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg outline-none" placeholder="+998 90 123 45 67" />
              </div>
                            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yetkazib berish manzili (GPS)</label>
                <a 
                  href="https://t.me/mkabooks_bot" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-[#2c1d11] text-[#c5a880] py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-[#3d2919] transition shadow-md text-base"
                >
                  <span>📍 Telegram bot orqali lokatsiya yuborish</span>
                </a>
                <p className="text-xs text-gray-500 mt-2 text-center">Tugmani bosing va botga lokatsiyangizni yuboring.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To'lov usuli</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Click', 'Payme', 'Uzcard/Humo', 'Cash'].map(m => (
                    <button type="button" key={m} onClick={() => setFormData({...formData, paymentMethod: m})} className={`p-3 border rounded-lg text-sm font-semibold text-left transition ${formData.paymentMethod === m ? 'border-[#2c1d11] bg-[#2c1d11] text-[#c5a880]' : 'border-gray-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-[#2c1d11] text-[#c5a880] py-3.5 rounded-lg font-bold hover:bg-[#3d2919] transition shadow-lg text-lg mt-4">
                {formData.paymentMethod === 'Cash' ? `Buyurtmani tasdiqlash (${finalTotal.toLocaleString()} so'm)` : `To'lovga o'tish (${finalTotal.toLocaleString()} so'm)`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ONLAYN TO'LOV OYNASI */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 relative">
            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-serif font-bold mb-4">{formData.paymentMethod} To'lov Tizimi</h2>
            <div className="bg-[#fbf9f5] p-4 rounded-lg border mb-6 flex justify-between items-center">
              <span>Jami summa:</span>
              <span className="text-xl font-bold">{finalTotal.toLocaleString()} so'm</span>
            </div>
            <form onSubmit={handleConfirmOnlinePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Karta raqami</label>
                <input type="text" required maxLength={19} value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} placeholder="8600 0000 0000 0000" className="w-full px-4 py-3 border rounded-lg font-mono text-lg outline-none" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white py-3.5 rounded-lg font-bold hover:bg-green-700 transition shadow-lg text-lg">
                {isSubmitting ? "Tekshirilmoqda..." : "To'lovni tasdiqlash"}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-[#2c1d11] text-[#c5a880] py-10 text-center text-sm border-t border-[#c5a880]/20 mt-auto">
        <p className="font-serif text-lg font-bold text-white mb-2">MKA BOOKS</p>
        <p className="text-xs text-[#c5a880]/80">Bilim va ma'rifat maskani &copy; 2026.</p>
      </footer>
    </div>
  );
}

export default App;








