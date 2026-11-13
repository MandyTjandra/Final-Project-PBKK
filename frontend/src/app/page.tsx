'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Coffee,
  Scale,
  BookOpen,
  Package,
  Search,
  Filter,
  Flame,
  Clock,
  Star,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  User as UserIcon,
  ChevronRight,
  LogOut,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  BrewMethod,
  BrewRecipe,
  CoffeeBean,
  ProcessMethod,
  RatioCalculationResult,
  RoastLevel,
  User,
} from '../types';

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function Home() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'beans' | 'recipes' | 'calculator' | 'roastery'>('beans');

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'BREWER' | 'ROASTER'>('BREWER');
  const [authError, setAuthError] = useState('');

  // Data State
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [recipes, setRecipes] = useState<BrewRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter State
  const [beanSearch, setBeanSearch] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [selectedRoast, setSelectedRoast] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  // Calculator State
  const [calcMethod, setCalcMethod] = useState<BrewMethod>('V60');
  const [calcDose, setCalcDose] = useState<number>(15);
  const [calcRatio, setCalcRatio] = useState<number>(15);
  const [calcResult, setCalcResult] = useState<RatioCalculationResult | null>(null);

  // Live Brew Stopwatch / Assistant
  const [isBrewing, setIsBrewing] = useState(false);
  const [brewSeconds, setBrewSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Selected Recipe Details Modal
  const [selectedRecipe, setSelectedRecipe] = useState<BrewRecipe | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // New Recipe Modal
  const [showNewRecipeModal, setShowNewRecipeModal] = useState(false);
  const [newRecipeTitle, setNewRecipeTitle] = useState('');
  const [newRecipeMethod, setNewRecipeMethod] = useState<BrewMethod>('V60');
  const [newRecipeGrind, setNewRecipeGrind] = useState('Medium-Fine (18 Clicks)');
  const [newRecipeDose, setNewRecipeDose] = useState(15);
  const [newRecipeRatio, setNewRecipeRatio] = useState(15);
  const [newRecipeTemp, setNewRecipeTemp] = useState(92);
  const [newRecipeTime, setNewRecipeTime] = useState(180);
  const [newRecipeSteps, setNewRecipeSteps] = useState<Array<{ startTimeSeconds: number; waterAmountMl: number; instruction: string }>>([
    { startTimeSeconds: 0, waterAmountMl: 45, instruction: 'Bloom 45g and gentle slurry swirl' },
    { startTimeSeconds: 45, waterAmountMl: 90, instruction: 'Second pour in steady concentric circles' },
    { startTimeSeconds: 90, waterAmountMl: 90, instruction: 'Final pour up to target weight, let draw down' },
  ]);

  // New Bean Modal (Roastery)
  const [showNewBeanModal, setShowNewBeanModal] = useState(false);
  const [newBeanName, setNewBeanName] = useState('');
  const [newBeanOrigin, setNewBeanOrigin] = useState('');
  const [newBeanVarietal, setNewBeanVarietal] = useState('');
  const [newBeanProcess, setNewBeanProcess] = useState<ProcessMethod>('WASHED');
  const [newBeanRoast, setNewBeanRoast] = useState<RoastLevel>('LIGHT');
  const [newBeanStock, setNewBeanStock] = useState(2500);
  const [newBeanThreshold, setNewBeanThreshold] = useState(500);
  const [newBeanPrice, setNewBeanPrice] = useState(140000);
  const [newBeanNotes, setNewBeanNotes] = useState('Floral, Citrus, Peach');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [beansRes, recipesRes] = await Promise.all([
        api.getBeans({
          search: beanSearch,
          process: selectedProcess || undefined,
          roastLevel: selectedRoast || undefined,
        }),
        api.getRecipes({
          method: selectedMethod || undefined,
        }),
      ]);
      setBeans(beansRes.data);
      setRecipes(recipesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [beanSearch, selectedProcess, selectedRoast, selectedMethod]);

  const calculateLiveRatio = useCallback(async () => {
    try {
      const result = await api.calculateRatio({
        coffeeDoseGrams: calcDose,
        targetRatio: calcRatio,
        method: calcMethod,
      });
      setCalcResult(result);
    } catch (err) {
      console.error(err);
    }
  }, [calcDose, calcRatio, calcMethod]);

  // Hydrate saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('brewlab_user');
    if (!savedUser) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        setCurrentUser(JSON.parse(savedUser) as User);
      } catch {
        // Ignore invalid stored user JSON
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load beans & recipes whenever filters or search change
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Recalculate ratio when parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      void calculateLiveRatio();
    }, 0);
    return () => clearTimeout(timer);
  }, [calculateLiveRatio]);

  // Timer effect
  useEffect(() => {
    if (isBrewing) {
      timerRef.current = setInterval(() => {
        setBrewSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBrewing]);

  const handleQuickLogin = async (email: string, role: string) => {
    try {
      const res = await api.login({ email, password: 'password123' });
      setCurrentUser(res.user);
      showNotification(`Switched session to ${res.user.name} (${role})`);
    } catch {
      showNotification('Quick login failed. Verify backend is active.', 'error');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showNotification('Logged out successfully');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const res = await api.login({ email: authEmail, password: authPassword });
        setCurrentUser(res.user);
        showNotification(`Welcome back, ${res.user.name}!`);
      } else {
        const res = await api.register({
          email: authEmail,
          password: authPassword,
          name: authName,
          role: authRole,
        });
        setCurrentUser(res.user);
        showNotification(`Account created! Welcome, ${res.user.name}!`);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err: unknown) {
      setAuthError(getErrorMessage(err, 'Authentication failed'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) {
      showNotification('Please log in first to upload files', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      setUploadedImageUrl(`http://localhost:3001${res.url}`);
      showNotification('Image uploaded & saved to local storage!');
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'File upload failed'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateBean = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBean({
        name: newBeanName,
        origin: newBeanOrigin,
        varietal: newBeanVarietal,
        process: newBeanProcess,
        roastLevel: newBeanRoast,
        altitudeMasl: 1600,
        stockGrams: Number(newBeanStock),
        minStockThreshold: Number(newBeanThreshold),
        price: Number(newBeanPrice),
        tastingNotes: newBeanNotes,
        imageUrl: uploadedImageUrl || 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600',
      });
      showNotification('Single-origin bean successfully cataloged!');
      setShowNewBeanModal(false);
      void loadData();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Failed to create bean'), 'error');
    }
  };

  const handleUpdateStock = async (beanId: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    try {
      await api.updateBeanStock(beanId, newStock);
      showNotification(`Stock updated to ${newStock}g`);
      void loadData();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Failed to update stock'), 'error');
    }
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showNotification('Please login to create a recipe', 'error');
      return;
    }

    try {
      const totalWater = Math.round(newRecipeDose * newRecipeRatio);
      await api.createRecipe({
        title: newRecipeTitle,
        method: newRecipeMethod,
        grindSize: newRecipeGrind,
        coffeeDoseGrams: Number(newRecipeDose),
        targetRatio: Number(newRecipeRatio),
        totalWaterMl: totalWater,
        waterTempCelsius: Number(newRecipeTemp),
        totalBrewTimeSeconds: Number(newRecipeTime),
        difficulty: 'BEGINNER',
        pourSteps: newRecipeSteps.map((s, idx) => ({
          stepOrder: idx + 1,
          startTimeSeconds: Number(s.startTimeSeconds),
          waterAmountMl: Number(s.waterAmountMl),
          instruction: s.instruction,
        })),
      });

      showNotification('Recipe and pour steps published!');
      setShowNewRecipeModal(false);
      void loadData();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Failed to publish recipe'), 'error');
    }
  };

  const handleAddReview = async () => {
    if (!selectedRecipe || !currentUser) {
      showNotification('Please log in to leave a review', 'error');
      return;
    }

    try {
      await api.addReview(selectedRecipe.id, reviewRating, reviewComment);
      showNotification('Review submitted!');
      setReviewComment('');
      const updated = await api.getRecipeById(selectedRecipe.id);
      setSelectedRecipe(updated);
      void loadData();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Failed to submit review'), 'error');
    }
  };

  // Helper for color-coded tasting note tags
  const getNoteBadgeStyle = (note: string) => {
    const n = note.toLowerCase();
    if (n.includes('jasmine') || n.includes('rose') || n.includes('floral') || n.includes('blossom')) {
      return 'bg-purple-950/70 border-purple-800 text-purple-300';
    }
    if (n.includes('peach') || n.includes('strawberry') || n.includes('lychee') || n.includes('berry') || n.includes('grape')) {
      return 'bg-pink-950/70 border-pink-800 text-pink-300';
    }
    if (n.includes('lemon') || n.includes('bergamot') || n.includes('citrus') || n.includes('orange') || n.includes('lime')) {
      return 'bg-amber-950/70 border-amber-800 text-amber-300';
    }
    if (n.includes('rum') || n.includes('jackfruit') || n.includes('wine') || n.includes('ferment')) {
      return 'bg-rose-950/70 border-rose-800 text-rose-300';
    }
    return 'bg-stone-800/80 border-stone-700 text-stone-300';
  };

  // Inventory stats for roaster
  const totalStockKg = (beans.reduce((acc, b) => acc + b.stockGrams, 0) / 1000).toFixed(1);
  const lowStockCount = beans.filter((b) => b.stockGrams <= b.minStockThreshold).length;
  const inventoryValuation = beans.reduce((acc, b) => acc + (b.stockGrams / (b.bagSizeGrams || 250)) * b.price, 0);

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex flex-col font-sans selection:bg-amber-800 selection:text-amber-100">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-3 transition-all transform animate-bounce ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/90 border-rose-700 text-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span className="font-semibold text-xs">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Bar / Role Switcher Demo Toolbar */}
      <div className="bg-stone-900/90 border-b border-stone-800/80 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">NestJS (Modular) + Prisma ORM + PostgreSQL/SQLite</span>
          <span className="text-stone-700">|</span>
          <span className="text-amber-400 font-bold">Quick Demo RBAC Switcher:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuickLogin('roaster@morningglory.com', 'ROASTER')}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              currentUser?.role === 'ROASTER'
                ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md font-bold'
                : 'bg-stone-850 border-stone-750 hover:bg-stone-800 text-stone-300'
            }`}
          >
            Roaster Account (Manage Stock & Catalog)
          </button>
          <button
            onClick={() => handleQuickLogin('barista.alex@brewlab.com', 'BREWER')}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              currentUser?.role === 'BREWER'
                ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md font-bold'
                : 'bg-stone-850 border-stone-750 hover:bg-stone-800 text-stone-300'
            }`}
          >
            Brewer Account (Recipes & Reviews)
          </button>
          <button
            onClick={() => handleQuickLogin('admin@brewlab.com', 'ADMIN')}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              currentUser?.role === 'ADMIN'
                ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md font-bold'
                : 'bg-stone-850 border-stone-750 hover:bg-stone-800 text-stone-300'
            }`}
          >
            Admin Account
          </button>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-stone-900/90 border-b border-stone-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('beans')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/30">
              <Coffee className="w-6 h-6 text-stone-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
                BrewLab <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">PRO</span>
              </div>
              <div className="text-[11px] text-stone-400 font-medium">Single-Origin Coffee Hub & Recipe Dial-in</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-950/80 p-1.5 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveTab('beans')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'beans'
                  ? 'bg-stone-850 text-amber-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              Origins Catalog ({beans.length})
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'recipes'
                  ? 'bg-stone-850 text-amber-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Brew Guides ({recipes.length})
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'calculator'
                  ? 'bg-stone-850 text-amber-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Ratio Calculator
            </button>
            <button
              onClick={() => setActiveTab('roastery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'roastery'
                  ? 'bg-stone-850 text-amber-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Roastery Stock
              {lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>
          </nav>

          {/* User Account / Auth Button */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-stone-850 pl-3 pr-2 py-1.5 rounded-xl border border-stone-750">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-200">{currentUser.name}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    {currentUser.role}
                  </div>
                </div>
                <Image
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.name}
                  width={32}
                  height={32}
                  unoptimized
                  className="w-8 h-8 rounded-lg object-cover border border-stone-700"
                />
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 hover:bg-stone-750 text-stone-400 hover:text-rose-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-900/30"
              >
                <UserIcon className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-900 via-stone-900 to-[#0c0a09] border-b border-stone-800/80 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5" />
              Specialty Coffee Manual Brew Ecosystem
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3 leading-tight">
              Single-Origin Coffee Hub & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                Precision Extraction Dial-in.
              </span>
            </h1>
            <p className="text-stone-400 text-xs md:text-sm leading-relaxed">
              Track single-origin beans, compute dynamic water timelines per second, and share community brew recipes for V60, AeroPress, Kalita Wave, French Press, and Cold Brew.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto relative">
            {loading && (
              <span className="col-span-3 text-right text-[11px] font-semibold text-amber-400 animate-pulse">
                Syncing catalog...
              </span>
            )}
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl text-center shadow-lg">
              <div className="text-2xl font-black text-amber-400">{beans.length}</div>
              <div className="text-[11px] text-stone-400 mt-1">Origins Cataloged</div>
            </div>
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl text-center shadow-lg">
              <div className="text-2xl font-black text-amber-400">{recipes.length}</div>
              <div className="text-[11px] text-stone-400 mt-1">Brew Guides</div>
            </div>
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl text-center shadow-lg">
              <div className="text-2xl font-black text-emerald-400">{totalStockKg} kg</div>
              <div className="text-[11px] text-stone-400 mt-1">Stock on Hand</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* TAB 1: BEANS EXPLORER */}
        {activeTab === 'beans' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search by origin (Panama, Ethiopia, Aceh...), varietal, or tasting notes..."
                  value={beanSearch}
                  onChange={(e) => setBeanSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full bg-stone-950 border border-stone-800 pl-10 pr-4 py-2 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Filter Process */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-stone-400 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Process:
                </span>
                {['', 'WASHED', 'NATURAL', 'HONEY', 'ANAEROBIC', 'EXPERIMENTAL'].map((proc) => (
                  <button
                    key={proc}
                    onClick={() => setSelectedProcess(proc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedProcess === proc
                        ? 'bg-amber-600 text-stone-950'
                        : 'bg-stone-850 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {proc || 'All'}
                  </button>
                ))}
              </div>

              {/* Filter Roast Level */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-stone-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Roast:
                </span>
                {['', 'LIGHT', 'LIGHT_MEDIUM', 'MEDIUM', 'DARK'].map((roast) => (
                  <button
                    key={roast}
                    onClick={() => setSelectedRoast(roast)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedRoast === roast
                        ? 'bg-amber-600 text-stone-950'
                        : 'bg-stone-850 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {roast ? roast.replace('_', ' ') : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Beans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beans.map((bean) => (
                <div
                  key={bean.id}
                  className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all flex flex-col group shadow-md"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-stone-950">
                    <Image
                      src={bean.imageUrl || 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600'}
                      alt={bean.name}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-stone-950/85 backdrop-blur-md text-amber-400 border border-amber-500/30">
                        {bean.process}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-stone-950/85 backdrop-blur-md text-stone-300 border border-stone-700">
                        {bean.roastLevel.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Stock status badge */}
                    <div className="absolute bottom-3 right-3">
                      {bean.stockGrams <= bean.minStockThreshold ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-rose-950/90 border border-rose-700 text-rose-300 shadow-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Low Stock: {bean.stockGrams}g
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-emerald-950/90 border border-emerald-700 text-emerald-300 shadow-md">
                          In Stock: {bean.stockGrams}g
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-xs text-stone-400 mb-1 flex items-center justify-between">
                        <span className="font-semibold text-amber-300">{bean.origin}</span>
                        {bean.altitudeMasl && <span>{bean.altitudeMasl} masl</span>}
                      </div>
                      <h3 className="font-black text-lg text-white group-hover:text-amber-400 transition-colors leading-snug">
                        {bean.name}
                      </h3>
                      <div className="text-xs text-stone-500 mt-1 mb-3">
                        Varietal: <span className="text-stone-300 font-medium">{bean.varietal}</span>
                      </div>

                      {/* Description snippet */}
                      {bean.description && (
                        <p className="text-xs text-stone-400 line-clamp-2 mb-3 leading-relaxed">
                          {bean.description}
                        </p>
                      )}

                      {/* Color-Coded Sensory Flavor Notes */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {bean.tastingNotes.split(',').map((note, idx) => (
                          <span
                            key={idx}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${getNoteBadgeStyle(
                              note,
                            )}`}
                          >
                            {note.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-stone-800 pt-4 flex items-center justify-between mt-auto">
                      <div>
                        <div className="text-[10px] text-stone-500 uppercase font-semibold">Price per bag</div>
                        <div className="text-base font-black text-amber-400">
                          Rp {bean.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setCalcDose(15);
                          setActiveTab('calculator');
                          showNotification(`Loaded ${bean.name} into Brew Calculator!`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200 text-xs font-extrabold transition-all"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Dial In Recipe
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BREW GUIDES & RECIPES */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-stone-400 font-bold flex items-center gap-1 mr-1">
                  Device:
                </span>
                {[
                  { id: '', label: 'All Devices' },
                  { id: 'V60', label: 'Hario V60' },
                  { id: 'AEROPRESS', label: 'AeroPress' },
                  { id: 'KALITA_WAVE', label: 'Kalita Wave' },
                  { id: 'FRENCH_PRESS', label: 'French Press' },
                  { id: 'COLD_BREW', label: 'Cold Brew' },
                  { id: 'CAFE_LATTE', label: '☕ Caffè Latte' },
                  { id: 'CAPPUCCINO', label: '☕ Cappuccino' },
                  { id: 'FLAT_WHITE', label: '☕ Flat White' },
                  { id: 'AMERICANO', label: '☕ Americano' },
                  { id: 'ESPRESSO', label: '☕ Espresso' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedMethod === m.id
                        ? 'bg-amber-600 text-stone-950 font-black shadow-md'
                        : 'bg-stone-850 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!currentUser) {
                    showNotification('Please sign in to share a recipe', 'error');
                    setShowAuthModal(true);
                  } else {
                    setShowNewRecipeModal(true);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Share New Recipe
              </button>
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all group shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {recipe.method === 'CAFE_LATTE'
                          ? '☕ Caffè Latte'
                          : recipe.method === 'CAPPUCCINO'
                          ? '☕ Cappuccino'
                          : recipe.method === 'FLAT_WHITE'
                          ? '☕ Flat White'
                          : recipe.method === 'AMERICANO'
                          ? '☕ Americano'
                          : recipe.method === 'ESPRESSO'
                          ? '☕ Espresso'
                          : recipe.method.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{recipe.averageRating ?? '5.0'}</span>
                        <span className="text-stone-500 font-normal">
                          ({recipe._count?.reviews ?? 0} reviews)
                        </span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-lg text-white mb-2 group-hover:text-amber-400 transition-colors leading-snug">
                      {recipe.title}
                    </h3>
                    <p className="text-stone-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                      {recipe.description || 'Dialed in specialty extraction profile.'}
                    </p>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-4 gap-2 bg-stone-950 p-3 rounded-2xl border border-stone-800/80 mb-4 text-center">
                      <div>
                        <div className="text-[10px] text-stone-500">Coffee</div>
                        <div className="text-xs font-black text-stone-200">{recipe.coffeeDoseGrams}g</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-500">Ratio</div>
                        <div className="text-xs font-black text-amber-400">1:{recipe.targetRatio}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-500">Temp</div>
                        <div className="text-xs font-black text-stone-200">{recipe.waterTempCelsius}°C</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-500">Time</div>
                        <div className="text-xs font-black text-stone-200">
                          {Math.floor(recipe.totalBrewTimeSeconds / 60)}m {recipe.totalBrewTimeSeconds % 60}s
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-stone-800 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={recipe.user?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'}
                        alt="author"
                        width={28}
                        height={28}
                        unoptimized
                        className="w-7 h-7 rounded-full object-cover border border-stone-700"
                      />
                      <span className="text-xs text-stone-300 font-semibold">{recipe.user?.name || 'Barista'}</span>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const fullRecipe = await api.getRecipeById(recipe.id);
                          setSelectedRecipe(fullRecipe);
                        } catch (err: unknown) {
                          showNotification(getErrorMessage(err, 'Failed to load recipe details'), 'error');
                        }
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Steps & Timeline <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DYNAMIC BREW RATIO CALCULATOR & LIVE TIMER */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Controls */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2 mb-1">
                  <Scale className="w-5 h-5 text-amber-400" />
                  Brew Ratio Calculator
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Dial in your manual brew. Real-time water phases are dynamically balanced based on dose and ratio.
                </p>
              </div>

              {/* Method Selector */}
              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-2">
                  1. Brewing Device & Cafe Menu
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {[
                    { id: 'V60', label: 'Hario V60', dose: 15, ratio: 15 },
                    { id: 'AEROPRESS', label: 'AeroPress', dose: 18, ratio: 11 },
                    { id: 'KALITA_WAVE', label: 'Kalita Wave', dose: 15, ratio: 15 },
                    { id: 'FRENCH_PRESS', label: 'French Press', dose: 30, ratio: 16.6 },
                    { id: 'COLD_BREW', label: 'Cold Brew', dose: 60, ratio: 8 },
                    { id: 'CAFE_LATTE', label: '☕ Caffè Latte', dose: 18, ratio: 12 },
                    { id: 'CAPPUCCINO', label: '☕ Cappuccino', dose: 18, ratio: 8.5 },
                    { id: 'FLAT_WHITE', label: '☕ Flat White', dose: 19, ratio: 8 },
                    { id: 'AMERICANO', label: '☕ Americano', dose: 18, ratio: 10 },
                    { id: 'ESPRESSO', label: '☕ Double Espresso', dose: 18, ratio: 2 },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCalcMethod(m.id as BrewMethod);
                        setCalcDose(m.dose);
                        setCalcRatio(m.ratio);
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                        calcMethod === m.id
                          ? 'bg-amber-600/20 border-amber-500 text-amber-400 font-extrabold shadow-sm'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coffee Dose Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    2. Coffee Dose
                  </label>
                  <span className="text-xl font-black text-amber-400">{calcDose} grams</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="1"
                  value={calcDose}
                  onChange={(e) => setCalcDose(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex gap-2 mt-2">
                  {[15, 18, 20, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setCalcDose(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        calcDose === d ? 'bg-amber-600 text-stone-950' : 'bg-stone-950 text-stone-400'
                      }`}
                    >
                      {d}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Water Ratio Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    3. Target Ratio
                  </label>
                  <span className="text-xl font-black text-amber-400">1:{calcRatio}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="20"
                  step="0.5"
                  value={calcRatio}
                  onChange={(e) => setCalcRatio(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Live KPI Output */}
              <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Total Water</div>
                  <div className="text-xl font-black text-amber-400">
                    {calcResult?.totalWaterMl ?? 225} ml
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Water Temp</div>
                  <div className="text-xl font-black text-stone-200">
                    {calcResult?.recommendedWaterTemp ?? 92}°C
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Target Time</div>
                  <div className="text-xl font-black text-stone-200">
                    {calcResult?.estimatedBrewTimeSeconds
                      ? `${Math.floor(calcResult.estimatedBrewTimeSeconds / 60)}m`
                      : '3m'}
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Step-by-Step Pour Timeline & LIVE BREW TIMER */}
            <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white">Dynamic Extraction Timeline</h3>
                    <p className="text-xs text-stone-400">
                      Calculated pour phases for {calcDose}g dose at 1:{calcRatio} ratio
                    </p>
                  </div>

                  {/* Interactive Live Timer Bar */}
                  <div className="flex items-center gap-3 bg-stone-950 px-4 py-2 rounded-2xl border border-stone-800">
                    <div className="text-right">
                      <div className="text-[10px] text-stone-500 uppercase font-bold">Stopwatch</div>
                      <div className="text-lg font-mono font-black text-amber-400">
                        {Math.floor(brewSeconds / 60)
                          .toString()
                          .padStart(2, '0')}
                        :
                        {(brewSeconds % 60).toString().padStart(2, '0')}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsBrewing(!isBrewing)}
                      className={`p-2.5 rounded-xl font-bold transition-all ${
                        isBrewing
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950'
                      }`}
                    >
                      {isBrewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsBrewing(false);
                        setBrewSeconds(0);
                      }}
                      className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Timeline Step Cards */}
                <div className="space-y-4">
                  {calcResult?.generatedPourSteps.map((step, idx) => {
                    const isCurrent =
                      isBrewing &&
                      brewSeconds >= step.startTimeSeconds &&
                      (idx === calcResult.generatedPourSteps.length - 1 ||
                        brewSeconds < calcResult.generatedPourSteps[idx + 1].startTimeSeconds);

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl flex items-start gap-4 transition-all ${
                          isCurrent
                            ? 'bg-amber-950/40 border-2 border-amber-500 shadow-lg shadow-amber-950/40'
                            : 'bg-stone-950 border border-stone-800/80 hover:border-stone-700'
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black text-sm shrink-0 ${
                            isCurrent
                              ? 'bg-amber-500 text-stone-950 animate-pulse'
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}
                        >
                          #{step.stepOrder}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-500" />
                              Start at {Math.floor(step.startTimeSeconds / 60)}:
                              {(step.startTimeSeconds % 60).toString().padStart(2, '0')}
                            </span>
                            {step.waterAmountMl > 0 && (
                              <span className="text-xs font-extrabold text-amber-400 bg-stone-900 px-2.5 py-0.5 rounded-lg border border-stone-800">
                                +{step.waterAmountMl} ml water
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-300 leading-relaxed font-medium">
                            {step.instruction}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 border-t border-stone-800 pt-4 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  Ready to brew? Start your timer and follow each phase.
                </span>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      showNotification('Please sign in to publish this recipe', 'error');
                      setShowAuthModal(true);
                      return;
                    }
                    setNewRecipeDose(calcDose);
                    setNewRecipeRatio(calcRatio);
                    setNewRecipeMethod(calcMethod);
                    setShowNewRecipeModal(true);
                  }}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
                >
                  Save as Community Recipe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROASTERY INVENTORY DASHBOARD (RBAC) */}
        {activeTab === 'roastery' && (
          <div className="space-y-6">
            {currentUser?.role !== 'ROASTER' && currentUser?.role !== 'ADMIN' ? (
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">Roastery Portal Restricted</h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Managing coffee bean inventory and receiving automated low-stock email alerts is restricted to accounts with the{' '}
                  <span className="text-amber-400 font-bold">ROASTER</span> or{' '}
                  <span className="text-amber-400 font-bold">ADMIN</span> role.
                </p>
                <button
                  onClick={() => handleQuickLogin('roaster@morningglory.com', 'ROASTER')}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs rounded-xl transition-all shadow-lg"
                >
                  Switch to Roaster Account (Demo)
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Roastery KPI Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-md">
                    <div className="text-xs text-stone-400 font-semibold mb-1">Total Catalog Varieties</div>
                    <div className="text-2xl font-black text-white">{beans.length} Single Origins</div>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-md">
                    <div className="text-xs text-stone-400 font-semibold mb-1">Total Stock on Hand</div>
                    <div className="text-2xl font-black text-amber-400">{totalStockKg} kg roasted</div>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-md">
                    <div className="text-xs text-stone-400 font-semibold mb-1">Low Stock Alerts</div>
                    <div className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {lowStockCount} items below threshold
                    </div>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-md">
                    <div className="text-xs text-stone-400 font-semibold mb-1">Estimated Retail Value</div>
                    <div className="text-2xl font-black text-emerald-400">
                      Rp {Math.round(inventoryValuation).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-400" />
                      Coffee Bean Inventory & Alert Monitor
                    </h2>
                    <p className="text-xs text-stone-400">
                      Live stock management. When stock drops below alert threshold, automated email warnings are dispatched.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowNewBeanModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Single-Origin Bean
                  </button>
                </div>

                {/* Inventory Table */}
                <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800 font-bold">
                        <tr>
                          <th className="py-4 px-4 text-center w-14">No.</th>
                          <th className="py-4 px-5">Bean Details</th>
                          <th className="py-4 px-4">Origin / Process</th>
                          <th className="py-4 px-4">Price (Bag)</th>
                          <th className="py-4 px-4">Current Stock</th>
                          <th className="py-4 px-4">Alert Threshold</th>
                          <th className="py-4 px-4">Quick Bag Counter & Adjust</th>
                          <th className="py-4 px-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {beans.map((bean, index) => {
                          const isLow = bean.stockGrams <= bean.minStockThreshold;
                          const bagSize = bean.bagSizeGrams || 250;
                          const totalBags = Math.floor(bean.stockGrams / bagSize);
                          return (
                            <tr key={bean.id} className="hover:bg-stone-850/50 transition-colors">
                              <td className="py-4 px-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 font-mono font-black text-amber-400 text-xs shadow-inner">
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="py-4 px-5 flex items-center gap-3">
                                <Image
                                  src={bean.imageUrl || 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=100'}
                                  alt={bean.name}
                                  width={44}
                                  height={44}
                                  unoptimized
                                  className="w-11 h-11 rounded-xl object-cover border border-stone-700 shadow-sm"
                                />
                                <div>
                                  <div className="font-extrabold text-stone-200 text-sm">{bean.name}</div>
                                  <div className="text-[11px] text-stone-400">{bean.varietal}</div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-stone-300 font-semibold">{bean.origin}</div>
                                <div className="text-[10px] text-amber-400 font-bold">
                                  {bean.process} · {bean.roastLevel.replace('_', ' ')}
                                </div>
                              </td>
                              <td className="py-4 px-4 font-bold text-stone-200">
                                Rp {bean.price.toLocaleString('id-ID')}
                              </td>
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-xs ${
                                      isLow
                                        ? 'bg-rose-950 border border-rose-700 text-rose-300 shadow-sm'
                                        : 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                                    }`}
                                  >
                                    {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                                    {bean.stockGrams.toLocaleString('id-ID')}g
                                  </span>
                                  <div className="text-[11px] font-bold text-amber-400/90 flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5 text-amber-400" />
                                    {totalBags} Bags ({bagSize}g/bag)
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-stone-400 font-medium">
                                {bean.minStockThreshold.toLocaleString('id-ID')}g
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  {/* Bag Increment/Decrement Counter */}
                                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-1 shadow-inner">
                                    <button
                                      onClick={() => handleUpdateStock(bean.id, bean.stockGrams, -bagSize)}
                                      disabled={bean.stockGrams < bagSize}
                                      title={`Minus 1 Bag (-${bagSize}g)`}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-300 hover:text-rose-400 font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                      -1
                                    </button>
                                    <span
                                      className="px-2.5 text-xs font-mono font-black text-amber-400 flex items-center gap-1"
                                      title="Total bags in inventory"
                                    >
                                      {totalBags} <span className="text-[10px] text-stone-500 font-sans">bags</span>
                                    </span>
                                    <button
                                      onClick={() => handleUpdateStock(bean.id, bean.stockGrams, bagSize)}
                                      title={`Plus 1 Bag (+${bagSize}g)`}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-900 hover:bg-emerald-950/60 text-stone-300 hover:text-emerald-400 font-black transition-all"
                                    >
                                      +1
                                    </button>
                                  </div>

                                  {/* Quick shortcuts */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleUpdateStock(bean.id, bean.stockGrams, -200)}
                                      title="Deduct 200g (Sample)"
                                      className="px-2 py-1 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      -200g
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStock(bean.id, bean.stockGrams, 1000)}
                                      title="Add 1,000g (Roast Batch)"
                                      className="px-2 py-1 bg-amber-600/15 hover:bg-amber-600/25 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-extrabold transition-all"
                                    >
                                      +1kg
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete ${bean.name}?`)) {
                                      await api.deleteBean(bean.id);
                                      showNotification('Bean removed');
                                      loadData();
                                    }
                                  }}
                                  className="text-stone-500 hover:text-rose-400 p-2 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: RECIPE DETAILS & TIMELINE */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full p-6 lg:p-8 space-y-6 my-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-800 pb-4">
              <div>
                <span className="px-3 py-1 rounded-md text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  {selectedRecipe.method === 'CAFE_LATTE'
                    ? '☕ Caffè Latte'
                    : selectedRecipe.method === 'CAPPUCCINO'
                    ? '☕ Cappuccino'
                    : selectedRecipe.method === 'FLAT_WHITE'
                    ? '☕ Flat White'
                    : selectedRecipe.method === 'AMERICANO'
                    ? '☕ Americano'
                    : selectedRecipe.method === 'ESPRESSO'
                    ? '☕ Espresso'
                    : selectedRecipe.method.replace('_', ' ')}
                </span>
                <h2 className="text-2xl font-black text-white mt-2 leading-tight">{selectedRecipe.title}</h2>
                <div className="text-xs text-stone-400 mt-1 flex items-center gap-2">
                  <span>Recipe by {selectedRecipe.user?.name}</span>
                  <span>·</span>
                  <span>Grind: {selectedRecipe.grindSize}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-stone-500 hover:text-stone-300 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Recipe specs */}
            <div className="grid grid-cols-4 gap-3 bg-stone-950 p-4 rounded-2xl text-center border border-stone-800">
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Coffee Dose</div>
                <div className="text-base font-black text-stone-200">{selectedRecipe.coffeeDoseGrams}g</div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Water</div>
                <div className="text-base font-black text-amber-400">{selectedRecipe.totalWaterMl}ml</div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Water Temp</div>
                <div className="text-base font-black text-stone-200">{selectedRecipe.waterTempCelsius}°C</div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Total Time</div>
                <div className="text-base font-black text-stone-200">{selectedRecipe.totalBrewTimeSeconds}s</div>
              </div>
            </div>

            {/* Pour steps */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">
                Sequential Pour Timeline & Agitation
              </h4>
              <div className="space-y-3">
                {selectedRecipe.pourSteps?.map((step) => (
                  <div
                    key={step.id || step.stepOrder}
                    className="bg-stone-950 border border-stone-800 p-4 rounded-2xl flex items-center gap-4"
                  >
                    <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 font-black flex items-center justify-center text-xs shrink-0 border border-amber-500/20">
                      #{step.stepOrder}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-stone-300">
                          Start: {Math.floor(step.startTimeSeconds / 60)}:
                          {(step.startTimeSeconds % 60).toString().padStart(2, '0')}
                        </span>
                        {step.waterAmountMl > 0 && (
                          <span className="text-amber-400 font-extrabold">+{step.waterAmountMl} ml water</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 font-medium leading-relaxed">{step.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-stone-800 pt-4 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                <span>Community Reviews ({selectedRecipe.reviews?.length ?? 0})</span>
                <span className="text-amber-400 flex items-center gap-1 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {selectedRecipe.averageRating ?? '5.0'} / 5.0
                </span>
              </h4>

              {/* Add Review */}
              {currentUser && (
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 font-bold">Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`text-base ${star <= reviewRating ? 'text-amber-400' : 'text-stone-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Share your cup notes / extraction feedback..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="flex-1 bg-stone-900 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleAddReview}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-xl shadow-md"
                    >
                      Post Review
                    </button>
                  </div>
                </div>
              )}

              {/* Review list */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {selectedRecipe.reviews?.map((rev) => (
                  <div key={rev.id} className="bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-stone-200">{rev.user?.name || 'Brewer'}</span>
                      <span className="text-amber-400 font-black">★ {rev.rating}</span>
                    </div>
                    <p className="text-stone-400 font-medium leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE RECIPE WITH NESTED POUR STEPS */}
      {showNewRecipeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateRecipe}
            className="bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full p-6 space-y-4 my-8 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-black text-lg text-white">Share New Brew Guide</h3>
              <button
                type="button"
                onClick={() => setShowNewRecipeModal(false)}
                className="text-stone-500 hover:text-stone-300 text-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-stone-400 block mb-1">Recipe Title</label>
              <input
                type="text"
                required
                placeholder="e.g. 4:6 Method Light Roast Masterclass"
                value={newRecipeTitle}
                onChange={(e) => setNewRecipeTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">Brewing Device & Method</label>
                <select
                  value={newRecipeMethod}
                  onChange={(e) => setNewRecipeMethod(e.target.value as BrewMethod)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                >
                  <optgroup label="Manual Brew & Filter">
                    <option value="V60">Hario V60</option>
                    <option value="AEROPRESS">AeroPress</option>
                    <option value="KALITA_WAVE">Kalita Wave</option>
                    <option value="FRENCH_PRESS">French Press</option>
                    <option value="COLD_BREW">Cold Brew</option>
                  </optgroup>
                  <optgroup label="Espresso & Cafe Classics">
                    <option value="CAFE_LATTE">☕ Caffè Latte (Espresso + Microfoam)</option>
                    <option value="CAPPUCCINO">☕ Cappuccino (Espresso + Foam Pillow)</option>
                    <option value="FLAT_WHITE">☕ Flat White (Double Ristretto + Thin Foam)</option>
                    <option value="AMERICANO">☕ Americano / Long Black</option>
                    <option value="ESPRESSO">☕ Double Espresso</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Grind Size</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medium-Fine (18 Clicks)"
                  value={newRecipeGrind}
                  onChange={(e) => setNewRecipeGrind(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Dose (g)</label>
                <input
                  type="number"
                  min="5"
                  value={newRecipeDose}
                  onChange={(e) => setNewRecipeDose(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 px-2 py-1.5 rounded-lg text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Ratio (1:X)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRecipeRatio}
                  onChange={(e) => setNewRecipeRatio(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 px-2 py-1.5 rounded-lg text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Temp (°C)</label>
                <input
                  type="number"
                  value={newRecipeTemp}
                  onChange={(e) => setNewRecipeTemp(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 px-2 py-1.5 rounded-lg text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Time (sec)</label>
                <input
                  type="number"
                  value={newRecipeTime}
                  onChange={(e) => setNewRecipeTime(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 px-2 py-1.5 rounded-lg text-xs text-stone-200"
                />
              </div>
            </div>

            {/* Nested Pour Steps Builder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-stone-300 font-bold uppercase">
                  Pour Steps Breakdown
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setNewRecipeSteps([
                      ...newRecipeSteps,
                      {
                        startTimeSeconds: newRecipeSteps.length * 45,
                        waterAmountMl: 50,
                        instruction: 'Next pour phase',
                      },
                    ])
                  }
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                >
                  + Add Step
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {newRecipeSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-stone-950 p-2 rounded-lg border border-stone-800">
                    <span className="text-[10px] font-bold text-amber-400">#{idx + 1}</span>
                    <input
                      type="number"
                      placeholder="Sec"
                      value={step.startTimeSeconds}
                      onChange={(e) => {
                        const updated = [...newRecipeSteps];
                        updated[idx].startTimeSeconds = Number(e.target.value);
                        setNewRecipeSteps(updated);
                      }}
                      className="w-16 bg-stone-900 border border-stone-750 px-1.5 py-1 rounded text-xs text-stone-200"
                    />
                    <input
                      type="number"
                      placeholder="Water ml"
                      value={step.waterAmountMl}
                      onChange={(e) => {
                        const updated = [...newRecipeSteps];
                        updated[idx].waterAmountMl = Number(e.target.value);
                        setNewRecipeSteps(updated);
                      }}
                      className="w-16 bg-stone-900 border border-stone-750 px-1.5 py-1 rounded text-xs text-stone-200"
                    />
                    <input
                      type="text"
                      placeholder="Instruction"
                      value={step.instruction}
                      onChange={(e) => {
                        const updated = [...newRecipeSteps];
                        updated[idx].instruction = e.target.value;
                        setNewRecipeSteps(updated);
                      }}
                      className="flex-1 bg-stone-900 border border-stone-750 px-2 py-1 rounded text-xs text-stone-200"
                    />
                    {newRecipeSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewRecipeSteps(newRecipeSteps.filter((_, i) => i !== idx))}
                        className="text-stone-500 hover:text-rose-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition-all mt-4"
            >
              Publish Recipe with Cascade Pour Steps
            </button>
          </form>
        </div>
      )}

      {/* MODAL 3: ADD SINGLE-ORIGIN BEAN WITH FILE UPLOAD */}
      {showNewBeanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateBean}
            className="bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full p-6 space-y-4 my-8 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-black text-lg text-white">Catalog Single-Origin Bean</h3>
              <button
                type="button"
                onClick={() => setShowNewBeanModal(false)}
                className="text-stone-500 hover:text-stone-300 text-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-stone-400 block mb-1">Bean Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Panama Boquete Geisha - Finca Deborah"
                value={newBeanName}
                onChange={(e) => setNewBeanName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">Origin / Region</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boquete, Chiriqui, Panama"
                  value={newBeanOrigin}
                  onChange={(e) => setNewBeanOrigin(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Varietal</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Tip Geisha"
                  value={newBeanVarietal}
                  onChange={(e) => setNewBeanVarietal(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">Process Method</label>
                <select
                  value={newBeanProcess}
                  onChange={(e) => setNewBeanProcess(e.target.value as ProcessMethod)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                >
                  <option value="WASHED">Washed</option>
                  <option value="NATURAL">Natural</option>
                  <option value="HONEY">Honey</option>
                  <option value="ANAEROBIC">Anaerobic</option>
                  <option value="EXPERIMENTAL">Experimental</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Roast Level</label>
                <select
                  value={newBeanRoast}
                  onChange={(e) => setNewBeanRoast(e.target.value as RoastLevel)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                >
                  <option value="LIGHT">Light</option>
                  <option value="LIGHT_MEDIUM">Light-Medium</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="DARK">Dark</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">Stock (Grams)</label>
                <input
                  type="number"
                  min="0"
                  value={newBeanStock}
                  onChange={(e) => setNewBeanStock(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={newBeanThreshold}
                  onChange={(e) => setNewBeanThreshold(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Price (IDR)</label>
                <input
                  type="number"
                  min="0"
                  value={newBeanPrice}
                  onChange={(e) => setNewBeanPrice(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
              <label className="text-xs text-stone-300 font-bold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                Upload Packaging Photo (Multer Server Storage)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-stone-950 hover:file:bg-amber-500 cursor-pointer"
              />
              {isUploading && <p className="text-xs text-amber-400 animate-pulse">Uploading file to server storage...</p>}
              {uploadedImageUrl && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> File attached: {uploadedImageUrl}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 block mb-1">Tasting Notes (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. White Jasmine, Bergamot, White Peach"
                value={newBeanNotes}
                onChange={(e) => setNewBeanNotes(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition-all mt-4"
            >
              Save Bean to Roastery Inventory
            </button>
          </form>
        </div>
      )}

      {/* MODAL 4: AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex gap-3">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`text-sm font-bold ${authMode === 'login' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-500'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`text-sm font-bold ${authMode === 'register' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-500'}`}
                >
                  Register
                </button>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-stone-500 hover:text-stone-300">
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Full Name / Roastery Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Account Role</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as 'BREWER' | 'ROASTER')}
                      className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                    >
                      <option value="BREWER">Brewer (Home Barista / Coffee Enthusiast)</option>
                      <option value="ROASTER">Roaster / Cafe Shop Admin</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition-all mt-4"
              >
                {authMode === 'login' ? 'Sign In with JWT' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-stone-900 border-t border-stone-800 py-6 text-center text-xs text-stone-500">
        <p>BrewLab PRO — Final Project Framework Programming · ITS Informatics 2026</p>
        <p className="mt-1 text-[11px] text-stone-600">Built with NestJS, Prisma ORM, PostgreSQL & Next.js App Router</p>
      </footer>
    </div>
  );
}
