import React from 'react';

interface Book {
  id: number;
  title: string;
  author: string;
  price: string;
  image: string;
  format: 'Qog\'oz' | 'Elektron' | 'Ikkalasi';
}

const FEATURED_BOOKS: Book[] = [
  { id: 1, title: "1984", author: "George Orwell", price: "45,000 so'm", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=500&q=60", format: "Ikkalasi" },
  { id: 2, title: "Atomic Habits", author: "James Clear", price: "60,000 so'm", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=500&q=60", format: "Qog'oz" },
  { id: 3, title: "Martin Eden", author: "Jack London", price: "50,000 so'm", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=60", format: "Elektron" },
  { id: 4, title: "Sariq Devni Minib", author: "Xudoyberdi To'xtaboyev", price: "40,000 so'm", image: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=500&q=60", format: "Qog'oz" },
];

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      <section className="bg-[#2c1d11] text-[#fbf9f5] py-20 px-4 text-center border-b-4 border-[#c5a880]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 tracking-wide">
            Bilim — Eng Buyuk Sayohat
          </h1>
          <p className="text-lg md:text-xl text-[#c5a880] mb-8 font-light">
            MKA BOOKS bilan klassik asarlar va zamonaviy bestsellerlarni qog'oz va elektron formatda o'qing.
          </p>
          <button className="bg-[#c5a880] text-[#2c1d11] font-bold px-8 py-3 rounded-md hover:bg-white transition shadow-lg text-lg">
            Katalogni Ko'rish
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-10 border-b border-[#c5a880]/30 pb-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#2c1d11]">Tavsiya etilgan kitoblar</h2>
            <p className="text-gray-600 text-sm mt-1">Kitobxonlarimiz tomonidan eng ko'p o'qilayotgan asarlar</p>
          </div>
          <a href="#" className="text-[#2c1d11] font-semibold hover:text-[#c5a880] transition">Barchasini ko'rish &rarr;</a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {FEATURED_BOOKS.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition flex flex-col">
              <div className="h-64 overflow-hidden bg-gray-100 relative">
                <img src={book.image} alt={book.title} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                <span className="absolute top-3 right-3 bg-[#2c1d11] text-[#c5a880] text-xs px-2 py-1 rounded font-sans">
                  {book.format}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-serif font-bold text-lg text-[#2c1d11] mb-1">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{book.author}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[#2c1d11] font-bold text-base">{book.price}</span>
                  <button className="bg-[#2c1d11] text-[#c5a880] px-4 py-2 rounded text-sm hover:bg-[#3d2919] transition">
                    Savatga
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
