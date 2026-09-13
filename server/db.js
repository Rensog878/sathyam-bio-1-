/**
 * Sathya Bio - High Performance Structured Database Engine
 * Persistent, MongoDB-backed relational store (via Mongoose) with the same
 * business logic, filtering, sorting and computed-field behavior as the
 * original JSON-file engine, but safe for Vercel's read-only filesystem.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { hashPassword, isPasswordHash, passwordProblems, weakPasswordMessage } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'database.json');

// Do not buffer operations if disconnected
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);

// ================= CONNECTION (serverless-safe, cached across invocations) =================

let cached = global._mongooseConn;
if (!cached) {
    cached = global._mongooseConn = { conn: null, promise: null };
}

let seedPromise = null;
const localEphemeral = new Map();

function usingLocalFallback() {
      return cached.conn?.localFallback === true || mongoose.connection.readyState !== 1;
}

function getLocalStore() {
      if (!global._localStore) {
            let store = {
                  users: INITIAL_USERS.map(u => ({ ...u })),
                  products: INITIAL_PRODUCTS.map(p => ({ ...p })),
                  orders: INITIAL_ORDERS.map(o => ({ ...o })),
                  invoices: [],
                  cms: { ...INITIAL_CMS },
                  advisorySubscribers: INITIAL_ADVISORY_SUBSCRIBERS.map(a => ({ ...a })),
                  inventory: INITIAL_INVENTORY.map(i => ({ ...i })),
                  staffTasks: INITIAL_STAFF_TASKS.map(t => ({ ...t })),
                  tickets: INITIAL_TICKETS.map(t => ({ ...t })),
                  chatRecords: INITIAL_CHAT_RECORDS.map(c => ({ ...c })),
                  profileFields: DEFAULT_PROFILE_FIELDS.map(f => ({ ...f })),
                  catalogOptions: { ...DEFAULT_CATALOG_OPTIONS },
                  wishlists: []
            };
            try {
                  if (fs.existsSync(DATA_FILE)) {
                        const disk = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                        if (disk.users?.length) {
                              const existing = new Set(disk.users.map(u => u.id || u.phone || u.email));
                              store.users = [...disk.users];
                              for (const u of INITIAL_USERS) {
                                    if (!existing.has(u.id) && !existing.has(u.phone) && !existing.has(u.email)) {
                                          store.users.push({ ...u });
                                    }
                              }
                        }
                        if (disk.products?.length) {
                              const existing = new Set(disk.products.map(p => p.id));
                              store.products = [...disk.products];
                              for (const p of INITIAL_PRODUCTS) {
                                    if (!existing.has(p.id)) store.products.push({ ...p });
                              }
                        }
                        if (disk.orders?.length) {
                              const existing = new Set(disk.orders.map(o => o.id));
                              store.orders = [...disk.orders];
                              for (const o of INITIAL_ORDERS) {
                                    if (!existing.has(o.id)) store.orders.push({ ...o });
                              }
                        }
                        if (disk.invoices?.length) store.invoices = disk.invoices;
                        if (disk.cms && Object.keys(disk.cms).length) store.cms = disk.cms;
                        if (disk.profileFields?.length) store.profileFields = disk.profileFields;
                        if (disk.catalogOptions) store.catalogOptions = disk.catalogOptions;
                  }
            } catch (e) {
                  console.error('Error reading database.json:', e);
            }
            if (!store.orders.length) {
                  store.orders = INITIAL_ORDERS.map(o => ({ ...o }));
            }
            if (!store.products.length && INITIAL_PRODUCTS.length) {
                  store.products = INITIAL_PRODUCTS.map(p => ({ ...p }));
            }
            global._localStore = store;
      }
      return global._localStore;
}

function persistLocalStore() {
      try {
            if (!global._localStore) return;
            const dir = path.dirname(DATA_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(DATA_FILE, JSON.stringify(global._localStore, null, 2), 'utf8');
      } catch (e) {
            console.error('Error saving database.json:', e);
      }
}

function getLocalUsers() {
      return getLocalStore().users;
}

export async function connectDB() {
    if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI || '';
  if (uri.includes('<cluster-url>') || uri.includes('<username>')) {
            cached.conn = { localFallback: true };
            getLocalStore();
            return cached.conn;
  }

  if (!cached.promise) {
        if (!uri) {
                throw new Error(
                          'MONGODB_URI environment variable is not set. Configure it (e.g. a MongoDB Atlas connection string) before the API can serve requests.'
                        );
        }
        mongoose.set('strictQuery', false);
        cached.promise = mongoose.connect(uri, { bufferCommands: false }).then(m => m);
  }

  try {
        cached.conn = await cached.promise;
  } catch (err) {
        cached.promise = null;
        throw err;
  }

  if (!seedPromise) {
        seedPromise = seedIfEmpty().catch(err => {
                console.error('Database seed error:', err);
                seedPromise = null;
        });
  }
    await seedPromise;

  return cached.conn;
}

// ================= SCHEMAS / MODELS =================
// _id is kept as the existing human-readable string id (USR-1001, sb-01,
// SB-ORD-8821, etc.) instead of switching to Mongo ObjectIds, and every
// schema is permissive (strict:false) so no field present in the original
// loosely-typed JSON records is ever silently dropped.

const permissive = { strict: false, minimize: false, versionKey: '__v' };

// phone is unique: sparse so accounts without a number are still allowed.
// The index only builds once existing duplicates are removed (dedupe-phones.js).
const userSchema = new mongoose.Schema(
    { _id: String, phone: { type: String, unique: true, sparse: true } },
    permissive
);
const productSchema = new mongoose.Schema({ _id: String }, permissive);
const orderSchema = new mongoose.Schema({ _id: String }, permissive);
const invoiceSchema = new mongoose.Schema({ _id: String }, permissive);
const advisorySubscriberSchema = new mongoose.Schema({ _id: String }, permissive);
const inventoryItemSchema = new mongoose.Schema({ _id: String }, permissive);
const staffTaskSchema = new mongoose.Schema({ _id: String }, permissive);
const ticketSchema = new mongoose.Schema({ _id: String }, permissive);
const chatRecordSchema = new mongoose.Schema({ _id: String }, permissive);
// One cart per user: _id is the user's id.
const cartSchema = new mongoose.Schema({ _id: String }, permissive);
const wishlistItemSchema = new mongoose.Schema({ _id: String }, permissive);
const settingsSchema = new mongoose.Schema(
  {
        _id: String,
        cms: mongoose.Schema.Types.Mixed,
        catalogOptions: mongoose.Schema.Types.Mixed,
        profileFields: mongoose.Schema.Types.Mixed
  },
  { strict: false, minimize: false }
  );

// Razorpay order ids are single-use: a replayed or double-submitted payment can
// never produce a second order. Older orders without one are left out of the index.
orderSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, partialFilterExpression: { razorpayOrderId: { $type: 'string' } } }
);

// Short-lived server state (OTP codes, rate-limit counters, checkout sessions).
// Kept in MongoDB rather than process memory so it survives across serverless
// instances; MongoDB deletes each record once purgeAt has passed.
const ephemeralSchema = new mongoose.Schema(
  { _id: String, value: mongoose.Schema.Types.Mixed, purgeAt: Date },
  { strict: false, minimize: false, versionKey: false }
);
ephemeralSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
const AdvisorySubscriber =
    mongoose.models.AdvisorySubscriber || mongoose.model('AdvisorySubscriber', advisorySubscriberSchema);
const InventoryItem = mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema);
const StaffTask = mongoose.models.StaffTask || mongoose.model('StaffTask', staffTaskSchema);
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
const ChatRecord = mongoose.models.ChatRecord || mongoose.model('ChatRecord', chatRecordSchema);
const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
const WishlistItem = mongoose.models.WishlistItem || mongoose.model('WishlistItem', wishlistItemSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
const Ephemeral = mongoose.models.Ephemeral || mongoose.model('Ephemeral', ephemeralSchema);
const blogSchema = new mongoose.Schema({ _id: String }, permissive);
const videoSchema = new mongoose.Schema({ _id: String }, permissive);
const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);


export const USER_ROLES = ['farmer', 'admin', 'employee', 'delivery', 'billing'];

// Human-readable ids with enough randomness that records created in the same
// millisecond (or by concurrent serverless instances) cannot collide.
export function newId(prefix) {
    const time = Date.now().toString(36).toUpperCase();
    const random = crypto.randomInt(0, 36 ** 4).toString(36).toUpperCase().padStart(4, '0');
    return `${prefix}-${time}${random}`;
}

function inputError(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
}

// ================= SERIALIZATION HELPERS =================

// Strips Mongo's _id/__v and re-exposes the record's own `id` field
// (mirrored from _id), matching the shape the original JSON records had.
function serialize(doc) {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const { _id, __v, ...rest } = obj;
    return { id: _id, ...rest };
}

// Users never leave the database layer with their password unless the caller
// explicitly needs it to check a login.
function serializeUser(doc, { includePassword = false } = {}) {
    const user = serialize(doc);
    if (!user || includePassword) return user;
    const { password, ...safe } = user;
    return safe;
}

// Strips Mongo's _id/__v without adding an `id` field - used for records
// (like chat sessions) whose natural key isn't called `id`.
function stripMongoFields(doc) {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const { _id, __v, ...rest } = obj;
    return rest;
}

// Replicates the defaulting + review-rating aggregation logic that the
// original db.js applied once at load() time - applied here on every read.
function normalizeProduct(product) {
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    return {
          ...product,
          images:
            Array.isArray(product.images) && product.images.length
              ? product.images
                    : product.image
              ? [product.image]
                    : [],
          howToUse: product.howToUse || '',
          whenToUse: product.whenToUse || '',
          relatedBlogs: Array.isArray(product.relatedBlogs) ? product.relatedBlogs : [],
          taggedBlogs: Array.isArray(product.taggedBlogs) ? product.taggedBlogs : [],
          taggedVideos: Array.isArray(product.taggedVideos) ? product.taggedVideos : [],
          relatedProductIds: Array.isArray(product.relatedProductIds) ? product.relatedProductIds : [],
          reviewsEnabled: product.reviewsEnabled === true,
          reviews,
          rating: reviews.length
            ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
                  : null,
          reviewsCount: reviews.length
    };
}

// ================= DEFAULT / SEED DATA =================

const DEFAULT_CATALOG_OPTIONS = {
    categories: ['Fungicide', 'Insecticide', 'Herbicide', 'Bio-Stimulant', 'Fertilizer', 'Nematicide', 'Adjuvant'],
    crops: [
          'Paddy / Rice',
          'Wheat',
          'Cotton',
          'Tomato',
          'Corn / Maize',
          'Sugarcane',
          'Citrus / Fruits',
          'Grapes / Fruits',
          'Potato'
        ],
    storageBatches: ['250g', '500g', '1kg', '250ml', '500ml', '1 Litre', '5 Litres']
};

const DEFAULT_PROFILE_FIELDS = [
  { id: 'name', title: 'Full name', type: 'text', required: true, editable: true },
  { id: 'email', title: 'Email address', type: 'email', required: false, editable: true },
  { id: 'phone', title: 'Mobile number', type: 'tel', required: true, editable: false },
  { id: 'village', title: 'Village / town', type: 'text', required: false, editable: true },
  { id: 'district', title: 'District', type: 'text', required: false, editable: true },
  { id: 'state', title: 'State', type: 'text', required: false, editable: true },
  { id: 'crop', title: 'Primary crop', type: 'text', required: false, editable: true },
  { id: 'acreage', title: 'Farm size (acres)', type: 'number', required: false, editable: true }
  ];

const INITIAL_CMS = {
    heroTitle: 'SATHYA BIO-PESTICIDES & CROP CARE',
    heroSubtitle: 'Government & 100% Bio-Certified Solutions for High Yield & Zero Chemical Residue Farming',
    bannerAnnouncement:
          '🎉 KHARIF SPECIAL: Flat 20% OFF on Bio-Fungicides + Free Agronomist Hotline 1800-425-8899',
    advisoryTitle: 'Get Weekly Crop & Pesticide Recommendations',
    advisorySubtitle:
          'Join 15,000+ farmers receiving our free seasonal advisory newsletter. Kharif & Rabi crop schedules, disease alerts, and exclusive offers every week.',
    contactPhone: '+91 94432 10987',
    contactEmail: 'care@sathyambio.in',
    razorpayKeyId: 'rzp_test_sathyaBioLiveKey102',
    razorpaySecret: 'rzp_secret_mock_live_9988',
    razorpayMode: 'test'
};

const INITIAL_USERS = [
  {
        id: 'USR-1001',
        name: 'Rameshwar Patel',
        phone: '9876543210',
        email: 'rameshwar@farm.in',
        password: 'password123',
        role: 'farmer',
        crop: 'Paddy / Rice',
        acreage: 5,
        village: 'Karur',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        status: 'active',
        createdBy: 'admin',
        createdAt: '2026-08-01T08:00:00.000Z',
        lastLogin: '2026-09-05T14:30:00.000Z'
  },
  {
        id: 'USR-1002',
        name: 'Sathya Admin',
        phone: '9123456789',
        email: 'admin@sathyambio.com',
        password: 'admin',
        role: 'admin',
        crop: 'All Crops',
        acreage: 0,
        village: 'Headquarters',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        status: 'active',
        createdBy: 'system',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLogin: '2026-09-06T10:00:00.000Z'
  },
  {
        id: 'USR-1003',
        name: 'Muthuvel K. (QC)',
        phone: '9234567890',
        email: 'muthuvel@sathyambio.com',
        password: 'password123',
        role: 'employee',
        crop: 'Cotton',
        acreage: 12,
        village: 'Tiruppur',
        district: 'Tiruppur',
        state: 'Tamil Nadu',
        department: 'Quality Control',
        status: 'active',
        createdBy: 'admin',
        createdAt: '2026-06-15T09:00:00.000Z',
        lastLogin: '2026-09-04T16:20:00.000Z'
  },
  {
        id: 'USR-1004',
        name: 'Karthik Raja',
        phone: '9345678901',
        email: 'karthik@sathyambio.com',
        password: 'password123',
        role: 'delivery',
        crop: 'N/A',
        acreage: 0,
        village: 'Erode Central',
        district: 'Erode',
        state: 'Tamil Nadu',
        status: 'active',
        createdBy: 'admin',
        createdAt: '2026-07-10T11:00:00.000Z',
        lastLogin: '2026-09-06T08:15:00.000Z'
  },
  {
        id: 'USR-1005',
        name: 'Billing Operator #04',
        phone: '9456789012',
        email: 'billing@sathyambio.com',
        password: 'password123',
        role: 'billing',
        crop: 'N/A',
        acreage: 0,
        village: 'Coimbatore Hub',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        status: 'active',
        createdBy: 'admin',
        createdAt: '2026-07-20T12:00:00.000Z',
        lastLogin: '2026-09-05T18:00:00.000Z'
  },
  {
        id: 'USR-1006',
        name: 'Suresh Reddy',
        phone: '9884255667',
        email: 'suresh@farm.in',
        password: 'password123',
        role: 'farmer',
        crop: 'Sugarcane',
        acreage: 8,
        village: 'Nandyal',
        district: 'Kurnool',
        state: 'Andhra Pradesh',
        status: 'active',
        createdBy: 'self-registered',
        createdAt: '2026-08-15T10:00:00.000Z',
        lastLogin: '2026-09-02T11:00:00.000Z'
  },
  {
        id: 'USR-1007',
        name: 'Gurpreet Singh',
        phone: '9814077889',
        email: 'gurpreet@punjabfarm.in',
        password: 'password123',
        role: 'farmer',
        crop: 'Wheat',
        acreage: 15,
        village: 'Karnal Suburbs',
        district: 'Karnal',
        state: 'Haryana',
        status: 'active',
        createdBy: 'admin',
        createdAt: '2026-08-20T14:00:00.000Z',
        lastLogin: '2026-09-01T09:45:00.000Z'
  }
  ];

const INITIAL_PRODUCTS = [
  {
    id: 'sb-01',
    _id: 'sb-01',
    name: 'Sathya Bio BlastShield 75 WP',
    tagline: 'Broad Spectrum Organic Bio-Fungicide',
    category: 'Fungicide',
    price: 680,
    originalPrice: 850,
    discount: '20% OFF',
    stock: 120,
    crops: ['Paddy / Rice', 'Wheat', 'Cotton', 'Tomato'],
    diseases: ['Blast', 'Sheath Blight', 'Downy Mildew'],
    activeIngredient: 'Pseudomonas fluorescens 1.5% WP',
    dosage: '500g per Acre',
    packSizes: ['250g', '500g', '1kg'],
    selectedPack: '500g',
    badge: 'Best Seller',
    image: '/assets/p1.png',
    description: 'High efficiency bio-fungicide protecting against fungal infections without harmful residues.',
    targetUserId: 'all',
    targetUserName: 'All Users (General Catalog)',
    sortOrder: 1,
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'sb-02',
    _id: 'sb-02',
    name: 'Sathya Bio FlyKill Ultra',
    tagline: 'Natural Organic Whitefly & Borer Terminator',
    category: 'Insecticide',
    price: 840,
    originalPrice: 1050,
    discount: '20% OFF',
    stock: 85,
    crops: ['Cotton', 'Tomato', 'Sugarcane', 'Citrus / Fruits'],
    diseases: ['Whitefly', 'Bollworm', 'Aphids'],
    activeIngredient: 'Beauveria bassiana 2.0% WP',
    dosage: '250g per Acre',
    packSizes: ['250g', '500g'],
    selectedPack: '250g',
    badge: 'Popular',
    image: '/assets/p2.png',
    description: 'Bio-control agent for suckling and chewing pests, safe for honeybees and earthworms.',
    targetUserId: 'all',
    targetUserName: 'All Users (General Catalog)',
    sortOrder: 2,
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'sb-04',
    _id: 'sb-04',
    name: 'Sathya Bio RootVigor Gold',
    tagline: 'Mycorrhizal Bio-Stimulant for Profuse Rooting',
    category: 'Bio-Stimulant',
    price: 990,
    originalPrice: 1200,
    discount: '18% OFF',
    stock: 150,
    crops: ['Paddy / Rice', 'Wheat', 'Sugarcane', 'Potato', 'Grapes / Fruits'],
    diseases: ['Root Rot', 'Nutrient Deficiency'],
    activeIngredient: 'VAM Endomycorrhiza 100 IP/gm',
    dosage: '1 Litre per Acre (Drip)',
    packSizes: ['500ml', '1 Litre', '5 Litres'],
    selectedPack: '1 Litre',
    badge: 'Farmer Choice',
    image: '/assets/p3.png',
    description: 'Accelerates nutrient absorption by 300% and increases drought tolerance in all crops.',
    targetUserId: 'all',
    targetUserName: 'All Users (General Catalog)',
    sortOrder: 3,
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'sb-05',
    _id: 'sb-05',
    name: 'Sathya Bio NeemShield 10000 PPM',
    tagline: 'Cold Pressed Pure Azadirachtin EC Formulation',
    category: 'Insecticide',
    price: 550,
    originalPrice: 650,
    discount: '15% OFF',
    stock: 200,
    crops: ['All Crops'],
    diseases: ['Pest Repellent', 'Oviposition Deterrent'],
    activeIngredient: 'Azadirachtin 1% (10000 PPM)',
    dosage: '500ml per Acre',
    packSizes: ['250ml', '500ml', '1 Litre'],
    selectedPack: '500ml',
    badge: 'Eco-Certified',
    image: '/assets/p4.png',
    description: 'Organic cold-pressed neem concentrate providing long-lasting broad spectrum pest repellent shield.',
    targetUserId: 'all',
    targetUserName: 'All Users (General Catalog)',
    sortOrder: 4,
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'sb-06',
    _id: 'sb-06',
    name: 'Sathya Bio Trichoderma Viride',
    tagline: 'Soil Health & Wilt Disease Controller',
    category: 'Fungicide',
    price: 420,
    originalPrice: 500,
    discount: '16% OFF',
    stock: 140,
    crops: ['Paddy / Rice', 'Cotton', 'Corn / Maize', 'Tomato'],
    diseases: ['Fusarium Wilt', 'Collar Rot', 'Damping Off'],
    activeIngredient: 'Trichoderma viride 1.5% WP',
    dosage: '1kg per Acre',
    packSizes: ['500g', '1kg'],
    selectedPack: '1kg',
    badge: 'Soil Healer',
    image: '/assets/p5.png',
    description: 'Bio-fungicide antagonist destroying harmful pathogenic fungi in the root rhizosphere.',
    targetUserId: 'all',
    targetUserName: 'All Users (General Catalog)',
    sortOrder: 5,
    createdAt: '2026-08-01T08:00:00.000Z'
  }
];

const INITIAL_ORDERS = [
  {
    id: 'SB-ORD-9011',
    userId: 'USR-1001',
    customerName: 'Rameshwar Patel',
    customerPhone: '9876543210',
    address: 'Plot 42, Green Valley Farm, Thudiyalur, Coimbatore, Tamil Nadu - 641034',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-01', name: 'Sathya Bio BlastShield 75 WP', qty: 2, price: 680, packSize: '500g' },
      { id: 'sb-04', name: 'Sathya Bio RootVigor Gold', qty: 1, price: 990, packSize: '1 Litre' },
      { id: 'sb-05', name: 'Sathya Bio NeemShield 10000 PPM', qty: 2, price: 550, packSize: '500ml' }
    ],
    subtotal: 3450,
    gst: 0,
    total: 3450,
    paymentMethod: 'Razorpay (UPI)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '4829',
    createdAt: '2026-09-13T09:15:00.000Z'
  },
  {
    id: 'SB-ORD-9012',
    userId: 'USR-1003',
    customerName: 'Muthuvel K.',
    customerPhone: '9234567890',
    address: '7A, Cauvery Nagar, Srirangam, Trichy, Tamil Nadu - 620006',
    district: 'Trichy',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-02', name: 'Sathya Bio FlyKill Ultra', qty: 1, price: 840, packSize: '250g' },
      { id: 'sb-04', name: 'Sathya Bio RootVigor Gold', qty: 1, price: 990, packSize: '1 Litre' }
    ],
    subtotal: 1830,
    gst: 60,
    total: 1890,
    paymentMethod: 'Razorpay (UPI)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Out for Delivery',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '3192',
    createdAt: '2026-09-13T11:40:00.000Z'
  },
  {
    id: 'SB-ORD-9010',
    userId: 'USR-1005',
    customerName: 'Sundaram P.',
    customerPhone: '9443212345',
    address: '12, Alagar Kovil Main Road, K.Pudur, Madurai, Tamil Nadu - 625007',
    district: 'Madurai',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-01', name: 'Sathya Bio BlastShield 75 WP', qty: 3, price: 680, packSize: '500g' },
      { id: 'sb-02', name: 'Sathya Bio FlyKill Ultra', qty: 2, price: 840, packSize: '250g' },
      { id: 'sb-06', name: 'Sathya Bio Trichoderma Viride', qty: 2, price: 420, packSize: '1kg' }
    ],
    subtotal: 4560,
    gst: 360,
    total: 4920,
    paymentMethod: 'Razorpay (Net Banking)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Dispatched',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '7712',
    createdAt: '2026-09-12T14:20:00.000Z'
  },
  {
    id: 'SB-ORD-9009',
    userId: 'USR-1007',
    customerName: 'Gurpreet Singh',
    customerPhone: '9814077889',
    address: 'Khasra 104, GT Road, Karnal, Haryana - 132001',
    district: 'Karnal',
    state: 'Haryana',
    items: [
      { id: 'sb-02', name: 'Sathya Bio FlyKill Ultra', qty: 3, price: 840, packSize: '250g' }
    ],
    subtotal: 2520,
    gst: 450,
    total: 2970,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    deliveryStatus: 'Confirmed',
    assignedDeliveryBoy: 'Unassigned',
    deliveryBoyPhone: '',
    otp: '9152',
    createdAt: '2026-09-11T16:00:00.000Z'
  },
  {
    id: 'SB-ORD-9008',
    userId: 'USR-1004',
    customerName: 'Selvaraj M.',
    customerPhone: '9842176543',
    address: '45, Bhavani Main Road, Perundurai, Erode, Tamil Nadu - 638052',
    district: 'Erode',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-04', name: 'Sathya Bio RootVigor Gold', qty: 4, price: 990, packSize: '1 Litre' },
      { id: 'sb-01', name: 'Sathya Bio BlastShield 75 WP', qty: 3, price: 680, packSize: '500g' }
    ],
    subtotal: 6000,
    gst: 400,
    total: 6400,
    paymentMethod: 'Razorpay (UPI)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '1049',
    createdAt: '2026-09-10T10:15:00.000Z'
  },
  {
    id: 'SB-ORD-9007',
    userId: 'USR-1006',
    customerName: 'Anitha R.',
    customerPhone: '9789012345',
    address: '88, Omalur Main Road, Salem, Tamil Nadu - 636004',
    district: 'Salem',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-05', name: 'Sathya Bio NeemShield 10000 PPM', qty: 2, price: 550, packSize: '500ml' },
      { id: 'sb-02', name: 'Sathya Bio FlyKill Ultra', qty: 1, price: 840, packSize: '250g' }
    ],
    subtotal: 1940,
    gst: 210,
    total: 2150,
    paymentMethod: 'Razorpay (Card)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '8301',
    createdAt: '2026-09-09T13:45:00.000Z'
  },
  {
    id: 'SB-ORD-9006',
    userId: 'USR-1008',
    customerName: 'Karthikeyan N.',
    customerPhone: '9487654321',
    address: '22, Medical College Road, Thanjavur, Tamil Nadu - 613004',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-01', name: 'Sathya Bio BlastShield 75 WP', qty: 4, price: 680, packSize: '500g' },
      { id: 'sb-06', name: 'Sathya Bio Trichoderma Viride', qty: 2, price: 420, packSize: '1kg' }
    ],
    subtotal: 3560,
    gst: 240,
    total: 3800,
    paymentMethod: 'Razorpay (UPI)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '5524',
    createdAt: '2026-09-08T15:30:00.000Z'
  },
  {
    id: 'SB-ORD-9005',
    userId: 'USR-1009',
    customerName: 'Chinnasamy K.',
    customerPhone: '9629123456',
    address: '15, Batlagundu Road, Dindigul, Tamil Nadu - 624001',
    district: 'Dindigul',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-04', name: 'Sathya Bio RootVigor Gold', qty: 3, price: 990, packSize: '1 Litre' },
      { id: 'sb-02', name: 'Sathya Bio FlyKill Ultra', qty: 2, price: 840, packSize: '250g' }
    ],
    subtotal: 4650,
    gst: 550,
    total: 5200,
    paymentMethod: 'Razorpay (UPI)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '6190',
    createdAt: '2026-09-05T09:00:00.000Z'
  },
  {
    id: 'SB-ORD-9004',
    userId: 'USR-1010',
    customerName: 'Vijayalakshmi S.',
    customerPhone: '9865432109',
    address: '6, Palayamkottai High Road, Tirunelveli, Tamil Nadu - 627002',
    district: 'Tirunelveli',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-05', name: 'Sathya Bio NeemShield 10000 PPM', qty: 2, price: 550, packSize: '500ml' }
    ],
    subtotal: 1100,
    gst: 350,
    total: 1450,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    deliveryStatus: 'Cancelled',
    assignedDeliveryBoy: 'Unassigned',
    deliveryBoyPhone: '',
    otp: '2291',
    createdAt: '2026-09-03T11:20:00.000Z'
  },
  {
    id: 'SB-ORD-8821',
    userId: 'USR-1001',
    customerName: 'Rameshwar Patel',
    customerPhone: '9876543210',
    address: 'Plot 42, Green Valley Farm, Karur, Tamil Nadu - 613001',
    district: 'Karur',
    state: 'Tamil Nadu',
    items: [
      { id: 'sb-01', name: 'Sathya Bio BlastShield 75 WP', qty: 2, price: 680, packSize: '500g' },
      { id: 'sb-04', name: 'Sathya Bio RootVigor Gold', qty: 1, price: 990, packSize: '1 Litre' }
    ],
    subtotal: 2350,
    gst: 423,
    total: 2773,
    paymentMethod: 'Razorpay (UPI)',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    assignedDeliveryBoy: 'Karthik Raja',
    deliveryBoyPhone: '9345678901',
    otp: '4829',
    createdAt: '2026-08-30T10:00:00.000Z'
  }
];

const INITIAL_ADVISORY_SUBSCRIBERS = [
  {
        id: 'adv-101',
        name: 'Rameshwar Patel',
        phone: '9876543210',
        crop: 'Paddy/Rice',
        season: 'Kharif',
        acreage: 5,
        subscribedAt: '2026-08-25T10:30:00.000Z',
        status: 'Active',
        lastAdvisorySent: 'BlastShield Dosage Schedule (Week 4)'
  }
  ];

const INITIAL_INVENTORY = [
  {
        id: 'INV-01',
        sku: 'SB-BLAST-75',
        name: 'BlastShield 75 WP (500g)',
        batchNo: 'BATCH-2026-08A',
        warehouse: 'Warehouse 1 (Coimbatore)',
        stockQty: 420,
        minThreshold: 100,
        expiryDate: '2028-08-01',
        costPrice: 420,
        sellingPrice: 680
  },
  {
        id: 'INV-02',
        sku: 'SB-FLY-50',
        name: 'FlyKill Ultra (250g)',
        batchNo: 'BATCH-2026-07B',
        warehouse: 'Warehouse 1 (Coimbatore)',
        stockQty: 185,
        minThreshold: 50,
        expiryDate: '2028-07-15',
        costPrice: 530,
        sellingPrice: 840
  }
  ];

const INITIAL_STAFF_TASKS = [
  {
        id: 'TSK-301',
        title: 'Batch 2026-08A Quality Audit',
        assignedTo: 'Dr. K. Senthil (Agronomist)',
        priority: 'High',
        status: 'In Progress',
        dueDate: '2026-08-31'
  }
  ];

const INITIAL_TICKETS = [
  {
        id: 'TCK-901',
        farmerName: 'Rameshwar Patel',
        phone: '9876543210',
        crop: 'Paddy/Rice',
        subject: 'Leaf yellowing and blast patches in 25-day old paddy',
        category: 'Field Advisory',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Dr. K. Senthil',
        createdAt: '2026-08-29T11:00:00.000Z',
        replies: [
          { from: 'Farmer', text: 'Leaves showing spindle shaped brown spots near tips.', time: '11:00 AM' },
          {
                    from: 'Dr. K. Senthil',
                    text: 'Apply Sathya Bio BlastShield 75 WP @ 120g/acre mixed in 150L water immediately.',
                    time: '11:45 AM'
          }
              ]
  }
  ];

const INITIAL_CHAT_RECORDS = [
  {
        sessionId: 'CHAT-SESS-01',
        farmerName: 'Muthuvel K.',
        farmerPhone: '9234567890',
        channel: 'Web Live Chat',
        status: 'Active',
        updatedAt: '2026-08-30T14:40:00.000Z',
        messages: [
          {
                    sender: 'Farmer',
                    text: 'Hello, what is the best biological insecticide for cotton whitefly?',
                    timestamp: '02:30 PM'
          },
          {
                    sender: 'Sathya Bio Bot',
                    text: 'Hello Muthuvel ji! We recommend Sathya Bio FlyKill Ultra @ 250g per acre.',
                    timestamp: '02:30 PM'
          }
              ]
  }
  ];

async function seedIfEmpty() {
    const userCount = await User.estimatedDocumentCount();
    if (userCount > 0) return;

  console.log('Seeding Sathya Bio database with initial demo data...');

  await User.insertMany(
        await Promise.all(INITIAL_USERS.map(async u => ({ ...u, _id: u.id, password: await hashPassword(u.password) })))
  );
    await Product.insertMany(INITIAL_PRODUCTS.map(p => ({ ...p, _id: p.id })));
    await Order.insertMany(INITIAL_ORDERS.map(o => ({ ...o, _id: o.id })));
    await AdvisorySubscriber.insertMany(INITIAL_ADVISORY_SUBSCRIBERS.map(a => ({ ...a, _id: a.id })));
    await InventoryItem.insertMany(INITIAL_INVENTORY.map(i => ({ ...i, _id: i.id })));
    await StaffTask.insertMany(INITIAL_STAFF_TASKS.map(t => ({ ...t, _id: t.id })));
    await Ticket.insertMany(INITIAL_TICKETS.map(t => ({ ...t, _id: t.id })));
    await ChatRecord.insertMany(INITIAL_CHAT_RECORDS.map(c => ({ ...c, _id: c.sessionId })));

  await Settings.findByIdAndUpdate(
        'global',
    {
            $set: {
                      cms: INITIAL_CMS,
                      catalogOptions: DEFAULT_CATALOG_OPTIONS,
                      profileFields: DEFAULT_PROFILE_FIELDS
            }
    },
    { upsert: true }
      );

  console.log('Sathya Bio database seed complete.');
}

// ================= DATABASE MANAGER (Mongoose-backed) =================

class DatabaseManager {
    // ================= USERS TABLE =================

  async getUsers(filters = {}) {
        await connectDB();
        let result;
        if (usingLocalFallback()) {
            const store = getLocalStore();
            result = (store.users || []).map(u => serializeUser(u));
        } else {
            result = (await User.find({}).lean()).map(u => serializeUser(u));
        }

      if (filters.role && filters.role !== 'all') {
              result = result.filter(u => u.role.toLowerCase() === filters.role.toLowerCase());
      }

      if (filters.search) {
              const q = filters.search.toLowerCase().trim();
              result = result.filter(
                        u =>
                                    u.name?.toLowerCase().includes(q) ||
                                    u.phone?.includes(q) ||
                                    u.email?.toLowerCase().includes(q) ||
                                    u.village?.toLowerCase().includes(q) ||
                                    u.crop?.toLowerCase().includes(q)
                      );
      }

      if (filters.sortBy === 'name') {
              result.sort((a, b) => a.name.localeCompare(b.name));
      } else if (filters.sortBy === 'recent') {
              result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
              result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

                  const products = usingLocalFallback()
                        ? (getLocalStore().products || [])
                        : await Product.find({}, { targetUserId: 1 }).lean();
        return result.map(user => {
                const targetProductCount = products.filter(p => p.targetUserId === user.id).length;
                return {
                          ...user,
                          targetProductCount
                };
        });
  }

  async getUserById(id, options = {}) {
        if (!id || typeof id !== 'string') return null;
        await connectDB();
            if (usingLocalFallback()) {
                  return serializeUser(getLocalUsers().find(user => user.id === id), options);
            }
        const u = await User.findById(id).lean();
        return serializeUser(u, options);
  }

  async getUserByIdentifier(identifier, options = {}) {
        // Coerce defensively: callers may pass a non-string from a JSON body.
        if (!identifier || typeof identifier !== 'string') return null;
        await connectDB();
        const clean = identifier.trim().toLowerCase();
        if (!clean) return null;
                        if (usingLocalFallback()) {
                                    const matches = getLocalUsers()
                                          .filter(user => user.phone === clean || user.email?.toLowerCase() === clean)
                                          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
                                    return serializeUser(matches[0], options);
                        }
        const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Fetch only the matching accounts instead of loading every user.
        const matches = (await User.find({
                $or: [{ phone: clean }, { email: new RegExp(`^${escaped}$`, 'i') }]
        }).lean()).map(u => serializeUser(u, options));

        // Legacy data can hold several accounts on one number; the newest one wins.
        matches.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        return matches[0] || null;
  }

  async getProfileFields() {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            return store.profileFields || DEFAULT_PROFILE_FIELDS;
        }
        const settings = await Settings.findById('global').lean();
        return (settings && settings.profileFields) || DEFAULT_PROFILE_FIELDS;
  }

  async saveProfileFields(fields) {
        await connectDB();
        const cleaned = (fields || [])
          .map((field, index) => ({
                    id: field.id || `profile-field-${Date.now()}-${index}`,
                    title: String(field.title || '').trim(),
                    type: ['text', 'email', 'tel', 'number', 'date', 'textarea', 'select'].includes(field.type)
                      ? field.type
                                : 'text',
                    required: field.required === true,
                    editable: field.editable !== false,
                    options: Array.isArray(field.options) ? field.options.map(String).filter(Boolean) : []
          }))
          .filter(field => field.title);

      await Settings.findByIdAndUpdate('global', { $set: { profileFields: cleaned } }, { upsert: true });
        return cleaned;
  }

  async updateUserProfile(id, profileUpdates) {
        await connectDB();
        const user = await User.findById(id);
        if (!user) return null;

      const fields = await this.getProfileFields();
        const editableFields = new Set(fields.filter(field => field.editable).map(field => field.id));
        const allowed = {};
        // Even if an admin configures a profile field with one of these ids, a
        // user must never be able to change them from their own profile.
        const reserved = new Set(['id', '_id', 'password', 'role', 'status', 'phone', 'createdBy', 'createdAt']);
        for (const [key, value] of Object.entries(profileUpdates || {})) {
                if (editableFields.has(key) && !reserved.has(key)) allowed[key] = value;
        }

      const existingProfile = (user.toObject().profile) || {};
        const mergedProfile = { ...existingProfile, ...allowed };

      user.set(allowed);
        user.set('profile', mergedProfile);
        user.set('updatedAt', new Date().toISOString());
        await user.save();

      return serializeUser(user.toObject());
  }

  async getAddresses(userId) {
            if (!userId) return [];
            await connectDB();
            if (usingLocalFallback()) {
                  return getLocalUsers().find(user => user.id === String(userId))?.addresses || [];
            }
            const user = await User.findById(String(userId), { addresses: 1 }).lean();
            return Array.isArray(user?.addresses) ? user.addresses : [];
  }

  async saveAddress(userId, address) {
            if (!userId) return [];
            await connectDB();
            const cleaned = {
                  id: address.id || newId('ADDR'),
                  label: String(address.label || 'Home').trim().slice(0, 30),
                  doorNo: String(address.doorNo || '').trim().slice(0, 40),
                  street: String(address.street || '').trim().slice(0, 120),
                  area: String(address.area || '').trim().slice(0, 100),
                  taluk: String(address.taluk || '').trim().slice(0, 80),
                  pincode: String(address.pincode || '').replace(/\D/g, '').slice(0, 6),
                  district: String(address.district || '').trim().slice(0, 80),
                  state: String(address.state || '').trim().slice(0, 80),
                  updatedAt: new Date().toISOString()
            };
            if (!cleaned.doorNo || !cleaned.street || !cleaned.area || !/^\d{6}$/.test(cleaned.pincode) || !cleaned.district || !cleaned.state) {
                  throw inputError('INVALID_ADDRESS', 'Please complete every delivery address field.');
            }
            if (usingLocalFallback()) {
                  const user = getLocalUsers().find(record => record.id === String(userId));
                  if (!user) return [];
                  user.addresses = Array.isArray(user.addresses) ? user.addresses : [];
                  const index = user.addresses.findIndex(item => item.id === cleaned.id);
                  if (index >= 0) user.addresses[index] = cleaned;
                  else user.addresses.push(cleaned);
                  persistLocalStore();
                  return user.addresses;
            }
            const user = await User.findById(String(userId), { addresses: 1 });
            if (!user) return [];
            const addresses = Array.isArray(user.addresses) ? user.addresses.filter(item => item.id !== cleaned.id) : [];
            addresses.push(cleaned);
            user.set('addresses', addresses);
            await user.save();
            return addresses;
  }

        async deleteAddress(userId, addressId) {
              if (!userId || !addressId) return false;
              await connectDB();
              if (usingLocalFallback()) {
                  const user = getLocalUsers().find(record => record.id === String(userId));
                  if (!user) return false;
                  const addresses = Array.isArray(user.addresses) ? user.addresses : [];
                  const next = addresses.filter(item => item.id !== String(addressId));
                  if (next.length === addresses.length) return false;
                  user.addresses = next;
                  persistLocalStore();
                  return true;
              }
              const user = await User.findById(String(userId), { addresses: 1 });
              if (!user) return false;
              user.set('addresses', (Array.isArray(user.addresses) ? user.addresses : []).filter(item => item.id !== String(addressId)));
              await user.save();
              return true;
        }

  async createUser(userData) {
        await connectDB();

        // One account per mobile number, whichever path creates the user
        // (self-registration, admin panel, or /api/users).
        const phone = String(userData.phone || '').trim();
            const role = userData.role || 'farmer';
            if (!USER_ROLES.includes(role)) {
                  throw inputError('INVALID_ROLE', 'Unknown user role.');
            }
            const passwordIssues = passwordProblems(userData.password, { role, phone });
            if (passwordIssues.length) {
                  throw inputError('WEAK_PASSWORD', weakPasswordMessage(passwordIssues));
            }

            if (usingLocalFallback()) {
                  const users = getLocalUsers();
                  const clash = users.find(user => phone && user.phone === phone);
                  if (clash) {
                        const err = new Error('This mobile number is already registered.');
                        err.code = 'PHONE_TAKEN';
                        throw err;
                  }

                  const id = newId('USR');
                  const newUser = {
                        id,
                        name: userData.name || 'New User',
                        phone: phone || '',
                        email: userData.email || '',
                        password: await hashPassword(userData.password),
                        role,
                        crop: userData.crop || 'All Crops',
                        acreage: Number(userData.acreage) || 0,
                        village: userData.village || 'Farm Village',
                        district: userData.district || 'Coimbatore',
                        state: userData.state || 'Tamil Nadu',
                        department: userData.department || '',
                        status: userData.status || 'active',
                        createdBy: userData.createdBy || 'self-registered',
                        createdAt: new Date().toISOString(),
                        lastLogin: null
                  };
                  users.push(newUser);
                  persistLocalStore();
                  return serializeUser({ ...newUser });
            }

        if (phone) {
            const clash = await User.findOne({ phone }).lean();
            if (clash) {
                const err = new Error('This mobile number is already registered.');
                err.code = 'PHONE_TAKEN';
                throw err;
            }
        }

        const id = newId('USR');
        const newUser = {
                _id: id,
                id,
                name: userData.name || 'New User',
                // Omitted rather than '' so the unique phone index ignores email-only accounts.
                phone: phone || undefined,
                email: userData.email || '',
                password: await hashPassword(userData.password),
                role,
                crop: userData.crop || 'All Crops',
                acreage: Number(userData.acreage) || 0,
                village: userData.village || 'Farm Village',
                district: userData.district || 'Coimbatore',
                state: userData.state || 'Tamil Nadu',
                department: userData.department || '',
                status: userData.status || 'active',
                createdBy: userData.createdBy || 'admin',
                createdAt: new Date().toISOString(),
                lastLogin: null
        };

      const created = await User.create(newUser);
        return serializeUser(created.toObject());
  }

  async updateUser(id, updates) {
        await connectDB();
            if (usingLocalFallback()) {
                  const user = getLocalUsers().find(record => record.id === id);
                  if (!user) return null;
                  Object.assign(user, updates || {});
                  return serializeUser(user);
            }
        const user = await User.findById(id);
        if (!user) return null;

      const { _id, id: _ignoredId, password, ...rest } = updates || {};
        if (rest.role !== undefined && !USER_ROLES.includes(rest.role)) {
            throw inputError('INVALID_ROLE', 'Unknown user role.');
        }
        if (typeof password === 'string' && password !== '') {
            if (isPasswordHash(password)) {
                rest.password = password;
            } else {
                const passwordIssues = passwordProblems(password, {
                    role: rest.role || user.get('role'),
                    phone: rest.phone ?? user.get('phone')
                });
                if (passwordIssues.length) {
                    throw inputError('WEAK_PASSWORD', weakPasswordMessage(passwordIssues));
                }
                rest.password = await hashPassword(password);
            }
        }
        if (rest.phone === '') {
            delete rest.phone;
            user.set('phone', undefined);
        }

      user.set({ ...rest, updatedAt: new Date().toISOString() });
        await user.save();
        return serializeUser(user.toObject());
  }

  // Removes every account holding this number. Used for whitelisted test
  // numbers, which re-register repeatedly and must not leave duplicates behind.
  async deleteUsersByPhone(phone) {
        if (!phone) return 0;
        await connectDB();
        const result = await User.deleteMany({ phone: String(phone) });
        return result.deletedCount || 0;
  }

  async deleteUser(id) {
        await connectDB();
            if (usingLocalFallback()) {
                  const users = getLocalUsers();
                  const index = users.findIndex(user => user.id === String(id) || user._id === String(id));
                  if (index === -1) return false;
                  users.splice(index, 1);
                  persistLocalStore();
                  return true;
            }
        const user = await User.findById(id).lean();
        if (!user) return false;

      await Product.updateMany(
        { targetUserId: id },
        { $set: { targetUserId: 'all', targetUserName: 'All Users (General Catalog)' } }
            );

      await User.deleteOne({ _id: id });
        return true;
  }

  // ================= PRODUCTS TABLE =================

  async getProducts(options = {}) {
        await connectDB();
        const { userId, category, crop, disease, search, sortBy, onlineOnly } = options;
        let list;
        if (usingLocalFallback()) {
            const store = getLocalStore();
            list = (store.products || []).map(p => normalizeProduct({ ...p }));
        } else {
            list = (await Product.find({}).lean()).map(serialize).map(normalizeProduct);
        }

      if (category && category !== 'All') {
              list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

            if (onlineOnly) {
                  list = list.filter(p => p.online !== false);
            }

      if (crop && crop !== 'all' && crop !== 'All Crops') {
              list = list.filter(p => p.crops && p.crops.some(c => c.toLowerCase().includes(crop.toLowerCase())));
      }

      if (disease && disease !== 'all') {
              list = list.filter(p => p.diseases && p.diseases.some(d => d.toLowerCase().includes(disease.toLowerCase())));
      }

      if (search) {
              const q = search.toLowerCase().trim();
              list = list.filter(
                        p =>
                                    p.name.toLowerCase().includes(q) ||
                                    p.description?.toLowerCase().includes(q) ||
                                    p.activeIngredient?.toLowerCase().includes(q) ||
                                    p.category.toLowerCase().includes(q) ||
                                    p.targetUserName?.toLowerCase().includes(q)
                      );
      }

      if (userId) {
              const targetUser = await this.getUserById(userId);
              list.sort((a, b) => {
                        const aTarget = a.targetUserId === userId ? 1 : 0;
                        const bTarget = b.targetUserId === userId ? 1 : 0;
                        if (aTarget !== bTarget) return bTarget - aTarget;

                                if (targetUser && targetUser.crop && targetUser.crop !== 'All Crops') {
                                            const userCrop = targetUser.crop.toLowerCase();
                                            const aCropMatch = a.crops?.some(
                                                          c => userCrop.includes(c.toLowerCase()) || c.toLowerCase().includes(userCrop)
                                                        )
                                              ? 1
                                                          : 0;
                                            const bCropMatch = b.crops?.some(
                                                          c => userCrop.includes(c.toLowerCase()) || c.toLowerCase().includes(userCrop)
                                                        )
                                              ? 1
                                                          : 0;
                                            if (aCropMatch !== bCropMatch) return bCropMatch - aCropMatch;
                                }

                                return (a.sortOrder || 99) - (b.sortOrder || 99);
              });
      } else if (sortBy === 'user') {
              list.sort((a, b) => {
                        const aIsUser = a.targetUserId && a.targetUserId !== 'all' ? 1 : 0;
                        const bIsUser = b.targetUserId && b.targetUserId !== 'all' ? 1 : 0;
                        if (aIsUser !== bIsUser) return bIsUser - aIsUser;
                        return (a.targetUserName || '').localeCompare(b.targetUserName || '');
              });
      } else if (sortBy === 'price_asc') {
              list.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price_desc') {
              list.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'stock') {
              list.sort((a, b) => b.stock - a.stock);
      } else {
              list.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
      }

      return list;
  }

  async getProductById(id) {
        if (!id) return null;
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const p = (store.products || []).find(p => p.id === String(id) || p._id === String(id));
            return p ? normalizeProduct({ ...p }) : null;
        }
        const p = await Product.findById(id).lean();
        if (!p) return null;
        return normalizeProduct(serialize(p));
  }

  async getCatalogOptions() {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            return store.catalogOptions || DEFAULT_CATALOG_OPTIONS;
        }
        const settings = await Settings.findById('global').lean();
        return (settings && settings.catalogOptions) || DEFAULT_CATALOG_OPTIONS;
  }

  async registerCatalogOptions({ categories = [], crops = [], storageBatches = [] } = {}) {
        await connectDB();
        const current = await this.getCatalogOptions();
        const merge = (base, additions) => [
                ...new Set([...base, ...additions].map(value => String(value).trim()).filter(Boolean))
              ];
        const updated = {
                categories: merge(current.categories, categories),
                crops: merge(current.crops, crops),
                storageBatches: merge(current.storageBatches, storageBatches)
        };
        if (usingLocalFallback()) {
            const store = getLocalStore();
            store.catalogOptions = updated;
            persistLocalStore();
            return updated;
        }
        await Settings.findByIdAndUpdate('global', { $set: { catalogOptions: updated } }, { upsert: true });
        return updated;
  }

  async createProduct(prodData) {
        await connectDB();
        const id = newId('sb');

      let targetUserName = 'All Users (General Catalog)';
        if (prodData.targetUserId && prodData.targetUserId !== 'all') {
                const targetUser = await this.getUserById(prodData.targetUserId);
                if (targetUser) {
                          targetUserName = `${targetUser.name} (${targetUser.crop || targetUser.role})`;
                }
        }

      const price = Number(prodData.price) || 0;
        const mrp = Number(prodData.originalPrice || prodData.mrp || price * 1.2);
        const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const newProd = {
              _id: id,
              id,
              name: prodData.name || 'New Bio Product',
              tagline: prodData.tagline || `${prodData.category || 'Agro'} Solution for High Yield`,
              category: prodData.category || 'Bio-Pesticide',
              price,
              originalPrice: mrp,
              discount: prodData.discount || `${discountPct}% OFF`,
              stock: Number(prodData.stock) || 0,
              crops: Array.isArray(prodData.crops)
                ? prodData.crops
                        : typeof prodData.crops === 'string'
                ? prodData.crops.split(',').map(s => s.trim())
                        : ['All Crops'],
              diseases: Array.isArray(prodData.diseases)
                ? prodData.diseases
                        : typeof prodData.diseases === 'string'
                ? prodData.diseases.split(',').map(s => s.trim())
                        : [],
              activeIngredient: prodData.activeIngredient || '100% Bio-Active Botanical Extract',
              dosage: prodData.dosage || '250g - 500g per Acre',
              packSizes:
                        Array.isArray(prodData.packSizes) && prodData.packSizes.length
                  ? prodData.packSizes
                          : ['250g', '500g', '1kg'],
              selectedPack: prodData.selectedPack || '500g',
              badge: prodData.badge || (prodData.stock > 100 ? 'Best Seller' : 'New Launch'),
              images:
                        Array.isArray(prodData.images) && prodData.images.length
                  ? prodData.images
                          : prodData.image
                  ? [prodData.image]
                          : [],
              image: prodData.image || prodData.images?.[0] || './assets/p1.png',
              howToUse: prodData.howToUse || '',
              whenToUse: prodData.whenToUse || '',
              relatedBlogs: Array.isArray(prodData.relatedBlogs) ? prodData.relatedBlogs : [],
              taggedBlogs: Array.isArray(prodData.taggedBlogs) ? prodData.taggedBlogs : [],
              taggedVideos: Array.isArray(prodData.taggedVideos) ? prodData.taggedVideos : [],
              relatedProductIds: Array.isArray(prodData.relatedProductIds) ? prodData.relatedProductIds : [],
              reviewsEnabled: prodData.reviewsEnabled === true,
              reviews: Array.isArray(prodData.reviews) ? prodData.reviews : [],
              rating: null,
              reviewsCount: 0,
              description: prodData.description || 'High-performance bio-crop protection product.',
              detailedDescription:
                        prodData.detailedDescription ||
                        prodData.description ||
                        'Scientifically formulated for modern organic and integrated pest management.',
              targetUserId: prodData.targetUserId || 'all',
              online: prodData.online !== false,
              targetUserName,
              sortOrder: Number(prodData.sortOrder) || 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
      };

      await this.registerCatalogOptions({
              categories: [newProd.category],
              crops: newProd.crops,
              storageBatches: newProd.packSizes
      });

      if (usingLocalFallback()) {
            const store = getLocalStore();
            store.products = store.products || [];
            store.products.push({ ...newProd });
            persistLocalStore();
            return normalizeProduct({ ...newProd });
      }

      const created = await Product.create(newProd);
        return serialize(created.toObject());
  }

  async updateProduct(id, updates) {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const idx = (store.products || []).findIndex(p => p.id === String(id) || p._id === String(id));
            if (idx === -1) return null;
            const existing = store.products[idx];
            let targetUserName = existing.targetUserName;
            if (updates.targetUserId) {
                targetUserName = updates.targetUserId === 'all'
                    ? 'All Users (General Catalog)'
                    : updates.targetUserId;
            }
            const price = updates.price !== undefined ? Number(updates.price) : existing.price;
            const mrp = updates.originalPrice !== undefined ? Number(updates.originalPrice) : existing.originalPrice;
            const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
            const merged = {
                ...existing, ...updates, targetUserName, price, originalPrice: mrp,
                discount: updates.discount || `${discountPct}% OFF`,
                stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
                crops: updates.crops ? (Array.isArray(updates.crops) ? updates.crops : updates.crops.split(',').map(s => s.trim())) : existing.crops,
                images: updates.images ? (Array.isArray(updates.images) ? updates.images : updates.images.split(',').map(s => s.trim())) : existing.images,
                image: updates.images?.[0] || updates.image || existing.image,
                updatedAt: new Date().toISOString()
            };
            store.products[idx] = merged;
            persistLocalStore();
            await this.registerCatalogOptions({ categories: [merged.category], crops: merged.crops, storageBatches: merged.packSizes });
            return normalizeProduct({ ...merged });
        }
        const existingDoc = await Product.findById(id).lean();
        if (!existingDoc) return null;
        const existing = serialize(existingDoc);

      let targetUserName = existing.targetUserName;
        if (updates.targetUserId) {
                if (updates.targetUserId === 'all') {
                          targetUserName = 'All Users (General Catalog)';
                } else {
                          const targetUser = await this.getUserById(updates.targetUserId);
                          targetUserName = targetUser ? `${targetUser.name} (${targetUser.crop || targetUser.role})` : updates.targetUserId;
                }
        }

      const price = updates.price !== undefined ? Number(updates.price) : existing.price;
        const mrp =
                updates.originalPrice !== undefined || updates.mrp !== undefined
            ? Number(updates.originalPrice || updates.mrp)
                  : existing.originalPrice;
        const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const merged = {
              ...existing,
              ...updates,
              targetUserName,
              price,
              originalPrice: mrp,
              discount: updates.discount || `${discountPct}% OFF`,
              stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
              crops: updates.crops
                ? Array.isArray(updates.crops)
                          ? updates.crops
                          : updates.crops.split(',').map(s => s.trim())
                        : existing.crops,
              images: updates.images
                ? Array.isArray(updates.images)
                          ? updates.images
                          : updates.images.split(',').map(s => s.trim())
                        : existing.images,
              image: updates.images?.[0] || updates.image || existing.image,
              howToUse: updates.howToUse !== undefined ? updates.howToUse : existing.howToUse,
              whenToUse: updates.whenToUse !== undefined ? updates.whenToUse : existing.whenToUse,
              relatedBlogs: updates.relatedBlogs !== undefined ? updates.relatedBlogs : existing.relatedBlogs,
              taggedBlogs: updates.taggedBlogs !== undefined ? (Array.isArray(updates.taggedBlogs) ? updates.taggedBlogs : []) : (existing.taggedBlogs || []),
              taggedVideos: updates.taggedVideos !== undefined ? (Array.isArray(updates.taggedVideos) ? updates.taggedVideos : []) : (existing.taggedVideos || []),
              relatedProductIds:
                        updates.relatedProductIds !== undefined ? updates.relatedProductIds : existing.relatedProductIds,
              reviewsEnabled:
                        updates.reviewsEnabled !== undefined ? updates.reviewsEnabled === true : existing.reviewsEnabled,
              rating: null,
              reviewsCount: Array.isArray(existing.reviews) ? existing.reviews.length : 0,
              updatedAt: new Date().toISOString()
      };

      await Product.findByIdAndUpdate(id, { $set: merged }, { strict: false });

      await this.registerCatalogOptions({
              categories: [merged.category],
              crops: merged.crops,
              storageBatches: merged.packSizes
      });

      return merged;
  }

  async deleteProduct(id) {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const before = (store.products || []).length;
            store.products = (store.products || []).filter(p => p.id !== String(id) && p._id !== String(id));
            persistLocalStore();
            return store.products.length < before;
        }
        const res = await Product.deleteOne({ _id: id });
        return res.deletedCount > 0;
  }

  async getUserProductSummary() {
        await connectDB();
        const users = (await User.find({}).lean()).map(serialize);
        const products = (await Product.find({}).lean()).map(serialize);

      return users.map(u => {
              const assignedProducts = products.filter(p => p.targetUserId === u.id);
              const matchingCropProducts = products.filter(
                        p => u.crop && p.crops && p.crops.some(c => u.crop.toLowerCase().includes(c.toLowerCase()))
                      );
              return {
                        userId: u.id,
                        userName: u.name,
                        role: u.role,
                        crop: u.crop,
                        acreage: u.acreage,
                        village: u.village,
                        assignedCount: assignedProducts.length,
                        assignedProducts: assignedProducts.map(p => ({ id: p.id, name: p.name, price: p.price })),
                        cropMatchCount: matchingCropProducts.length
              };
      });
  }

  // ================= ORDERS TABLE =================

  async getOrders() {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const orders = (store.orders || []).map(o => ({ ...o }));
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return orders;
        }
        const orders = (await Order.find({}).lean()).map(serialize);
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return orders;
  }

  async getOrderById(id) {
        if (!id) return null;
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const order = (store.orders || []).find(o => o.id === String(id) || o._id === String(id));
            return order ? { ...order } : null;
        }
        const order = await Order.findById(String(id)).lean();
        return order ? serialize(order) : null;
  }

  async getOrderByRazorpayId(razorpayOrderId) {
        if (!razorpayOrderId) return null;
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const order = (store.orders || []).find(o => o.razorpayOrderId === String(razorpayOrderId));
            return order ? { ...order } : null;
        }
        const order = await Order.findOne({ razorpayOrderId: String(razorpayOrderId) }).lean();
        return order ? serialize(order) : null;
  }

  // A customer's orders: those placed from their account, plus any placed as a
  // guest with their verified mobile number.
  async getOrdersForCustomer(user) {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const orders = (store.orders || []).filter(o => o.userId === user.id || (user.phone && o.customerPhone === user.phone));
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return orders;
        }
        const match = [{ userId: user.id }];
        if (user.phone) match.push({ customerPhone: user.phone });
        const orders = (await Order.find({ $or: match }).lean()).map(serialize);
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return orders;
  }

  async getProductsByIds(ids) {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            const set = new Set((ids || []).map(String));
            return (store.products || []).filter(p => set.has(String(p.id)) || set.has(String(p._id))).map(p => normalizeProduct({ ...p }));
        }
        const unique = [...new Set((ids || []).map(String))];
        return (await Product.find({ _id: { $in: unique } }).lean()).map(serialize).map(normalizeProduct);
  }
    // Takes stock for every line or for none: if one line cannot be covered, the
  // lines already taken are put back. Returns the id of the product that ran out.
  async reserveStock(lines) {
        await connectDB();
        if (usingLocalFallback()) return { ok: true };
        const taken = [];
        for (const line of lines) {
            const result = await Product.updateOne(
                { _id: line.id, stock: { $gte: line.qty } },
                { $inc: { stock: -line.qty }, $set: { updatedAt: new Date().toISOString() } }
            );
            if (!result.modifiedCount) {
                await this.releaseStock(taken);
                return { ok: false, productId: line.id };
            }
            taken.push(line);
        }
        return { ok: true };
  }

  async releaseStock(lines) {
        await connectDB();
        if (usingLocalFallback()) return;
        for (const line of lines) {
            await Product.updateOne({ _id: line.id }, { $inc: { stock: line.qty } });
        }
  }

  // ---- CART (one document per user, _id = userId) ----

  async getCart(userId) {
        if (!userId) return [];
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            return store.cart?.[userId] || [];
        }
        const doc = await Cart.findById(String(userId)).lean();
        return Array.isArray(doc?.items) ? doc.items : [];
  }

  async saveCart(userId, items) {
        if (!userId) return [];
        await connectDB();
        const safeItems = Array.isArray(items) ? items : [];
        if (usingLocalFallback()) {
            const store = getLocalStore();
            store.cart = store.cart || {};
            store.cart[userId] = safeItems;
                  persistLocalStore();
            return safeItems;
        }
        await Cart.findByIdAndUpdate(
            String(userId),
            { items: safeItems, updatedAt: new Date().toISOString() },
            { upsert: true }
        );
        return safeItems;
  }

  async createOrder(orderData) {
        await connectDB();
        const id = newId('SB-ORD');
        const newOrder = {
                _id: id,
                id,
                userId: orderData.userId || 'USR-WALKIN',
                customerName: orderData.customerName || 'Farmer Customer',
                customerPhone: orderData.customerPhone || '9876543210',
                address: orderData.address || 'Farm Delivery Address',
                addressDetails: orderData.addressDetails || {},
                district: orderData.district || 'Coimbatore',
                state: orderData.state || 'Tamil Nadu',
                items: orderData.items || [],
                subtotal: Number(orderData.subtotal) || 0,
                gst: Number(orderData.gst) || 0,
                total: Number(orderData.total) || 0,
                paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
                paymentStatus: orderData.paymentStatus || 'Pending',
                paymentId: orderData.paymentId || null,
                razorpayOrderId: orderData.razorpayOrderId || null,
                stockShortfall: orderData.stockShortfall === true,
                deliveryStatus: orderData.deliveryStatus || 'Confirmed',
                expectedDeliveryDate: orderData.expectedDeliveryDate || null,
                assignedDeliveryBoy: orderData.assignedDeliveryBoy || 'Karthik Raja',
                deliveryBoyPhone: orderData.deliveryBoyPhone || '9345678901',
                otp: crypto.randomInt(1000, 10000).toString(),
                createdAt: new Date().toISOString()
        };

        if (usingLocalFallback()) {
            const store = getLocalStore();
            store.orders = store.orders || [];
            store.orders.unshift(newOrder);
            persistLocalStore();
            return { ...newOrder };
        }

        const created = await Order.create(newOrder);
        return serialize(created.toObject());
  }

      async createInvoice(invoiceData) {
            await connectDB();
            const id = invoiceData.id || newId('INV');
            const record = { _id: id, id, ...invoiceData };
            if (usingLocalFallback()) {
                  const store = getLocalStore();
                  store.invoices = store.invoices || [];
                  store.invoices.unshift(record);
                  persistLocalStore();
                  return { ...record };
            }
            const created = await Invoice.create(record);
            return serialize(created.toObject());
      }

      async getInvoices() {
            await connectDB();
            if (usingLocalFallback()) {
                  return (getLocalStore().invoices || []).map(invoice => ({ ...invoice }));
            }
            const invoices = await Invoice.find({}).sort({ date: -1 }).lean();
            return invoices.map(serialize);
      }

  // Atomically marks an order notification as being sent, so concurrent callers
  // (checkout callback and webhook) can never both send it. A send stuck for 5
  // minutes (e.g. the function was killed) may be claimed again.
  async claimOrderNotification(orderId, kind, { resend = false, maxAttempts = 3 } = {}) {
        await connectDB();
        const path = `notifications.${kind}`;
        const now = new Date();
        const staleBefore = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

        const filter = {
            _id: String(orderId),
            $or: [{ [`${path}.status`]: { $ne: 'sending' } }, { [`${path}.attemptedAt`]: { $lt: staleBefore } }]
        };
        if (!resend) {
            filter[`${path}.status`] = { $ne: 'sent' };
            filter[`${path}.attempts`] = { $not: { $gte: maxAttempts } };
        }

        const result = await Order.updateOne(filter, {
            $set: { [`${path}.status`]: 'sending', [`${path}.attemptedAt`]: now.toISOString() },
            $inc: { [`${path}.attempts`]: 1 }
        });
        return result.modifiedCount === 1;
  }

  async recordOrderNotification(orderId, kind, status, error = '') {
        await connectDB();
        const path = `notifications.${kind}`;
        const now = new Date().toISOString();
        const set = {
            [`${path}.status`]: status,
            [`${path}.updatedAt`]: now,
            [`${path}.error`]: status === 'failed' ? String(error).slice(0, 200) : ''
        };
        if (status === 'sent') set[`${path}.sentAt`] = now;
        await Order.updateOne({ _id: String(orderId) }, { $set: set });
  }

  async updateOrder(id, updates) {
        await connectDB();
        const order = await Order.findById(id);
        if (!order) return null;

      order.set(updates);
        await order.save();
        return serialize(order.toObject());
  }

  // ================= CMS & ADVISORY =================

  async getCMS() {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            return store.cms || INITIAL_CMS;
        }
        const settings = await Settings.findById('global').lean();
        return (settings && settings.cms) || {};
  }

  async updateCMS(updates) {
        await connectDB();
        const current = await this.getCMS();
        const merged = { ...current, ...updates };
        await Settings.findByIdAndUpdate('global', { $set: { cms: merged } }, { upsert: true });
        return merged;
  }

  async getAdvisorySubscribers() {
        await connectDB();
        if (usingLocalFallback()) {
            const store = getLocalStore();
            return store.advisorySubscribers || [];
        }
        const subs = (await AdvisorySubscriber.find({}).lean()).map(serialize);
        subs.sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt));
        return subs;
  }

  async addAdvisorySubscriber(sub) {
        await connectDB();
        const doc = { ...sub, _id: sub.id };
        const created = await AdvisorySubscriber.create(doc);
        return serialize(created.toObject());
  }

  async getWishlists() {
        await connectDB();
        if (usingLocalFallback()) {
            return (getLocalStore().wishlists || []).map(item => ({ ...item }));
        }
        const items = await WishlistItem.find({}).lean();
        return items.map(serialize);
  }

  async setWishlistItem(item) {
        await connectDB();
        const key = item.userId || item.phone || `visitor-${Date.now()}`;
        const productId = String(item.productId || '');
        if (!productId) return this.getWishlists();
        const id = `${key}::${productId}`;

            if (usingLocalFallback()) {
                  const store = getLocalStore();
                  store.wishlists = store.wishlists || [];
                  const index = store.wishlists.findIndex(saved => saved.id === id || saved._id === id);
                  if (item.saved) {
                        const saved = {
                              id,
                              _id: id,
                              key,
                              userId: item.userId || '',
                              phone: item.phone || '',
                              productId,
                              productName: item.productName || '',
                              updatedAt: new Date().toISOString()
                        };
                        if (index >= 0) store.wishlists[index] = saved;
                        else store.wishlists.push(saved);
                  } else if (index >= 0) {
                        store.wishlists.splice(index, 1);
                  }
                  persistLocalStore();
                  return this.getWishlists();
            }

        if (item.saved) {
            await WishlistItem.findByIdAndUpdate(
                id,
                {
                    key,
                    userId: item.userId || '',
                    phone: item.phone || '',
                    productId,
                    productName: item.productName || '',
                    updatedAt: new Date().toISOString()
                },
                { upsert: true }
            );
        } else {
            await WishlistItem.findByIdAndDelete(id);
        }

        return this.getWishlists();
  }

  async getInventory() {
        await connectDB();
            if (usingLocalFallback()) {
                  return (getLocalStore().inventory || []).map(item => ({ ...item }));
            }
        const items = await InventoryItem.find({}).lean();
        return items.map(serialize);
  }

  async getStaffTasks() {
        await connectDB();
            if (usingLocalFallback()) {
                  return (getLocalStore().staffTasks || []).map(item => ({ ...item }));
            }
        const tasks = await StaffTask.find({}).lean();
        return tasks.map(serialize);
  }

  async getTickets() {
        await connectDB();
            if (usingLocalFallback()) {
                  const tickets = (getLocalStore().tickets || []).map(item => ({ ...item }));
                  tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                  return tickets;
            }
        const tickets = (await Ticket.find({}).lean()).map(serialize);
        tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return tickets;
  }

  async addTicket(ticket) {
        await connectDB();
        const doc = { ...ticket, _id: ticket.id };
        const created = await Ticket.create(doc);
        return serialize(created.toObject());
  }

  async getChatRecords() {
        await connectDB();
        const records = await ChatRecord.find({}).lean();
        return records.map(stripMongoFields);
  }

  async getWishlistForOwner(ownerId) {
        if (!ownerId) return [];
        await connectDB();
            if (usingLocalFallback()) {
                  return (getLocalStore().wishlists || [])
                        .filter(item => item.key === ownerId || item.userId === ownerId)
                        .map(item => ({ ...item }));
            }
        const items = await WishlistItem.find({ $or: [{ key: ownerId }, { userId: ownerId }] }).lean();
        return items.map(serialize);
  }

  // ================= ADMIN DASHBOARD =================

  async getAdminStats() {
        await connectDB();
        // "Today" is the business day in India (UTC+5:30), not the server's UTC day.
        const IST_OFFSET_MS = 330 * 60 * 1000;
        const DAY_MS = 24 * 60 * 60 * 1000;
        const dayStartIso = new Date(Math.floor((Date.now() + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS).toISOString();

        if (usingLocalFallback()) {
            const store = getLocalStore();
            const orders = store.orders || [];
            const paid = orders.filter(o => o.paymentStatus === 'Paid');
            return {
                totalRevenue: Math.round(paid.reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 100) / 100,
                paidOrders: paid.length,
                totalOrders: orders.length,
                ordersToday: orders.filter(o => String(o.createdAt || '') >= dayStartIso).length,
                totalProducts: store.products?.length || 0,
                activeProducts: store.products?.filter(p => (Number(p.stock) || 0) > 0).length || 0,
                subscribers: store.advisorySubscribers?.length || 0,
                openTickets: store.tickets?.filter(t => !['Closed', 'Resolved'].includes(t.status)).length || 0,
                wishlistSaves: store.wishlists?.length || 0,
                pendingDeliveries: orders.filter(o => !['Delivered', 'Cancelled'].includes(o.deliveryStatus)).length
            };
        }

        const [orders, totalProducts, activeProducts, subscribers, openTickets, wishlistSaves] = await Promise.all([
            Order.find({}, { total: 1, paymentStatus: 1, deliveryStatus: 1, createdAt: 1 }).lean(),
            Product.countDocuments({}),
            Product.countDocuments({ stock: { $gt: 0 } }),
            AdvisorySubscriber.countDocuments({}),
            Ticket.countDocuments({ status: { $nin: ['Closed', 'Resolved'] } }),
            WishlistItem.countDocuments({})
        ]);

        const paid = orders.filter(o => o.paymentStatus === 'Paid');
        return {
            totalRevenue: Math.round(paid.reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 100) / 100,
            paidOrders: paid.length,
            totalOrders: orders.length,
            ordersToday: orders.filter(o => String(o.createdAt || '') >= dayStartIso).length,
            totalProducts,
            activeProducts,
            subscribers,
            openTickets,
            wishlistSaves,
            pendingDeliveries: orders.filter(o => !['Delivered', 'Cancelled'].includes(o.deliveryStatus)).length
        };
  }

  // ================= EPHEMERAL STATE =================

  async kvGet(key) {
        await connectDB();
            if (usingLocalFallback()) {
                  const entry = localEphemeral.get(key);
                  if (!entry || entry.purgeAt <= Date.now()) {
                        localEphemeral.delete(key);
                        return null;
                  }
                  return entry.value;
            }
        const doc = await Ephemeral.findById(key).lean();
        // MongoDB's TTL sweep only runs about once a minute, so check expiry here too.
        return doc && doc.purgeAt > new Date() ? doc.value : null;
  }

  async kvSet(key, value, ttlMs) {
        await connectDB();
            if (usingLocalFallback()) {
                  localEphemeral.set(key, { value, purgeAt: Date.now() + ttlMs });
                  return value;
            }
        await Ephemeral.replaceOne(
            { _id: key },
            { _id: key, value, purgeAt: new Date(Date.now() + ttlMs) },
            { upsert: true }
        );
        return value;
  }

  async kvDelete(key) {
        await connectDB();
            if (usingLocalFallback()) {
                  localEphemeral.delete(key);
                  return;
            }
        await Ephemeral.deleteOne({ _id: key });
  }

  // Atomically adds 1 to a numeric field inside the value. With upsert (the
  // default) a missing record is created; otherwise a missing record returns 0.
  async kvIncrement(key, field, ttlMs, { upsert = true } = {}) {
        await connectDB();
            if (usingLocalFallback()) {
                  const current = await this.kvGet(key);
                  if (!current && !upsert) return 0;
                  const value = current || {};
                  value[field] = Number(value[field] || 0) + 1;
                  await this.kvSet(key, value, ttlMs);
                  return value[field];
            }
        const doc = await Ephemeral.findOneAndUpdate(
            upsert ? { _id: key } : { _id: key, purgeAt: { $gt: new Date() } },
            { $inc: { [`value.${field}`]: 1 }, $setOnInsert: { purgeAt: new Date(Date.now() + ttlMs) } },
            { upsert, returnDocument: 'after', lean: true }
        );
        return Number(doc?.value?.[field]) || 0;
  }

  // Moves a record to a new status only if it is still in the expected one, so
  // two concurrent requests can never both claim it.
  async kvTransition(key, fromStatus, toStatus, extra = {}) {
        await connectDB();
        const set = { 'value.status': toStatus };
        for (const [field, value] of Object.entries(extra)) set[`value.${field}`] = value;
        const doc = await Ephemeral.findOneAndUpdate(
            { _id: key, purgeAt: { $gt: new Date() }, 'value.status': fromStatus },
            { $set: set },
            { returnDocument: 'after', lean: true }
        );
        return doc ? doc.value : null;
  }

  // ================= BLOGS TABLE =================
  async getBlogs(filters = {}) {
    await connectDB();
    if (usingLocalFallback()) {
      const store = getLocalStore();
      let list = (store.blogs || []).map(b => ({ ...b }));
      if (filters.publishedOnly) list = list.filter(b => b.published !== false);
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return list;
    }
    let query = {};
    if (filters.publishedOnly) {
      query.published = true;
    }
    let list = (await Blog.find(query).lean()).map(serialize);
    if (filters.category && filters.category !== 'All') {
      list = list.filter(b => b.category?.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.tag) {
      list = list.filter(b => b.tags && Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase() === filters.tag.toLowerCase()));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.summary?.toLowerCase().includes(q) ||
        b.content?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }

  async getBlogById(id) {
    if (!id) return null;
    await connectDB();
    const blog = await Blog.findById(id).lean();
    if (!blog) return null;
    return serialize(blog);
  }

  async createBlog(data) {
    await connectDB();
    const id = newId('blog');
    const newBlog = {
      _id: id,
      id,
      title: data.title || 'Untitled Blog',
      slug: (data.slug || data.title || id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      summary: data.summary || '',
      content: data.content || '',
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80',
      author: data.author || 'Sathya Bio Agronomy Team',
      category: data.category || 'Crop Advisory',
      tags: Array.isArray(data.tags) ? data.tags : typeof data.tags === 'string' ? data.tags.split(',').map(s => s.trim()).filter(Boolean) : ['Farming'],
      readTime: data.readTime || '3 min read',
      published: data.published !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const created = await Blog.create(newBlog);
    return serialize(created.toObject());
  }

  async updateBlog(id, updates) {
    await connectDB();
    const existing = await Blog.findById(id).lean();
    if (!existing) return null;
    const { _id, id: _i, ...rest } = updates;
    const merged = {
      ...existing,
      ...rest,
      tags: rest.tags !== undefined ? (Array.isArray(rest.tags) ? rest.tags : typeof rest.tags === 'string' ? rest.tags.split(',').map(s => s.trim()).filter(Boolean) : []) : existing.tags,
      updatedAt: new Date().toISOString()
    };
    await Blog.findByIdAndUpdate(id, { $set: merged });
    return serialize(merged);
  }

  async deleteBlog(id) {
    await connectDB();
    const res = await Blog.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  // ================= VIDEOS TABLE =================
  async getVideos(filters = {}) {
    await connectDB();
    if (usingLocalFallback()) {
      const store = getLocalStore();
      let list = (store.videos || []).map(v => ({ ...v }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return list;
    }
    let list = (await Video.find({}).lean()).map(serialize);
    if (filters.category && filters.category !== 'All') {
      list = list.filter(v => v.category?.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }

  async getVideoById(id) {
    if (!id) return null;
    await connectDB();
    const video = await Video.findById(id).lean();
    if (!video) return null;
    return serialize(video);
  }

  async createVideo(data) {
    await connectDB();
    const id = newId('vid');
    const newVideo = {
      _id: id,
      id,
      title: data.title || 'Untitled Video',
      description: data.description || '',
      videoUrl: data.videoUrl || '',
      thumbnail: data.thumbnail || '',
      category: data.category || 'Product Demo',
      tags: Array.isArray(data.tags) ? data.tags : typeof data.tags === 'string' ? data.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      duration: data.duration || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const created = await Video.create(newVideo);
    return serialize(created.toObject());
  }

  async updateVideo(id, updates) {
    await connectDB();
    const existing = await Video.findById(id).lean();
    if (!existing) return null;
    const { _id, id: _i, ...rest } = updates;
    const merged = {
      ...existing,
      ...rest,
      tags: rest.tags !== undefined ? (Array.isArray(rest.tags) ? rest.tags : typeof rest.tags === 'string' ? rest.tags.split(',').map(s => s.trim()).filter(Boolean) : []) : existing.tags,
      updatedAt: new Date().toISOString()
    };
    await Video.findByIdAndUpdate(id, { $set: merged });
    return serialize(merged);
  }

  async deleteVideo(id) {
    await connectDB();
    const res = await Video.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  // Clear legacy dummy products if any exist
  async clearDummyProducts() {
    await connectDB();
    if (usingLocalFallback()) return 0;
    const dummyIds = ['sb-01', 'sb-02', 'sb-03', 'sb-04', 'sb-05', 'sb-06', 'sb-26', 'sb-27', 'sb-28', 'sb-29', 'sb-30', 'sb-31', 'sb-32', 'sb-33', 'sb-34', 'sb-35', 'sb-6928'];
    const res = await Product.deleteMany({ _id: { $in: dummyIds } });
    return res.deletedCount || 0;
  }
}


// Export singleton database instance
export const db = new DatabaseManager();
export default db;
