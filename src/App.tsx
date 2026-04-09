import { useState, createContext, useContext, useEffect, ReactNode, FormEvent } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Clock, 
  Layers, 
  Gem,
  Instagram,
  Twitter,
  Facebook,
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  User,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { auth, db } from "./firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- Types & Context ---

interface Product {
  id: number;
  name: string;
  model: string;
  price: number;
  img: string;
  badge?: string;
  description: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// --- Auth Context ---

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// --- Mock Data ---

const PRODUCTS: Product[] = [
  { id: 1, name: "AURIX Chrono", model: "AX-C120 - 42 MM", price: 249, img: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=1000", badge: "50% OFF", category: "Chronograph", description: "A masterpiece of timing and style, featuring a robust stainless steel case." },
  { id: 2, name: "NOVA Classic", model: "NV-A98 - 42 MM", price: 199, img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1000", badge: "New Arrival", category: "Classic", description: "Timeless design meets modern reliability in this elegant everyday timepiece." },
  { id: 3, name: "STEEL PRO", model: "SP-X55 - 44 MM", price: 299, img: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1000", badge: "Best Seller", category: "Professional", description: "Built for the extremes, the Steel Pro offers unmatched durability and precision." },
  { id: 4, name: "OCEANIC Diver", model: "OD-77 - 45 MM", price: 349, img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=1000", category: "Diver", description: "Water-resistant up to 200m, perfect for the modern explorer of the deep." },
  { id: 5, name: "LUNAR Phase", model: "LP-22 - 40 MM", price: 450, img: "https://images.unsplash.com/photo-1508685096489-7aac29625a3b?auto=format&fit=crop&q=80&w=1000", badge: "Limited", category: "Luxury", description: "Track the celestial movements with our most sophisticated lunar phase complication." },
  { id: 6, name: "ZENITH Gold", model: "ZG-01 - 38 MM", price: 899, img: "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&q=80&w=1000", category: "Luxury", description: "Pure 18k gold plating meets Swiss automatic movement for ultimate prestige." },
];

// --- Components ---

const Navbar = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 ${isScrolled ? "glass-nav shadow-lg py-3" : "bg-transparent"}`}>
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif font-bold tracking-tighter text-bottle-green">VORREX</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-gray-600">
          <Link to="/" className={`hover:text-bottle-green transition-colors ${location.pathname === "/" ? "text-bottle-green" : ""}`}>Home</Link>
          <Link to="/shop" className={`hover:text-bottle-green transition-colors ${location.pathname === "/shop" ? "text-bottle-green" : ""}`}>Shop</Link>
          <Link to="/about" className={`hover:text-bottle-green transition-colors ${location.pathname === "/about" ? "text-bottle-green" : ""}`}>About</Link>
          <Link to="/contact" className={`hover:text-bottle-green transition-colors ${location.pathname === "/contact" ? "text-bottle-green" : ""}`}>Contact</Link>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Search size={20} className="text-bottle-green" />
          </button>
          
          <div className="relative group hidden md:block">
            {user ? (
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <User size={20} className="text-bottle-green" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Account</p>
                    <p className="text-sm font-bold text-bottle-green truncate">{user.email}</p>
                  </div>
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors block">
                <User size={20} className="text-bottle-green" />
              </Link>
            )}
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <ShoppingCart size={20} className="text-bottle-green" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-premium-gold text-white text-[10px] flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </button>
          <Link to="/shop" className="hidden md:block bg-bottle-green text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-bottle-green-light transition-all premium-shadow">
            Shop Now
          </Link>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 text-bottle-green"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={32} className="text-bottle-green" />
            </button>
            <form onSubmit={handleSearch} className="w-full max-w-3xl text-center">
              <p className="text-premium-gold font-medium tracking-[0.3em] uppercase text-sm mb-8">What are you looking for?</p>
              <div className="relative">
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for watches, models, collections..."
                  className="w-full bg-transparent border-b-2 border-bottle-green/20 py-6 text-3xl md:text-5xl font-serif text-bottle-green outline-none focus:border-bottle-green transition-colors placeholder:text-gray-200"
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-bottle-green hover:text-premium-gold transition-colors">
                  <ArrowRight size={40} />
                </button>
              </div>
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                <span className="text-gray-400 text-sm">Popular:</span>
                {["Chronograph", "Classic", "Luxury", "Diver"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/shop?search=${tag}`);
                      setIsSearchOpen(false);
                    }}
                    className="text-sm font-bold text-bottle-green hover:text-premium-gold transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-bottle-green/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xl font-serif font-bold text-bottle-green">VORREX</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} className="text-bottle-green" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* User Profile Section */}
                <div className="mb-10 p-6 bg-gray-50 rounded-3xl">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-bottle-green text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 uppercase tracking-widest">Welcome back</p>
                          <p className="text-sm font-bold text-bottle-green truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Link 
                          to="/checkout" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-gray-100 hover:border-premium-gold transition-colors"
                        >
                          <ShoppingCart size={18} className="text-premium-gold mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter text-bottle-green">Orders</span>
                        </Link>
                        <button 
                          onClick={() => { logout(); setIsMenuOpen(false); }}
                          className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-gray-100 hover:text-red-500 transition-colors"
                        >
                          <LogOut size={18} className="text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter text-bottle-green">Logout</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-500 text-sm mb-4">Sign in to track your orders and save your favorites.</p>
                      <Link 
                        to="/login" 
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full bg-bottle-green text-white py-3 rounded-full font-bold text-sm"
                      >
                        Sign In / Sign Up
                      </Link>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Navigation</p>
                  {[
                    { name: "Home", path: "/", icon: <Star size={18} /> },
                    { name: "Shop Collection", path: "/shop", icon: <Gem size={18} /> },
                    { name: "Our Story", path: "/about", icon: <Clock size={18} /> },
                    { name: "Contact Us", path: "/contact", icon: <Mail size={18} /> },
                  ].map((link) => (
                    <Link 
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${location.pathname === link.path ? "bg-bottle-green text-white shadow-lg" : "hover:bg-gray-50 text-bottle-green"}`}
                    >
                      <span className={location.pathname === link.path ? "text-white" : "text-premium-gold"}>
                        {link.icon}
                      </span>
                      <span className="font-bold text-sm uppercase tracking-widest">{link.name}</span>
                      <ChevronRight size={16} className="ml-auto opacity-30" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100">
                <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">© 2024 VORREX Luxury</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const CartSidebar = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, isCartOpen, setIsCartOpen } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-bottle-green/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-bottle-green">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-bottle-green" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-6">Your cart is currently empty.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="bg-bottle-green text-white px-8 py-3 rounded-full font-medium hover:bg-bottle-green-light transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl flex-shrink-0 p-2">
                      <img src={item.img} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-bold text-bottle-green">{item.name}</h3>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest">{item.model}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center border border-gray-100 rounded-full px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-premium-gold transition-colors text-bottle-green">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-bottle-green">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-premium-gold transition-colors text-bottle-green">
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="font-serif font-bold text-bottle-green">${item.price * item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between mb-6">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-2xl font-serif font-bold text-bottle-green">${totalPrice}</span>
                </div>
                <Link 
                  to="/checkout" 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-bottle-green text-white py-4 rounded-full font-bold hover:bg-bottle-green-light transition-all premium-shadow flex items-center justify-center gap-2"
                >
                  Checkout Now <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Pages ---

const HomePage = () => {
  const { addToCart } = useCart();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-premium-gold font-medium tracking-[0.4em] uppercase text-sm mb-6 block">The Art of Precision</span>
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] mb-8 text-bottle-green">
              VORREX <br /> 
              <span className="italic font-normal text-gray-400">Excellence</span>
            </h1>
            <p className="text-gray-600 text-lg mb-10 max-w-md leading-relaxed">
              Experience the pinnacle of horological mastery. Where Swiss heritage meets avant-garde design.
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <Link to="/shop" className="bg-bottle-green text-white px-10 py-4 rounded-full font-bold hover:bg-bottle-green-light transition-all flex items-center gap-3 premium-shadow group">
                Explore Collection
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <button className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-gray-50 transition-all">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-bottle-green border-b-[6px] border-b-transparent ml-1"></div>
                </div>
                <span className="text-bottle-green font-bold uppercase tracking-widest text-[10px]">Watch Film</span>
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover" referrerPolicy="no-referrer" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-premium-gold">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-bold text-bottle-green">4.9/5</span>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Global Excellence</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            {/* Clean Container */}
            <div className="bg-white rounded-[40px] relative overflow-hidden premium-shadow aspect-[4/5] flex items-center justify-center border border-gray-100">
              <video 
                autoPlay 
                muted 
                loop 
                playsInline
                poster="https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                className="absolute inset-0 w-full h-full object-cover z-0"
              >
                <source src="https://videos.pexels.com/video-files/4440954/4440954-sd_640_360_24fps.mp4" type="video/mp4" />
              </video>
              
              <div className="absolute top-6 left-6 z-20">
                <span className="bg-white/40 backdrop-blur-xl border border-white/50 text-bottle-green text-[9px] font-bold uppercase tracking-[0.3em] px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <span className="w-1.5 h-1.5 bg-premium-gold rounded-full animate-pulse"></span>
                  Exclusive Collection
                </span>
              </div>
              
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end z-20">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
                  <p className="text-bottle-green text-xs uppercase tracking-[0.2em] mb-1 font-bold">Masterpiece 2024</p>
                  <h3 className="text-bottle-green text-3xl font-serif font-bold">VORREX Grand</h3>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-premium-gold text-3xl font-serif font-bold">$2,499</div>
              </div>
            </div>

            
            {/* Floating Stats Overlay - Clean Design */}
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 hidden lg:flex z-20">
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="bg-white/80 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-white/50 text-center"
              >
                <p className="text-premium-gold text-2xl font-serif font-bold">18k</p>
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Solid Gold</p>
              </motion.div>
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="bg-white/80 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-white/50 text-center"
              >
                <p className="text-premium-gold text-2xl font-serif font-bold">300m</p>
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Diver Pro</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          {[
            { icon: <ShieldCheck className="text-premium-gold" />, title: "Trusted Precision", desc: "High-quality quartz movement ensures accurate and dependable timekeeping." },
            { icon: <Gem className="text-premium-gold" />, title: "Elegant Craftsmanship", desc: "Refined designs with premium finishes, crafted for everyday elegance." },
            { icon: <Layers className="text-premium-gold" />, title: "Water Resistant Build", desc: "Designed to handle daily splashes and light water exposure with ease." },
            { icon: <Clock className="text-premium-gold" />, title: "Durable Materials", desc: "Strong cases and scratch-resistant glass for long-lasting performance." }
          ].map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl premium-shadow hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-bottle-green/5 rounded-2xl flex items-center justify-center mb-6">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-bottle-green">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-5xl font-bold text-bottle-green mb-4">New Arrival</h2>
              <div className="w-20 h-1 bg-premium-gold"></div>
            </div>
            <Link to="/shop" className="text-bottle-green font-bold uppercase tracking-widest text-sm flex items-center gap-2 hover:gap-4 transition-all">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {PRODUCTS.slice(0, 3).map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative bg-white rounded-3xl aspect-[4/5] mb-6 overflow-hidden flex items-center justify-center p-12 transition-all duration-500 group-hover:bg-gray-50">
                  {p.badge && (
                    <span className="absolute top-6 left-6 bg-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-bottle-green premium-shadow border border-gray-100">
                      {p.badge}
                    </span>
                  )}
                  <Link to={`/product/${p.id}`} className="w-full h-full">
                    <img src={p.img} alt={p.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </Link>
                  <button 
                    onClick={() => addToCart(p)}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-bottle-green text-white px-8 py-3 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 premium-shadow"
                  >
                    Add to Cart
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{p.name}</p>
                  <Link to={`/product/${p.id}`}>
                    <h3 className="text-xl font-bold text-bottle-green mb-2 hover:text-premium-gold transition-colors">{p.model}</h3>
                  </Link>
                  <p className="text-premium-gold font-serif text-2xl">${p.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Section */}
      <section className="bg-bottle-green text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#fff,transparent)] scale-150"></div>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">Modern Watches For <br /> Every Occasion</h2>
            <p className="text-white/70 text-lg mb-12 max-w-md leading-relaxed">A perfect balance of style and performance for every moment. Whether it's a formal gala or a casual weekend, VORREX is your perfect companion.</p>
            <div className="flex flex-col gap-8">
              <Link to="/shop" className="bg-premium-gold text-bottle-green px-10 py-4 rounded-full font-bold hover:bg-premium-gold-light transition-all w-fit premium-shadow">Explore Our Collection</Link>
              <div className="flex items-center gap-4">
                <div className="flex gap-1 text-premium-gold">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}</div>
                <span className="text-sm font-medium text-white/80">(2743 Reviews)</span>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 50, rotate: 10 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-75"></div>
            <img src="https://images.unsplash.com/photo-1508685096489-7aac29625a3b?auto=format&fit=crop&q=80&w=1000" alt="Modern Watch" className="w-full h-auto object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] rounded-[40px] border-2 border-white/10" referrerPolicy="no-referrer" />
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

const ShopPage = () => {
  const { addToCart } = useCart();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Chronograph", "Classic", "Professional", "Diver", "Luxury"];
  
  const filteredProducts = PRODUCTS.filter(p => {
    const matchesFilter = filter === "All" || p.category === filter;
    const matchesSearch = !searchQuery || 
                         p.name.toLowerCase().includes(searchQuery) || 
                         p.model.toLowerCase().includes(searchQuery) || 
                         p.category.toLowerCase().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24"
    >
      <section>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
          <span className="text-premium-gold font-medium tracking-[0.3em] uppercase text-sm mb-4 block">Our Collection</span>
          <h1 className="text-5xl md:text-7xl font-bold text-bottle-green mb-8">
            {searchQuery ? `Results for "${searchQuery}"` : "The Masterpieces"}
          </h1>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${filter === cat ? "bg-bottle-green text-white premium-shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p) => (
                <motion.div 
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group"
                >
                  <div className="relative bg-white rounded-3xl aspect-[4/5] mb-6 overflow-hidden flex items-center justify-center p-12 transition-all duration-500 group-hover:bg-gray-50">
                    {p.badge && (
                      <span className="absolute top-6 left-6 bg-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-bottle-green premium-shadow border border-gray-100">
                        {p.badge}
                      </span>
                    )}
                    <Link to={`/product/${p.id}`} className="w-full h-full">
                      <img src={p.img} alt={p.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    </Link>
                    <button 
                      onClick={() => addToCart(p)}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-bottle-green text-white px-8 py-3 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 premium-shadow"
                    >
                      Add to Cart
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{p.name}</p>
                    <Link to={`/product/${p.id}`}>
                      <h3 className="text-xl font-bold text-bottle-green mb-2 hover:text-premium-gold transition-colors">{p.model}</h3>
                    </Link>
                    <p className="text-premium-gold font-serif text-2xl">${p.price}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-2xl font-serif text-gray-400 mb-4">No products found matching your search.</h3>
            <button onClick={() => setFilter("All")} className="text-premium-gold font-bold uppercase tracking-widest text-sm">Clear Filters</button>
          </div>
        )}
      </div>
    </section>
  </motion.div>
  );
};

const AboutPage = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="pt-24"
  >
    <section>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center mb-32">
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="text-premium-gold font-medium tracking-[0.3em] uppercase text-sm mb-4 block">Our Story</span>
          <h2 className="text-5xl md:text-7xl font-bold text-bottle-green mb-8 leading-tight">Crafting Excellence <br /> Since 1994</h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Founded in the heart of Switzerland, VORREX began with a simple vision: to create timepieces that transcend trends and become part of a person's legacy.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            Every VORREX watch is the result of hundreds of hours of meticulous work by master horologists, combining centuries-old techniques with cutting-edge materials.
          </p>
        </motion.div>
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1000" alt="Craftsmanship" className="w-full rounded-3xl premium-shadow" referrerPolicy="no-referrer" />
        </div>
      </div>

        <div className="grid md:grid-cols-3 gap-12 text-center">
        {[
          { icon: <ShieldCheck size={40} className="text-premium-gold mx-auto mb-6" />, title: "Lifetime Warranty", desc: "We stand behind our craftsmanship with a comprehensive lifetime guarantee." },
          { icon: <Gem size={40} className="text-premium-gold mx-auto mb-6" />, title: "Ethical Sourcing", desc: "All our materials are ethically sourced and environmentally responsible." },
          { icon: <Clock size={40} className="text-premium-gold mx-auto mb-6" />, title: "Swiss Movement", desc: "Powered by the world's most precise and reliable Swiss automatic movements." }
        ].map((item, i) => (
          <div key={i} className="p-8 group">
            <div className="mb-6 transition-transform group-hover:scale-110 duration-300">
              {item.icon}
            </div>
            <h3 className="text-2xl font-bold text-bottle-green mb-4">{item.title}</h3>
            <p className="text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
</motion.div>
);

const ContactPage = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="pt-24"
  >
    <section>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-premium-gold font-medium tracking-[0.3em] uppercase text-sm mb-4 block">Get In Touch</span>
          <h1 className="text-5xl md:text-7xl font-bold text-bottle-green">Contact Us</h1>
        </div>

      <div className="grid md:grid-cols-2 gap-20">
        <div className="space-y-12">
          <div className="flex gap-6">
            <div className="w-14 h-14 bg-bottle-green/5 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MapPin className="text-premium-gold" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-bottle-green mb-2">Our Boutique</h4>
              <p className="text-gray-500 leading-relaxed">123 Luxury Avenue, Geneva <br /> Switzerland, 1201</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-14 h-14 bg-bottle-green/5 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Phone className="text-premium-gold" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-bottle-green mb-2">Call Us</h4>
              <p className="text-gray-500 leading-relaxed">+41 22 123 4567 <br /> Mon - Fri, 9am - 6pm</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-14 h-14 bg-bottle-green/5 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Mail className="text-premium-gold" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-bottle-green mb-2">Email Us</h4>
              <p className="text-gray-500 leading-relaxed">concierge@sereno.com <br /> support@sereno.com</p>
            </div>
          </div>
        </div>

        <form className="bg-white p-10 rounded-[40px] premium-shadow space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bottle-green">First Name</label>
              <input type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-premium-gold/20" placeholder="John" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bottle-green">Last Name</label>
              <input type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-premium-gold/20" placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-bottle-green">Email Address</label>
            <input type="email" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-premium-gold/20" placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-bottle-green">Message</label>
            <textarea rows={4} className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-premium-gold/20 resize-none" placeholder="How can we help you?"></textarea>
          </div>
          <button className="w-full bg-bottle-green text-white py-4 rounded-full font-bold hover:bg-bottle-green-light transition-all premium-shadow">
            Send Message
          </button>
        </form>
      </div>
    </div>
  </section>
</motion.div>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const product = PRODUCTS.find(p => p.id === Number(id));

  if (!product) return <div className="pt-40 text-center">Product not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-24">
      <section>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
        <div className="bg-white rounded-3xl p-12 aspect-square flex items-center justify-center relative overflow-hidden">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            src={product.img} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <span className="text-premium-gold font-medium tracking-[0.3em] uppercase text-sm mb-4 block">{product.category}</span>
          <h1 className="text-5xl md:text-7xl font-bold text-bottle-green mb-4">{product.name}</h1>
          <p className="text-2xl text-gray-400 mb-8 uppercase tracking-widest">{product.model}</p>
          <p className="text-4xl font-serif text-premium-gold mb-8">${product.price}</p>
          <p className="text-gray-600 text-lg leading-relaxed mb-12">{product.description}</p>
          
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="p-6 bg-gray-50 rounded-3xl">
              <ShieldCheck className="text-premium-gold mb-3" />
              <h4 className="font-bold text-bottle-green">2 Year Warranty</h4>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl">
              <Clock className="text-premium-gold mb-3" />
              <h4 className="font-bold text-bottle-green">Free Shipping</h4>
            </div>
          </div>

          <button 
            onClick={() => addToCart(product)}
            className="w-full bg-bottle-green text-white py-5 rounded-full font-bold text-lg hover:bg-bottle-green-light transition-all premium-shadow flex items-center justify-center gap-3"
          >
            Add to Shopping Bag <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  </motion.div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        // Simple validation
        if (password.length < 6) {
          throw new Error("Password should be at least 6 characters.");
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          email: email,
          role: "user",
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err: any) {
      let msg = err.message;
      if (err.code === "auth/user-not-found") msg = "No account found with this email.";
      if (err.code === "auth/wrong-password") msg = "Incorrect password.";
      if (err.code === "auth/email-already-in-use") msg = "This email is already registered.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <section className="w-full">
        <div className="max-w-md mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[40px] premium-shadow"
          >
        <h2 className="text-3xl font-serif font-bold text-bottle-green mb-2 text-center">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-gray-500 text-center mb-10">
          {isRegister ? "Join the VORREX luxury circle" : "Sign in to your premium account"}
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-bottle-green">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-premium-gold/20" 
              placeholder="email@example.com" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-bottle-green">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-premium-gold/20" 
              placeholder="••••••••" 
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-bottle-green text-white py-4 rounded-full font-bold hover:bg-bottle-green-light transition-all premium-shadow disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegister ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-gray-500 hover:text-bottle-green transition-colors"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  </section>
</div>
  );
};

const CheckoutPage = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (!user) return navigate("/login");
    setLoading(true);
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearCart();
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="pt-40 pb-20 text-center">
        <h2 className="text-3xl font-serif text-bottle-green mb-6">Your cart is empty</h2>
        <Link to="/shop" className="bg-bottle-green text-white px-10 py-4 rounded-full font-bold">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <section>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-center mb-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= i ? "bg-bottle-green text-white" : "bg-gray-100 text-gray-400"}`}>
                {step > i ? <CheckCircle2 size={20} /> : i}
              </div>
              <span className={`text-sm font-bold uppercase tracking-widest ${step >= i ? "text-bottle-green" : "text-gray-400"}`}>
                {i === 1 ? "Shipping" : i === 2 ? "Payment" : "Success"}
              </span>
              {i < 3 && <div className={`w-20 h-px ${step > i ? "bg-bottle-green" : "bg-gray-200"}`}></div>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[40px] premium-shadow space-y-6">
                <h3 className="text-2xl font-serif font-bold text-bottle-green mb-6">Shipping Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="First Name" />
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="Last Name" />
                </div>
                <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="Address" />
                <div className="grid grid-cols-2 gap-6">
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="City" />
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="Postal Code" />
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-bottle-green text-white py-4 rounded-full font-bold">Continue to Payment</button>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-[40px] h-fit">
              <h3 className="font-bold text-bottle-green mb-6 uppercase tracking-widest text-sm">Order Summary</h3>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.name} x {item.quantity}</span>
                    <span className="font-bold text-bottle-green">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                <span className="text-lg font-bold text-bottle-green">Total</span>
                <span className="text-2xl font-serif font-bold text-premium-gold">${totalPrice}</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-[40px] premium-shadow text-center">
            <Lock className="text-premium-gold mx-auto mb-6" size={48} />
            <h3 className="text-2xl font-serif font-bold text-bottle-green mb-4">Secure Payment</h3>
            <p className="text-gray-500 mb-8">Your payment is encrypted and processed securely.</p>
            <div className="space-y-4 mb-8">
              <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="Card Number" />
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="MM/YY" />
                <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" placeholder="CVC" />
              </div>
            </div>
            <button 
              disabled={loading}
              onClick={handlePlaceOrder}
              className="w-full bg-bottle-green text-white py-4 rounded-full font-bold premium-shadow disabled:opacity-50"
            >
              {loading ? "Processing..." : `Pay $${totalPrice}`}
            </button>
          </div>
        )}

        {step === 3 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-serif font-bold text-bottle-green mb-4">Order Confirmed!</h2>
            <p className="text-gray-500 mb-12 max-w-md mx-auto">Thank you for your purchase. Your VORREX timepiece is being prepared for shipment.</p>
            <Link to="/" className="bg-bottle-green text-white px-10 py-4 rounded-full font-bold">Return Home</Link>
          </motion.div>
        )}
      </div>
    </section>
  </div>
  );
};

const Footer = () => (
  <footer className="bg-white pt-24 pb-12 px-6 border-t border-gray-100">
    <div className="max-w-7xl mx-auto">
      <div className="grid md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-2">
          <h2 className="text-3xl font-serif font-bold text-bottle-green mb-6 uppercase tracking-tighter">VORREX</h2>
          <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
            Crafting excellence since 1994. We believe that a watch is more than just a timepiece—it's a statement of character and a legacy of precision.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-bottle-green hover:bg-bottle-green hover:text-white transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-bottle-green hover:bg-bottle-green hover:text-white transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-bottle-green hover:bg-bottle-green hover:text-white transition-all">
              <Facebook size={18} />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-bottle-green font-bold uppercase tracking-widest text-sm mb-6">Quick Links</h4>
          <ul className="space-y-4 text-gray-500 text-sm">
            <li><Link to="/about" className="hover:text-premium-gold transition-colors">About Us</Link></li>
            <li><Link to="/shop" className="hover:text-premium-gold transition-colors">Our Collections</Link></li>
            <li><a href="#" className="hover:text-premium-gold transition-colors">Store Locator</a></li>
            <li><Link to="/contact" className="hover:text-premium-gold transition-colors">Contact Support</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-bottle-green font-bold uppercase tracking-widest text-sm mb-6">Newsletter</h4>
          <p className="text-gray-500 text-sm mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email" 
              className="bg-gray-100 rounded-full px-6 py-2 text-sm outline-none focus:ring-2 ring-premium-gold/20 flex-1"
            />
            <button className="bg-bottle-green text-white p-2 rounded-full hover:bg-bottle-green-light transition-all">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-400 uppercase tracking-widest font-medium">
        <p>© 2024 VORREX LUXURY WATCHES. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-bottle-green">Privacy Policy</a>
          <a href="#" className="hover:text-bottle-green">Terms of Service</a>
          <a href="#" className="hover:text-bottle-green">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
);

// --- Provider & Main ---

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <div className="min-h-screen selection:bg-premium-gold selection:text-white flex flex-col">
            <Navbar />
            <CartSidebar />
            <main className="flex-1">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
