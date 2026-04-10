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
  { id: 1, name: "AURIX Chrono", model: "AX-C120 - 42 MM", price: 249, img: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800", badge: "50% OFF", category: "Chronograph", description: "A masterpiece of timing and style, featuring a robust stainless steel case and precision analog movement." },
  { id: 2, name: "NOVA Classic", model: "NV-A98 - 42 MM", price: 210, img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800", badge: "New Arrival", category: "Classic", description: "Timeless design meets modern reliability in this elegant everyday analog timepiece." },
  { id: 3, name: "STEEL PRO", model: "SP-X55 - 44 MM", price: 299, img: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800", badge: "Best Seller", category: "Professional", description: "Built for the extremes, the Steel Pro offers unmatched durability and mechanical precision." },
  { id: 4, name: "OCEANIC Diver", model: "OD-77 - 45 MM", price: 349, img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800", category: "Diver", description: "Water-resistant up to 200m, an essential analog tool for the modern explorer of the deep." },
  { id: 6, name: "ZENITH Gold", model: "ZG-01 - 38 MM", price: 899, img: "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800", category: "Luxury", description: "Pure 18k gold plating meets Swiss automatic movement for ultimate prestige." },
  { id: 8, name: "ROSE Elegance", model: "RE-05 - 38 MM", price: 550, img: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800", badge: "New Arrival", category: "Luxury", description: "Rose gold casing paired with a genuine leather strap for timeless analog sophistication." },
  { id: 9, name: "AVIATOR Blue", model: "AB-22 - 42 MM", price: 280, img: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800", category: "Chronograph", description: "Inspired by aviation history, featuring a deep blue analog dial and luminous markers." },
  { id: 14, name: "VEGA Tourbillon", model: "VT-01 - 40 MM", price: 1250, img: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=800", category: "Luxury", description: "A technical marvel featuring a visible tourbillon cage for gravity-defying mechanical precision." },
  { id: 15, name: "ORION Silver", model: "OS-22 - 39 MM", price: 215, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", category: "Classic", description: "A minimalist silver analog dial that reflects the stars, perfect for evening wear." },
  { id: 19, name: "CARBON X", model: "CX-01 - 44 MM", price: 310, img: "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=800", category: "Professional", description: "Ultra-lightweight carbon fiber case with a high-performance rubber strap and analog display." },
  { id: 24, name: "MARBLE Luxe", model: "ML-09 - 38 MM", price: 420, img: "https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=800", category: "Luxury", description: "Featuring a genuine Italian marble analog dial, each piece is truly unique." },
  { id: 25, name: "AURA Automatic", model: "AA-12 - 36 MM", price: 205, img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800", category: "Classic", description: "High-precision automatic movement in a slim, elegant analog profile." },
  { id: 26, name: "POLAR Explorer", model: "PE-01 - 42 MM", price: 315, img: "https://images.unsplash.com/photo-1619134778706-7015533a6150?w=800", category: "Professional", description: "A stark white analog dial for maximum visibility in snowy or bright conditions." },
];

// --- Components ---

const Navbar = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <nav className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-10 py-4 flex items-center justify-between transition-all duration-500 ${isScrolled ? "glass-nav shadow-lg py-3" : "bg-transparent"}`}>
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl md:text-3xl font-serif font-bold tracking-tighter text-bottle-green group-hover:text-premium-gold transition-colors">VORREX</span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
          <Link to="/" className={`hover:text-bottle-green transition-all relative py-2 ${location.pathname === "/" ? "text-bottle-green after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-bottle-green" : ""}`}>Home</Link>
          <Link to="/shop" className={`hover:text-bottle-green transition-all relative py-2 ${location.pathname === "/shop" ? "text-bottle-green after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-bottle-green" : ""}`}>Shop</Link>
          <Link to="/about" className={`hover:text-bottle-green transition-all relative py-2 ${location.pathname === "/about" ? "text-bottle-green after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-bottle-green" : ""}`}>About</Link>
          <Link to="/contact" className={`hover:text-bottle-green transition-all relative py-2 ${location.pathname === "/contact" ? "text-bottle-green after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-bottle-green" : ""}`}>Contact</Link>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Search size={18} className="text-bottle-green" />
          </button>
          
          <div className="relative group hidden sm:block">
            {user ? (
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <User size={18} className="text-bottle-green" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
                  <div className="px-6 py-3 border-b border-gray-50 mb-2">
                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-bold">Account</p>
                    <p className="text-sm font-bold text-bottle-green truncate">{user.email}</p>
                  </div>
                  <button onClick={logout} className="w-full text-left px-6 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                    <LogOut size={16} /> <span className="font-bold uppercase tracking-widest text-[10px]">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors block">
                <User size={18} className="text-bottle-green" />
              </Link>
            )}
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <ShoppingCart size={18} className="text-bottle-green" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-premium-gold text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                {totalItems}
              </span>
            )}
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} className="text-bottle-green" /> : <Menu size={20} className="text-bottle-green" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-32 px-6 lg:hidden"
          >
            <div className="flex flex-col gap-10 text-center">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif font-bold text-bottle-green tracking-tighter">Home</Link>
              <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif font-bold text-bottle-green tracking-tighter">Shop</Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif font-bold text-bottle-green tracking-tighter">About</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif font-bold text-bottle-green tracking-tighter">Contact</Link>
              <div className="pt-12 border-t border-gray-100">
                {user ? (
                  <div className="space-y-8">
                    <p className="text-sm font-bold text-bottle-green">{user.email}</p>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-red-500 font-bold uppercase tracking-[0.3em] text-[10px]">Logout Account</button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-bottle-green text-white px-12 py-5 rounded-full font-bold uppercase tracking-[0.3em] text-[10px] inline-block premium-shadow">Login / Register</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center">
                <span className="text-2xl md:text-3xl font-serif font-bold text-bottle-green tracking-tighter">VORREX</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} className="text-bottle-green" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-10">
                {/* User Profile Section */}
                <div className="mb-12 p-8 bg-gray-50 rounded-[40px] border border-gray-100">
                  {user ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-bottle-green text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">Welcome back</p>
                          <p className="text-sm font-bold text-bottle-green truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Link 
                          to="/checkout" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 hover:border-premium-gold transition-all group"
                        >
                          <ShoppingCart size={20} className="text-premium-gold mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-bottle-green">Orders</span>
                        </Link>
                        <button 
                          onClick={() => { logout(); setIsMenuOpen(false); }}
                          className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-all group"
                        >
                          <LogOut size={20} className="text-gray-400 group-hover:text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-bottle-green">Logout</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <p className="text-gray-500 text-sm font-medium leading-relaxed">Sign in to track your orders and save your favorites.</p>
                      <Link 
                        to="/login" 
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full bg-bottle-green text-white py-4 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] premium-shadow"
                      >
                        Sign In / Sign Up
                      </Link>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-6 px-4">Navigation</p>
                  {[
                    { name: "Home", path: "/", icon: <Star size={20} /> },
                    { name: "Shop Collection", path: "/shop", icon: <Gem size={20} /> },
                    { name: "Our Story", path: "/about", icon: <Clock size={20} /> },
                    { name: "Contact Us", path: "/contact", icon: <Mail size={20} /> },
                  ].map((link) => (
                    <Link 
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-5 p-5 rounded-[32px] transition-all duration-500 ${location.pathname === link.path ? "bg-bottle-green text-white shadow-2xl scale-[1.02]" : "hover:bg-gray-50 text-bottle-green"}`}
                    >
                      <span className={location.pathname === link.path ? "text-white" : "text-premium-gold"}>
                        {link.icon}
                      </span>
                      <span className="font-bold text-sm uppercase tracking-[0.2em]">{link.name}</span>
                      <ChevronRight size={18} className={`ml-auto transition-opacity ${location.pathname === link.path ? "opacity-100" : "opacity-20"}`} />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="p-8 md:p-10 border-t border-gray-50 text-center">
                <p className="text-[9px] text-gray-400 uppercase tracking-[0.4em] font-bold">© 2024 VORREX LUXURY</p>
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
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
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
      <section className="relative pt-32 md:pt-48 pb-20 px-4 md:px-10 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <span className="text-premium-gold font-bold tracking-[0.5em] uppercase text-[10px] mb-6 block">The Art of Precision</span>
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-[0.85] mb-8 text-bottle-green tracking-tighter">
              VORREX <br /> 
              <span className="italic font-light text-gray-300">Excellence</span>
            </h1>
            <p className="text-gray-500 text-base md:text-lg mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
              Experience the pinnacle of horological mastery. Where Swiss heritage meets avant-garde design.
            </p>
            <div className="flex flex-wrap gap-4 md:gap-6 items-center justify-center lg:justify-start">
              <Link to="/shop" className="bg-bottle-green text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-bold hover:bg-bottle-green-light transition-all flex items-center gap-3 premium-shadow group text-sm uppercase tracking-widest">
                Explore Collection
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white object-cover shadow-sm" referrerPolicy="no-referrer" />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-premium-gold mb-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                  <span className="text-sm font-bold text-bottle-green ml-2">4.9/5</span>
                </div>
                <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-bold">Trusted by 10k+ Collectors</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative px-4 sm:px-10 lg:px-0"
          >
            {/* Clean Container */}
            <div className="bg-white rounded-[40px] md:rounded-[60px] relative overflow-hidden premium-shadow aspect-[4/5] flex items-center justify-center border border-gray-100 group">
              <video 
                autoPlay 
                muted 
                loop 
                playsInline
                poster="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1600"
                className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-1000 group-hover:scale-105"
              >
                <source src="https://videos.pexels.com/video-files/4440954/4440954-sd_640_360_24fps.mp4" type="video/mp4" />
              </video>
              
              <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
                <span className="bg-white/40 backdrop-blur-xl border border-white/50 text-bottle-green text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-2 md:px-6 md:py-3 rounded-full flex items-center gap-2 shadow-lg">
                  <span className="w-1.5 h-1.5 bg-premium-gold rounded-full animate-pulse"></span>
                  Limited Edition 2024
                </span>
              </div>
              
              <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 z-20">
                <div className="bg-white/20 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-white/30 w-full sm:w-auto text-center sm:text-left">
                  <p className="text-bottle-green text-[9px] uppercase tracking-[0.3em] mb-2 font-bold opacity-70">Masterpiece Series</p>
                  <h3 className="text-bottle-green text-2xl md:text-4xl font-serif font-bold">VORREX Grand</h3>
                </div>
                <div className="bg-premium-gold p-4 md:p-6 rounded-3xl shadow-2xl text-white text-2xl md:text-4xl font-serif font-bold w-full sm:w-auto text-center">$2,499</div>
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
      <section className="bg-gray-50 py-20 md:py-32 px-4 md:px-10">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
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
              className="bg-white p-8 md:p-10 rounded-[40px] premium-shadow hover:-translate-y-2 transition-all duration-500 border border-gray-50 group"
            >
              <div className="w-14 h-14 bg-bottle-green/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-premium-gold/10 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 text-bottle-green uppercase tracking-tight">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 md:py-32 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-20">
            <div className="text-center md:text-left">
              <span className="text-premium-gold font-bold tracking-[0.4em] uppercase text-[10px] mb-4 block">Curated Selection</span>
              <h2 className="text-4xl md:text-6xl font-bold text-bottle-green tracking-tighter">New Arrivals</h2>
            </div>
            <Link to="/shop" className="text-bottle-green font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:text-premium-gold transition-all group">
              View All Products <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {PRODUCTS.filter(p => p.badge === "New Arrival").slice(0, 3).map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col h-full"
              >
                <div className="relative bg-white rounded-[40px] aspect-[4/5] mb-8 overflow-hidden premium-shadow border border-gray-50">
                  {p.badge && (
                    <span className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest text-bottle-green shadow-lg z-10">
                      {p.badge}
                    </span>
                  )}
                  <Link to={`/product/${p.id}`} className="w-full h-full block">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                  </Link>
                  <button 
                    onClick={() => addToCart(p)}
                    className="absolute bottom-8 left-8 right-8 bg-bottle-green text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl z-10"
                  >
                    Add to Cart
                  </button>
                </div>
                <div className="text-center px-4 flex flex-col flex-grow">
                  <p className="text-gray-400 text-[9px] uppercase tracking-[0.3em] mb-3 font-bold">{p.category}</p>
                  <Link to={`/product/${p.id}`} className="mb-3 block">
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-bottle-green hover:text-premium-gold transition-colors leading-tight">{p.name}</h3>
                  </Link>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-4 font-medium">{p.model}</p>
                  <div className="mt-auto">
                    <p className="text-premium-gold font-serif text-2xl md:text-3xl font-bold">${p.price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Section */}
      <section className="bg-bottle-green text-white overflow-hidden relative py-24 md:py-40 px-4 md:px-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#fff,transparent)] scale-150"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <span className="text-premium-gold font-bold tracking-[0.5em] uppercase text-[10px] mb-8 block">Timeless Aesthetics</span>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-10 leading-[0.9] tracking-tighter">Modern Watches For <br /> <span className="text-gray-400 italic font-light">Every Occasion</span></h2>
              <p className="text-white/60 text-base md:text-lg mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">A perfect balance of style and performance for every moment. Whether it's a formal gala or a casual weekend, VORREX is your perfect companion.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8">
                <Link to="/shop" className="bg-premium-gold text-bottle-green px-10 md:px-14 py-4 md:py-5 rounded-full font-bold hover:bg-white transition-all w-full sm:w-fit premium-shadow text-sm uppercase tracking-widest">Explore Collection</Link>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 text-premium-gold">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}</div>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">(2.7k+ Reviews)</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-[60px] overflow-hidden premium-shadow border border-white/10 aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1619134778706-7015533a6150?w=1000" 
                  alt="Luxury VORREX Watch" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bottle-green/60 to-transparent"></div>
              </div>
              <div className="absolute -bottom-10 -left-10 bg-premium-gold p-10 rounded-[40px] shadow-2xl border-8 border-bottle-green">
                <p className="text-bottle-green font-serif font-bold text-5xl">2024</p>
                <p className="text-bottle-green/60 text-[10px] font-bold uppercase tracking-[0.3em]">Edition</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const ShopPage = () => {
  const { addToCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  
  const [filter, setFilter] = useState("All");
  const categories = ["All", "New Arrivals", "Chronograph", "Classic", "Professional", "Diver", "Luxury"];
  
  const filteredProducts = PRODUCTS.filter(p => {
    const matchesFilter = filter === "All" || 
                         (filter === "New Arrivals" ? p.badge === "New Arrival" : p.category === filter);
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
      className="pt-32 md:pt-48 pb-20 px-4 md:px-10"
    >
      <section>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 md:mb-32">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-premium-gold font-bold tracking-[0.5em] uppercase text-[10px] mb-8 block"
            >
              Exquisite Craftsmanship
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold text-bottle-green mb-16 tracking-tighter"
            >
              {searchQuery ? `Results for "${searchQuery}"` : "The Collection"}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-3 md:gap-4"
            >
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 md:px-10 py-3 md:py-4 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-500 border ${filter === cat ? "bg-bottle-green text-white border-bottle-green premium-shadow scale-105" : "bg-white text-gray-400 hover:text-bottle-green border-gray-100"}`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          </div>

        {filteredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p) => (
                <motion.div 
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="group flex flex-col h-full"
                >
                  <div className="relative bg-white rounded-[40px] aspect-[4/5] mb-8 overflow-hidden premium-shadow border border-gray-50">
                    {p.badge && (
                      <span className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest text-bottle-green shadow-lg z-10">
                        {p.badge}
                      </span>
                    )}
                    <Link to={`/product/${p.id}`} className="w-full h-full block">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                    </Link>
                    <button 
                      onClick={() => addToCart(p)}
                      className="absolute bottom-8 left-8 right-8 bg-bottle-green text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl z-10"
                    >
                      Add to Cart
                    </button>
                  </div>
                  <div className="text-center px-4 flex flex-col flex-grow">
                    <p className="text-gray-400 text-[9px] uppercase tracking-[0.3em] mb-3 font-bold">{p.category}</p>
                    <Link to={`/product/${p.id}`} className="mb-3 block">
                      <h3 className="text-xl md:text-2xl font-serif font-bold text-bottle-green hover:text-premium-gold transition-colors leading-tight">{p.name}</h3>
                    </Link>
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-4 font-medium">{p.model}</p>
                    <div className="mt-auto">
                      <p className="text-premium-gold font-serif text-2xl md:text-3xl font-bold">${p.price}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 rounded-[60px] border border-dashed border-gray-200">
            <Search size={48} className="text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-bottle-green mb-4">No products found matching your search.</h3>
            <button onClick={() => { setFilter("All"); navigate("/shop"); }} className="text-premium-gold font-bold uppercase tracking-[0.3em] text-[10px] hover:text-bottle-green transition-colors">Clear All Filters</button>
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
    className="pt-32 md:pt-48 pb-20 px-4 md:px-10"
  >
    <section>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center mb-32 md:mb-48">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-premium-gold font-bold tracking-[0.5em] uppercase text-[10px] mb-8 block">Our Legacy</span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-bottle-green mb-10 leading-[0.9] tracking-tighter">Crafting Excellence <br /> <span className="text-gray-300 italic font-light">Since 1994</span></h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed font-medium">
              Founded in the heart of Switzerland, VORREX began with a simple vision: to create timepieces that transcend trends and become part of a person's legacy.
            </p>
            <p className="text-gray-500 text-lg leading-relaxed font-medium">
              Every VORREX watch is the result of hundreds of hours of meticulous work by master horologists, combining centuries-old techniques with cutting-edge materials.
            </p>
          </motion.div>
          <div className="relative">
            <div className="rounded-[60px] overflow-hidden premium-shadow border border-gray-100 aspect-square">
              <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000" alt="Craftsmanship" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white p-10 rounded-[40px] shadow-2xl border border-gray-50 hidden md:block">
              <p className="text-premium-gold font-serif font-bold text-5xl">30+</p>
              <p className="text-bottle-green/40 text-[10px] font-bold uppercase tracking-[0.3em]">Years of Mastery</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 text-center">
          {[
            { icon: <ShieldCheck size={48} className="text-premium-gold mx-auto mb-8" />, title: "Lifetime Warranty", desc: "We stand behind our craftsmanship with a comprehensive lifetime guarantee." },
            { icon: <Gem size={48} className="text-premium-gold mx-auto mb-8" />, title: "Ethical Sourcing", desc: "All our materials are ethically sourced and environmentally responsible." },
            { icon: <Clock size={48} className="text-premium-gold mx-auto mb-8" />, title: "Swiss Movement", desc: "Powered by the world's most precise and reliable Swiss automatic movements." }
          ].map((item, i) => (
            <div key={i} className="p-10 md:p-12 bg-white rounded-[60px] premium-shadow border border-gray-50 group hover:-translate-y-2 transition-all duration-500">
              <div className="mb-8 transition-transform group-hover:scale-110 duration-500">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-bottle-green mb-6 uppercase tracking-tight">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
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
    className="pt-32 md:pt-48 pb-20 px-4 md:px-10"
  >
    <section>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 md:mb-32">
          <span className="text-premium-gold font-bold tracking-[0.5em] uppercase text-[10px] mb-8 block">Concierge Service</span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold text-bottle-green tracking-tighter">Get In Touch</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-start">
          <div className="space-y-10 md:space-y-16">
            <div className="flex gap-8 group">
              <div className="w-20 h-20 bg-bottle-green/5 rounded-[32px] flex items-center justify-center flex-shrink-0 group-hover:bg-premium-gold/10 transition-colors duration-500">
                <MapPin className="text-premium-gold" size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-bottle-green mb-3 uppercase tracking-tight">Our Boutique</h4>
                <p className="text-gray-500 text-lg leading-relaxed font-medium">123 Luxury Avenue, Geneva <br /> Switzerland, 1201</p>
              </div>
            </div>
            <div className="flex gap-8 group">
              <div className="w-20 h-20 bg-bottle-green/5 rounded-[32px] flex items-center justify-center flex-shrink-0 group-hover:bg-premium-gold/10 transition-colors duration-500">
                <Phone className="text-premium-gold" size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-bottle-green mb-3 uppercase tracking-tight">Call Us</h4>
                <p className="text-gray-500 text-lg leading-relaxed font-medium">+41 22 123 4567 <br /> Mon - Fri, 9am - 6pm</p>
              </div>
            </div>
            <div className="flex gap-8 group">
              <div className="w-20 h-20 bg-bottle-green/5 rounded-[32px] flex items-center justify-center flex-shrink-0 group-hover:bg-premium-gold/10 transition-colors duration-500">
                <Mail className="text-premium-gold" size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-bottle-green mb-3 uppercase tracking-tight">Email Us</h4>
                <p className="text-gray-500 text-lg leading-relaxed font-medium">concierge@vorrex.com <br /> support@vorrex.com</p>
              </div>
            </div>
          </div>

          <form className="bg-white p-8 md:p-16 rounded-[60px] premium-shadow space-y-8 border border-gray-50">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">First Name</label>
                <input type="text" className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 ring-premium-gold/10 transition-all border border-transparent focus:border-premium-gold/20" placeholder="John" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Last Name</label>
                <input type="text" className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 ring-premium-gold/10 transition-all border border-transparent focus:border-premium-gold/20" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Email Address</label>
              <input type="email" className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 ring-premium-gold/10 transition-all border border-transparent focus:border-premium-gold/20" placeholder="john@example.com" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Message</label>
              <textarea rows={5} className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 ring-premium-gold/10 transition-all border border-transparent focus:border-premium-gold/20 resize-none" placeholder="How can we help you?"></textarea>
            </div>
            <button className="w-full bg-bottle-green text-white py-6 rounded-full font-bold hover:bg-bottle-green-light transition-all premium-shadow uppercase tracking-[0.2em] text-xs">
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

  if (!product) return <div className="pt-48 text-center font-serif text-3xl text-bottle-green">Product not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 md:pt-48 pb-24 px-4 md:px-10">
      <section>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
        <div className="bg-white rounded-[60px] aspect-[4/5] flex items-center justify-center relative overflow-hidden premium-shadow group border border-gray-50">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            src={product.img} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          {product.badge && (
            <span className="absolute top-10 left-10 bg-white/90 backdrop-blur-md px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest text-bottle-green shadow-2xl z-10 border border-gray-100">
              {product.badge}
            </span>
          )}
        </div>
        <div className="space-y-12 text-center lg:text-left">
          <div>
            <span className="text-premium-gold font-bold tracking-[0.5em] uppercase text-[10px] mb-8 block">{product.category}</span>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-bottle-green mb-6 tracking-tighter leading-[0.85]">{product.name}</h1>
            <p className="text-xl md:text-2xl text-gray-300 uppercase tracking-[0.4em] font-light">{product.model}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 md:gap-12">
            <p className="text-6xl md:text-7xl font-serif font-bold text-premium-gold">${product.price}</p>
            <div className="hidden sm:block h-16 w-px bg-gray-100"></div>
            <div className="flex flex-col items-center lg:items-start gap-3">
              <div className="flex gap-1 text-premium-gold">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">(4.9/5.0 Rating)</span>
            </div>
          </div>

          <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">{product.description}</p>
          
          <div className="pt-10 space-y-8">
            <button 
              onClick={() => addToCart(product)}
              className="w-full bg-bottle-green text-white py-6 md:py-8 rounded-full font-bold text-sm uppercase tracking-[0.3em] hover:bg-bottle-green-light transition-all premium-shadow flex items-center justify-center gap-4 group"
            >
              Add to Shopping Bag <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center lg:items-start text-center lg:text-left group hover:bg-white transition-colors duration-500">
                <ShieldCheck className="text-premium-gold mb-4 group-hover:scale-110 transition-transform" size={32} />
                <h4 className="font-bold text-bottle-green text-xs uppercase tracking-[0.2em]">Lifetime Warranty</h4>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Guaranteed Swiss quality</p>
              </div>
              <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center lg:items-start text-center lg:text-left group hover:bg-white transition-colors duration-500">
                <Clock className="text-premium-gold mb-4 group-hover:scale-110 transition-transform" size={32} />
                <h4 className="font-bold text-bottle-green text-xs uppercase tracking-[0.2em]">Priority Shipping</h4>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Complimentary worldwide</p>
              </div>
            </div>
          </div>
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
          throw { code: "auth/weak-password" };
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
      let msg = "An unexpected error occurred. Please try again.";
      const code = err.code || "";
      
      if (code === "auth/user-not-found") msg = "No account found with this email address.";
      else if (code === "auth/wrong-password") msg = "The password you entered is incorrect.";
      else if (code === "auth/email-already-in-use") msg = "This email is already registered.";
      else if (code === "auth/invalid-email") msg = "Please enter a valid email address.";
      else if (code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      else if (code === "auth/too-many-requests") msg = "Too many failed attempts. Please try again later.";
      else if (err.message) msg = err.message;
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-32 md:pt-48 pb-20 px-4 md:px-10 flex items-center justify-center bg-gray-50"
    >
      <div className="w-full max-w-2xl bg-white p-8 md:p-20 rounded-[60px] premium-shadow border border-gray-100">
        <div className="text-center mb-16">
          <span className="text-premium-gold font-bold tracking-[0.5em] uppercase text-[10px] mb-8 block">Member Access</span>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-bottle-green tracking-tighter mb-4">{isRegister ? "Create Account" : "Welcome Back"}</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">Join the VORREX Collectors Circle</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-6 rounded-3xl mb-10 flex items-center gap-4 text-sm font-medium border border-red-100">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all font-medium" 
              placeholder="email@example.com" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all font-medium" 
              placeholder="••••••••" 
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-bottle-green text-white py-6 rounded-full font-bold uppercase tracking-[0.3em] text-xs premium-shadow hover:bg-bottle-green-light transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegister ? "Sign Up Now" : "Sign In Account"}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-premium-gold font-bold uppercase tracking-[0.2em] text-[10px] hover:text-bottle-green transition-colors"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </motion.div>
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
      <div className="pt-48 pb-32 text-center px-4">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10">
          <ShoppingCart size={40} className="text-gray-200" />
        </div>
        <h2 className="text-4xl font-serif font-bold text-bottle-green mb-8 tracking-tighter">Your bag is empty</h2>
        <Link to="/shop" className="bg-bottle-green text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-xs premium-shadow inline-block">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 md:pt-48 pb-24 px-4 md:px-10">
      <section>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 mb-20 md:mb-32">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${step >= i ? "bg-bottle-green text-white shadow-xl scale-110" : "bg-gray-100 text-gray-300"}`}>
                {step > i ? <CheckCircle2 size={24} /> : i}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${step >= i ? "text-bottle-green" : "text-gray-300"}`}>
                {i === 1 ? "Shipping" : i === 2 ? "Payment" : "Success"}
              </span>
              {i < 3 && <div className={`hidden md:block w-24 h-px ${step > i ? "bg-bottle-green" : "bg-gray-100"}`}></div>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 md:p-16 rounded-[60px] premium-shadow space-y-8 border border-gray-50">
                <h3 className="text-3xl font-serif font-bold text-bottle-green mb-10 tracking-tight">Shipping Details</h3>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">First Name</label>
                    <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="John" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Last Name</label>
                    <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Full Address</label>
                  <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="123 Luxury St, Apt 4B" />
                </div>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">City</label>
                    <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="Geneva" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Postal Code</label>
                    <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="1201" />
                  </div>
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-bottle-green text-white py-6 rounded-full font-bold uppercase tracking-[0.3em] text-xs premium-shadow hover:bg-bottle-green-light transition-all">Continue to Payment</button>
              </div>
            </div>
            <div className="bg-gray-50 p-10 rounded-[60px] border border-gray-100 sticky top-32">
              <h3 className="font-bold text-bottle-green mb-10 uppercase tracking-[0.3em] text-[10px] text-center">Order Summary</h3>
              <div className="space-y-6 mb-10">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-gray-100 flex-shrink-0">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-bottle-green leading-tight">{item.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-bottle-green">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-8 space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                  <span>Subtotal</span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                  <span>Shipping</span>
                  <span className="text-green-500">Free</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-xl font-bold text-bottle-green uppercase tracking-tight">Total</span>
                  <span className="text-3xl font-serif font-bold text-premium-gold">${totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto bg-white p-8 md:p-16 rounded-[60px] premium-shadow border border-gray-50">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-premium-gold/10 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <Lock className="text-premium-gold" size={32} />
              </div>
              <h3 className="text-3xl font-serif font-bold text-bottle-green mb-4 tracking-tight">Secure Payment</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">Your transaction is fully encrypted</p>
            </div>
            
            <div className="space-y-8 mb-12">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Card Number</label>
                <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="0000 0000 0000 0000" />
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">Expiry Date</label>
                  <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="MM / YY" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-bottle-green ml-2">CVC / CVV</label>
                  <input className="w-full bg-gray-50 rounded-3xl px-8 py-5 outline-none border border-transparent focus:border-premium-gold/20 focus:ring-4 ring-premium-gold/10 transition-all" placeholder="123" />
                </div>
              </div>
            </div>
            <button 
              disabled={loading}
              onClick={handlePlaceOrder}
              className="w-full bg-bottle-green text-white py-6 rounded-full font-bold uppercase tracking-[0.3em] text-xs premium-shadow hover:bg-bottle-green-light transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? "Processing..." : `Complete Purchase — $${totalPrice}`}
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
  <footer className="bg-white pt-32 pb-16 px-4 md:px-10 border-t border-gray-50">
    <div className="max-w-7xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24 mb-32">
        <div className="sm:col-span-2">
          <h2 className="text-4xl font-serif font-bold text-bottle-green mb-10 uppercase tracking-tighter">VORREX</h2>
          <p className="text-gray-500 max-w-sm mb-12 leading-relaxed font-medium text-lg">
            Crafting excellence since 1994. We believe that a watch is more than just a timepiece—it's a statement of character and a legacy of precision.
          </p>
          <div className="flex gap-6">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a key={i} href="#" className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-bottle-green hover:bg-premium-gold hover:text-white transition-all duration-500 shadow-sm">
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-bottle-green font-bold uppercase tracking-[0.3em] text-[10px] mb-10">Quick Links</h4>
          <ul className="space-y-6 text-gray-400 text-sm font-bold uppercase tracking-widest">
            <li><Link to="/about" className="hover:text-premium-gold transition-colors">About Us</Link></li>
            <li><Link to="/shop" className="hover:text-premium-gold transition-colors">Our Collections</Link></li>
            <li><a href="#" className="hover:text-premium-gold transition-colors">Store Locator</a></li>
            <li><Link to="/contact" className="hover:text-premium-gold transition-colors">Contact Support</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-bottle-green font-bold uppercase tracking-[0.3em] text-[10px] mb-10">Newsletter</h4>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-loose">Subscribe to receive updates, access to exclusive deals, and more.</p>
          <div className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="Your email" 
              className="bg-gray-50 rounded-3xl px-8 py-5 text-sm outline-none focus:ring-4 ring-premium-gold/10 transition-all border border-transparent focus:border-premium-gold/20"
            />
            <button className="bg-bottle-green text-white py-5 rounded-3xl hover:bg-bottle-green-light transition-all font-bold uppercase tracking-[0.3em] text-[10px] premium-shadow">
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
      
      <div className="pt-16 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10 text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold text-center md:text-left">
        <p>© 2024 VORREX LUXURY WATCHES. ALL RIGHTS RESERVED.</p>
        <div className="flex flex-wrap justify-center gap-10">
          <a href="#" className="hover:text-bottle-green transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-bottle-green transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-bottle-green transition-colors">Cookie Policy</a>
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
