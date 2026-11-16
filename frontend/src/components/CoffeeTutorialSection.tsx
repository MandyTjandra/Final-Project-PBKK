'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  Compass,
  Flame,
  GraduationCap,
  Layers,
  Scale,
  Sparkles,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Coffee,
} from 'lucide-react';
import { BrewMethod } from '../types';

interface CoffeeTutorialSectionProps {
  onTryInCalculator: (method: BrewMethod, dose: number, ratio: number) => void;
  onExploreBeansByNote: (keyword: string) => void;
}

const GEAR_ITEMS: Array<{
  title: string;
  subtitle: string;
  image: string;
  level: string;
  method: BrewMethod;
  dose: number;
  ratio: number;
  grind: string;
  character: string;
  howItWorks: string;
  tips: string;
}> = [
  {
    title: 'Hario V60 & Gooseneck Kettle',
    subtitle: 'Pour-Over Cone Dripper',
    image: '/images/gear-v60-kettle.jpg',
    level: 'Pemula - Menengah',
    method: 'V60',
    dose: 15,
    ratio: 15,
    grind: 'Medium-Fine (seperti pasir halus)',
    character: 'Bersih, jernih (clean cup), aroma floral & fruity menonjol',
    howItWorks:
      'Kerucut bersudut 60° dengan alur spiral menjaga aliran udara saat air panas dituang perlahan menggunakan leher angsa (gooseneck kettle).',
    tips: 'Selalu lakukan "Bloom" 30–45 detik di awal dengan air 2–3× berat kopi agar gas CO₂ keluar merata.',
  },
  {
    title: 'AeroPress & Hario Switch',
    subtitle: 'Immersion & Hybrid Brewers',
    image: '/images/gear-aeropress-switch.jpg',
    level: 'Sangat Ramah Pemula',
    method: 'V60_SWITCH',
    dose: 16,
    ratio: 15.5,
    grind: 'Medium (seperti garam dapur)',
    character: 'Manis, body bulat, sangat konsisten & anti-gagal',
    howItWorks:
      'AeroPress menggunakan tekanan udara (plunger) untuk ekstraksi cepat, sedangkan Hario Switch punya katup buka-tutup untuk menggabungkan rendaman & tetesan.',
    tips: 'Sempurna untuk biji eksotis seperti Coffea Eugenioides atau pemula yang ingin hasil seduhan konsisten tanpa teknik tuang rumit.',
  },
  {
    title: 'French Press & Burr Grinder',
    subtitle: 'Full Immersion & Penggiling Presisi',
    image: '/images/gear-frenchpress-grinder.jpg',
    level: 'Pemula (Wajib Punya Grinder)',
    method: 'FRENCH_PRESS',
    dose: 30,
    ratio: 16.5,
    grind: 'Coarse (kasar seperti garam laut)',
    character: 'Tebal (full-bodied), creamy, minyak alami kopi terasa penuh',
    howItWorks:
      'Bubuk kopi direndam penuh lalu disaring saringan logam. Burr grinder menggiling biji dengan ukuran seragam agar hasil tidak terlalu pahit atau asam.',
    tips: 'Investasi terbaik pemula adalah Burr Grinder (bukan blade grinder) karena keseragaman bubuk menentukan 70% kelezatan seduhan.',
  },
  {
    title: 'Espresso Bar, Portafilter & Scale',
    subtitle: 'Tekanan 9 Bar & Timbangan Digital',
    image: '/images/gear-espresso-bar.jpg',
    level: 'Menengah (Menu Kafe)',
    method: 'GULA_AREN_LATTE',
    dose: 18,
    ratio: 11,
    grind: 'Fine / Extra-Fine (seperti tepung halus)',
    character: 'Pekat, ber-crema keemasan, pondasi Latte, Mont Blanc & Gula Aren',
    howItWorks:
      'Air panas bertekanan tinggi (~9 bar) menembus bubuk kopi padat di portafilter dalam 25–30 detik. Timbangan (scale) memastikan rasio 1:2 presisi.',
    tips: 'Gunakan WDT (jarum perata) dan tamper rata agar air tidak mencari celah bocor (channeling).',
  },
  {
    title: 'Origami Dripper & Cold Brew Carafe',
    subtitle: 'Ribbed Percolation & Cold Immersion',
    image: '/images/gear-coldbrew-origami.jpg',
    level: 'Pemula - Lanjutan',
    method: 'ORIGAMI_DRIPPER',
    dose: 15,
    ratio: 15.5,
    grind: 'Medium-Fine (Origami) / Extra-Coarse (Cold Brew)',
    character: 'Origami: cerah & manis; Cold Brew: lembut, rendah asam & cokelat',
    howItWorks:
      '20 lipatan porselen Origami memberi kontrol kecepatan seduh tinggi; Cold Brew merendam kopi 12–14 jam dengan air dingin untuk rasa super halus.',
    tips: 'Pakai paper filter kerucut di Origami untuk rasa clean, atau filter flat-bottom Kalita untuk rasa lebih manis.',
  },
];

const TASTING_FAMILIES = [
  {
    id: 'floral',
    name: 'Floral (Bunga)',
    color: 'border-purple-500/40 bg-purple-950/30 text-purple-300',
    badge: 'bg-purple-500/20 text-purple-300',
    examples: 'Jasmine, Bergamot, Honeysuckle, Rose Water, Chamomile',
    whereFound: 'Kopi Ethiopia Yirgacheffe, Panama Geisha, & Laurina proses Washed (Light Roast).',
    howToSpot: 'Tercium paling kuat saat kopi masih panas dan sesaat setelah diteguk lewat aroma hidung (retronasal).',
    searchKeyword: 'Jasmine',
  },
  {
    id: 'fruity',
    name: 'Fruity & Berry (Buah)',
    color: 'border-pink-500/40 bg-pink-950/30 text-pink-300',
    badge: 'bg-pink-500/20 text-pink-300',
    examples: 'Strawberry, Blueberry, Lychee, White Peach, Jackfruit',
    whereFound: 'Kopi proses Natural, Honey, Anaerobic & Thermal Shock dari Colombia, Ethiopia Guji, & Aceh Gayo.',
    howToSpot: 'Terasanya seperti jus buah segar atau selai manis di tengah lidah saat suhu kopi mulai hangat (50–60°C).',
    searchKeyword: 'Peach',
  },
  {
    id: 'citrus',
    name: 'Citrus & Bright Acidity',
    color: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300',
    examples: 'Meyer Lemon, Pink Grapefruit, Mandarin, Key Lime',
    whereFound: 'Kopi dataran tinggi Kenya, Ethiopia, & Toraja. Keasaman segar seperti buah, bukan asam cuka!',
    howToSpot: 'Memberi sensasi segar di samping lidah yang membuat air liur mengalir (juicy), sangat nikmat untuk Espresso Tonic atau Mont Blanc.',
    searchKeyword: 'Lemon',
  },
  {
    id: 'sweet',
    name: 'Sweet & Caramel (Manis Alami)',
    color: 'border-orange-500/40 bg-orange-950/30 text-orange-300',
    badge: 'bg-orange-500/20 text-orange-300',
    examples: 'Honeycomb, Palm Sugar (Gula Aren), Cotton Candy, Maple',
    whereFound: 'Kopi proses Honey (Bali, Costa Rica, Flores) hingga spesies langka Coffea Eugenioides.',
    howToSpot: 'Rasa manis lembut yang tertinggal lama di tenggorokan meski kopi diminum tanpa gula (black).',
    searchKeyword: 'Honey',
  },
  {
    id: 'nutty',
    name: 'Nutty & Cocoa (Kacang & Cokelat)',
    color: 'border-stone-500/40 bg-stone-800/70 text-stone-200',
    badge: 'bg-stone-700 text-stone-200',
    examples: 'Dark Chocolate, Milk Chocolate, Roasted Almond, Hazelnut',
    whereFound: 'Kopi Brazil, Sumatra, Flores, serta profil Medium hingga Dark Roast.',
    howToSpot: 'Sensasi creamy dan pahit-manis yang nyaman di langit-langit mulut, cocok dipadukan dengan susu (Latte, Cappuccino, Gula Aren).',
    searchKeyword: 'Chocolate',
  },
  {
    id: 'spicy',
    name: 'Spices & Exotic Herbs',
    color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300',
    examples: 'Cardamom, Cinnamon, Nutmeg, Lemongrass, Sweet Mint',
    whereFound: 'Kopi Yemen Haraz, Java Ijen, Sumatra Mandailing, & Brazil Aramosa.',
    howToSpot: 'Memberi sensasi hangat berempah atau sejuk herbal di akhir tegukan.',
    searchKeyword: 'Cinnamon',
  },
];

export default function CoffeeTutorialSection({
  onTryInCalculator,
  onExploreBeansByNote,
}: CoffeeTutorialSectionProps) {
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>('floral');
  const activeFlavor =
    TASTING_FAMILIES.find((f) => f.id === selectedFlavorId) ?? TASTING_FAMILIES[0];

  return (
    <div className="space-y-12">
      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/25 border border-stone-800 rounded-3xl p-6 md:p-10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <GraduationCap className="w-4 h-4" />
              Coffee 101 · Panduan Lengkap Pemula
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Kenali Alat Seduh, Biji Kopi, &{' '}
              <span className="text-amber-400">Tasting Wheel</span>
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Baru mulai mendalami dunia specialty coffee? Pelajari bentuk dan fungsi tiap alat seduh,
              perbedaan spesies kopi (dari Arabica hingga <strong>Coffea Eugenioides</strong>), cara membaca roda rasa
              (<em>Tasting Wheel</em>), hingga solusi bila kopimu terasa terlalu asam atau pahit.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
            <a
              href="#gear-gallery"
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-stone-950/90 border border-stone-800 hover:border-amber-500/50 transition-all text-[11px] sm:text-xs font-bold text-stone-200 flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-amber-400 shrink-0" /> 5 Set Alat Seduh
            </a>
            <a
              href="#coffee-basics"
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-stone-950/90 border border-stone-800 hover:border-amber-500/50 transition-all text-[11px] sm:text-xs font-bold text-stone-200 flex items-center gap-2"
            >
              <Coffee className="w-4 h-4 text-amber-400 shrink-0" /> Spesies & Roast
            </a>
            <a
              href="#tasting-wheel"
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-stone-950/90 border border-stone-800 hover:border-amber-500/50 transition-all text-[11px] sm:text-xs font-bold text-stone-200 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-amber-400 shrink-0" /> Tasting Wheel
            </a>
            <a
              href="#extraction-guide"
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-stone-950/90 border border-stone-800 hover:border-amber-500/50 transition-all text-[11px] sm:text-xs font-bold text-stone-200 flex items-center gap-2"
            >
              <Scale className="w-4 h-4 text-amber-400 shrink-0" /> Grind & Diagnosa
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 1: BREWING GEAR GALLERY */}
      <section id="gear-gallery" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <Wrench className="w-5 h-5 text-amber-400" />
              1. Mengenal Alat-Alat Seduh Kopi (Brewing Gear)
            </h3>
            <p className="text-xs md:text-sm text-stone-400 mt-1">
              Setiap alat menghasilkan karakter rasa berbeda. Klik <strong>Coba di Kalkulator</strong> untuk langsung melihat takaran air & langkah seduhnya.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {GEAR_ITEMS.map((gear) => (
            <div
              key={gear.title}
              className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden flex flex-col hover:border-amber-500/40 transition-all shadow-lg"
            >
              <div className="relative h-56 w-full bg-stone-950">
                <Image
                  src={gear.image}
                  alt={gear.title}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-stone-950/85 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                    {gear.level}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col space-y-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {gear.subtitle}
                  </div>
                  <h4 className="text-lg font-extrabold text-white mt-0.5">{gear.title}</h4>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">{gear.howItWorks}</p>

                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 space-y-1.5 text-xs">
                  <div>
                    <span className="text-stone-500 font-semibold">Ukuran Gilingan: </span>
                    <span className="text-stone-200 font-bold">{gear.grind}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-semibold">Karakter Rasa: </span>
                    <span className="text-amber-300 font-semibold">{gear.character}</span>
                  </div>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-[11px] text-emerald-200 leading-relaxed">
                  <strong className="text-emerald-400">Tips Pemula:</strong> {gear.tips}
                </div>

                <button
                  onClick={() => onTryInCalculator(gear.method, gear.dose, gear.ratio)}
                  className="mt-auto w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-100 text-xs font-extrabold transition-all flex items-center justify-center gap-2 border border-stone-700 hover:border-amber-500"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Coba di Ratio Calculator (1:{gear.ratio})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: COFFEE KNOWLEDGE 101 */}
      <section id="coffee-basics" className="space-y-6">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            2. Penjelasan Dasar Kopi: Spesies, Proses, & Roast Level
          </h3>
          <p className="text-xs md:text-sm text-stone-400 mt-1">
            Tiga faktor utama di kebun & roastery yang menentukan apakah segelas kopi terasa seperti teh melati, buah beri, atau cokelat pekat.
          </p>
        </div>

        {/* Species Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: 'Coffea Arabica',
              tag: 'Paling Populer (~60% dunia)',
              desc: 'Tumbuh di dataran tinggi (1.000–2.200m). Kaya aroma floral, buah, & keasaman kompleks. Kafein lebih rendah (~1.2%).',
              accent: 'border-amber-500/30',
            },
            {
              name: 'Coffea Canephora (Robusta)',
              tag: 'Body Tebal & Crema Kuat',
              desc: 'Tahan di dataran rendah dengan kafein tinggi (~2.2%). Rasa earthy, cokelat pekat, & pahit mantap—sering dipakai untuk es kopi susu.',
              accent: 'border-stone-700',
            },
            {
              name: 'Coffea Liberica',
              tag: 'Eksotis Nusantara',
              desc: 'Biji berukuran besar dari pesisir/lahan gambut (seperti Kepulauan Meranti). Aroma unik nangka matang, pandan, & berry wine.',
              accent: 'border-emerald-500/30',
            },
            {
              name: 'Coffea Eugenioides',
              tag: 'Ultra-Langka · 0.2% Kafein',
              desc: 'Salah satu induk genetik Arabica. Hampir tanpa rasa pahit dan punya manis alami mirip stevia, cotton candy, & marshmallow.',
              accent: 'border-purple-500/30',
            },
          ].map((sp) => (
            <div
              key={sp.name}
              className={`bg-stone-900 border ${sp.accent} rounded-2xl p-5 space-y-2 shadow-md`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {sp.tag}
              </div>
              <h4 className="font-extrabold text-base text-white">{sp.name}</h4>
              <p className="text-xs text-stone-300 leading-relaxed">{sp.desc}</p>
            </div>
          ))}
        </div>

        {/* Processing & Roast Level Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Processing Methods */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
            <h4 className="font-black text-base text-white flex items-center gap-2">
              <Droplets className="w-4 h-4 text-amber-400" />
              Metode Proses Biji Kopi (Post-Harvest)
            </h4>
            <div className="space-y-3">
              {[
                {
                  title: 'Washed (Full Wash)',
                  note: 'Jernih, Floral, Clean Acidity',
                  desc: 'Daging buah dicuci bersih dengan air sebelum dijemur. Menghasilkan rasa paling bersih sehingga karakter asal daerah terasa jelas.',
                },
                {
                  title: 'Natural (Dry Process)',
                  note: 'Fruity, Berry Jam, Syrupy',
                  desc: 'Buah ceri kopi dijemur utuh bersama kulitnya. Gula buah meresap ke biji, menciptakan rasa stroberi, nangka, atau cokelat manis.',
                },
                {
                  title: 'Honey Process',
                  note: 'Seimbang, Madu, Caramel',
                  desc: 'Sebagian lendir manis (mucilage) dibiarkan menempel saat penjemuran. Menggabungkan kejernihan Washed dan manisnya Natural.',
                },
                {
                  title: 'Anaerobic / Experimental',
                  note: 'Eksplosif, Tropis, Winey',
                  desc: 'Difermentasi di tangki kedap oksigen (atau thermal shock). Menghasilkan aroma intens seperti leci, mangga, permen, dan rempah.',
                },
              ].map((proc) => (
                <div key={proc.title} className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-extrabold text-xs text-white">{proc.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                      {proc.note}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{proc.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Roast Levels */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
            <h4 className="font-black text-base text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Tingkat Sangrai (Roast Level)
            </h4>
            <div className="space-y-3">
              {[
                {
                  level: 'LIGHT ROAST',
                  swatch: 'bg-amber-700',
                  temp: 'Suhu seduh ideal: 92–96°C',
                  desc: 'Warna cokelat muda tanpa minyak di permukaan. Keasaman cerah, aroma bunga & buah asli terjaga. Terbaik untuk V60, Origami, Switch.',
                },
                {
                  level: 'LIGHT-MEDIUM ROAST',
                  swatch: 'bg-amber-800',
                  temp: 'Suhu seduh ideal: 90–93°C',
                  desc: 'Sweet spot untuk pemula: mempertahankan keasaman buah yang ramah sekaligus memunculkan manis karamel & madu.',
                },
                {
                  level: 'MEDIUM ROAST',
                  swatch: 'bg-amber-900',
                  temp: 'Suhu seduh ideal: 88–92°C',
                  desc: 'Keseimbangan manis gula aren, kacang panggang, dan cokelat susu. Sangat fleksibel untuk manual brew maupun espresso modern.',
                },
                {
                  level: 'DARK ROAST',
                  swatch: 'bg-stone-950 border border-stone-600',
                  temp: 'Suhu seduh ideal: 85–90°C',
                  desc: 'Warna cokelat gelap mengilap. Rendah asam, body tebal, rasa dark chocolate & smoky caramel—juara untuk Espresso, Dirty Latte, & Gula Aren.',
                },
              ].map((roast) => (
                <div key={roast.level} className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5 flex gap-3.5 items-start">
                  <div className={`w-8 h-8 rounded-xl shrink-0 mt-0.5 ${roast.swatch}`} />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-xs text-white">{roast.level}</span>
                      <span className="text-[10px] font-semibold text-amber-400">{roast.temp}</span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed">{roast.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE TASTING WHEEL */}
      <section id="tasting-wheel" className="bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-400" />
            3. Memahami Coffee Tasting Wheel (Roda Rasa Kopi)
          </h3>
          <p className="text-xs md:text-sm text-stone-400 mt-1">
            <em>Tasting notes</em> bukan berarti kopi diberi perasa tambahan—melainkan senyawa aroma alami di dalam biji kopi. Klik kategori rasa di samping roda untuk mempelajarinya.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full max-w-lg mx-auto rounded-3xl overflow-hidden border border-stone-700 bg-[#ebe8df] shadow-2xl">
              <Image
                src="/images/coffee-tasting-wheel.jpg"
                alt="Specialty Coffee Flavor Tasting Wheel"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-contain p-1.5"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Pilih Keluarga Rasa pada Tasting Wheel:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TASTING_FAMILIES.map((family) => (
                <button
                  key={family.id}
                  onClick={() => setSelectedFlavorId(family.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-extrabold transition-all ${
                    selectedFlavorId === family.id
                      ? `${family.color} shadow-md`
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  {family.name}
                </button>
              ))}
            </div>

            <div className={`rounded-2xl border p-5 space-y-3 ${activeFlavor.color}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-black text-white">{activeFlavor.name}</h4>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${activeFlavor.badge}`}>
                  Contoh Notes: {activeFlavor.examples}
                </span>
              </div>

              <div className="space-y-2 text-xs text-stone-200 leading-relaxed">
                <p>
                  <strong className="text-white">Sering ditemukan pada:</strong> {activeFlavor.whereFound}
                </p>
                <p>
                  <strong className="text-white">Cara mengenalinya saat minum:</strong> {activeFlavor.howToSpot}
                </p>
              </div>

              <button
                onClick={() => onExploreBeansByNote(activeFlavor.searchKeyword)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-black transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Cari Beans dengan Note &ldquo;{activeFlavor.searchKeyword}&rdquo;
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: GRIND SIZE, GOLDEN RATIO & TROUBLESHOOTING */}
      <section id="extraction-guide" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grind Size & Golden Ratio */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            4. Panduan Ukuran Gilingan & Golden Ratio
          </h3>
          <p className="text-xs text-stone-400">
            Semakin cepat waktu kontak air dengan kopi, semakin halus gilingan yang dibutuhkan.
          </p>

          <div className="space-y-2.5">
            {[
              {
                size: 'Extra-Fine / Fine',
                texture: 'Seperti tepung halus / gula kastor',
                use: 'Espresso, Dirty Latte, Gula Aren Latte (25–30 detik)',
                ratio: '1:2 (base espresso)',
              },
              {
                size: 'Medium-Fine',
                texture: 'Seperti garam halus / pasir pantai',
                use: 'Hario V60, Origami Dripper, Japanese Iced V60 (2.5–3 menit)',
                ratio: '1:15 – 1:16',
              },
              {
                size: 'Medium',
                texture: 'Seperti pasir bangunan / garam meja',
                use: 'Kalita Wave, AeroPress, Hario Switch (2–3.5 menit)',
                ratio: '1:11 – 1:15.5',
              },
              {
                size: 'Coarse / Extra-Coarse',
                texture: 'Seperti garam laut / lada tumbuk kasar',
                use: 'French Press (4–7 menit) & Cold Brew (12–14 jam)',
                ratio: '1:8 (Cold Brew) · 1:16 (French Press)',
              },
            ].map((g) => (
              <div key={g.size} className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold text-xs text-amber-400">{g.size}</div>
                  <div className="text-[11px] text-stone-300">{g.texture}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{g.use}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 text-[11px] font-mono font-bold text-stone-200 self-start sm:self-center shrink-0">
                  {g.ratio}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Extraction Troubleshooting */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            5. Diagnosa Rasa Seduhan (Coffee Compass Pemula)
          </h3>
          <p className="text-xs text-stone-400">
            Jangan bingung jika seduhan pertamamu kurang pas—cukup ubah <strong>1 variabel</strong> saja setiap mencoba lagi:
          </p>

          <div className="space-y-3">
            <div className="bg-amber-950/30 border border-amber-700/40 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-black text-amber-300 uppercase">
                Jika Kopi Terasa Terlalu Asam, Tajam, & Encer (Under-Extracted)
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Air terlalu cepat melewati bubuk kopi sehingga gula manisnya belum sempat terekstrak.
              </p>
              <div className="text-[11px] font-bold text-amber-200 pt-1">
                ✓ Solusi: Giling lebih HALUS · Naikkan suhu air (+2°C) · Tambah waktu seduh atau kurangi dosis kopi sedikit.
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-black text-emerald-300 uppercase">
                Sweet Spot — Manis, Jernih, & Seimbang (Ideal Extraction)
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Keasaman buah terasa menyegarkan, rasa manis alami muncul di lidah, dan aftertaste nyaman tanpa rasa sepat di tenggorokan.
              </p>
            </div>

            <div className="bg-rose-950/30 border border-rose-700/40 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-black text-rose-300 uppercase">
                Jika Kopi Terasa Terlalu Pahit, Sepat, & Kering (Over-Extracted)
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Air mengekstrak terlalu banyak senyawa pahit & tanin dari ampas kopi.
              </p>
              <div className="text-[11px] font-bold text-rose-200 pt-1">
                ✓ Solusi: Giling lebih KASAR · Turunkan suhu air (misal 88–90°C) · Tuang lebih pelan tanpa banyak adukan.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
