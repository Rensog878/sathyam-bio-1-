/* Sathya Bio - E-Commerce Data Store & Product Catalog */

export const CROPS = [
  { id: 'all', name: 'All Crops', icon: 'fa-wheat-awn' },
  { id: 'Paddy/Rice', name: 'Paddy / Rice', icon: 'fa-seedling' },
  { id: 'Wheat', name: 'Wheat', icon: 'fa-wheat-awn' },
  { id: 'Cotton', name: 'Cotton', icon: 'fa-cloud' },
  { id: 'Tomato', name: 'Tomato', icon: 'fa-apple-whole' },
  { id: 'Corn', name: 'Corn / Maize', icon: 'fa-plant-wilt' },
  { id: 'Sugarcane', name: 'Sugarcane', icon: 'fa-cubes-stacked' },
  { id: 'Citrus', name: 'Citrus / Fruits', icon: 'fa-lemon' },
  { id: 'Grapes', name: 'Grapes', icon: 'fa-wine-glass-empty' },
  { id: 'Potato', name: 'Potato', icon: 'fa-circle-dot' }
];

export const DISEASES = [
  { id: 'all', name: 'All Diseases & Pests' },
  { id: 'Blast', name: 'Rice Blast & Sheath Blight' },
  { id: 'Blight', name: 'Early / Late Blight' },
  { id: 'Rust', name: 'Leaf Rust & Stripe Rust' },
  { id: 'Aphids', name: 'Aphids & Jassids' },
  { id: 'Whitefly', name: 'Whitefly & Thrips' },
  { id: 'Downy Mildew', name: 'Downy & Powdery Mildew' },
  { id: 'Caterpillars', name: 'Fruit Borer & Caterpillars' },
  { id: 'Stem Borer', name: 'Stem & Pink Borer' },
  { id: 'Weeds', name: 'Broadleaf & Grass Weeds' }
];

export const CATEGORIES = ['All', 'Fungicide', 'Insecticide', 'Bio-Stimulant', 'Herbicide', 'Nematicide'];

// Product image palettes (SVG-based colored icons as fallback + real images where available)
const IMG = {
  fungicide: './assets/p1.png',
  insecticide: './assets/p2.png',
  biostim: './assets/p3.png',
  herbicide: './assets/p4.png',
};

// Products are managed exclusively via admin panel
export const PESTICIDES = [];

export const INITIAL_TICKETS = [
  {
    id: 'TK-8942',
    subject: 'Leaf Yellowing & Stunting in Paddy Field',
    category: 'Field Advisory',
    crop: 'Paddy/Rice',
    severity: 'High',
    status: 'In Progress',
    date: '2026-08-25',
    assignedExpert: 'Dr. Ramesh Agronomist',
    messages: [
      { sender: 'Farmer', text: 'My 3-acre paddy field leaves are turning light yellow from tips after heavy rainfall.', time: '10:15 AM' },
      { sender: 'Sathya Bio Expert', text: 'Hello! This indicates possible Nitrogen leaching or early sheath blight. Please upload a clear leaf photo in the ticket attachment or use our AI Photo Scanner.', time: '10:42 AM' }
    ]
  },
  {
    id: 'TK-8710',
    subject: 'Dosage query for Sathya Bio BlastShield on Cotton',
    category: 'Product Dosage',
    crop: 'Cotton',
    severity: 'Medium',
    status: 'Resolved',
    date: '2026-08-22',
    assignedExpert: 'Kavitha S. (Pesticide Specialist)',
    messages: [
      { sender: 'Farmer', text: 'Can I mix BlastShield with RootVigor Gold in a single tank spray?', time: '02:00 PM' },
      { sender: 'Sathya Bio Expert', text: 'Yes, BlastShield WP and RootVigor Gold Liquid are fully tank-mix compatible. Maintain 150L water volume per acre.', time: '02:18 PM' }
    ]
  }
];

export const EXPERTS = [
  {
    id: 'exp-1',
    name: 'Dr. V. K. Sathyanarayana',
    title: 'Chief Agronomist & Soil Pathology Lead',
    experience: '22+ Years Exp',
    specialties: ['Soil Nutrient Balancing', 'Paddy & Wheat Diseases', 'Organic Bio-stimulants'],
    availability: 'Available Today',
    rating: '4.9 ★ (420+ Calls)',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&q=80'
  },
  {
    id: 'exp-2',
    name: 'Ananya Deshmukh',
    title: 'Senior Crop Protection Specialist',
    experience: '14+ Years Exp',
    specialties: ['Cotton Whitefly Control', 'Horticulture Pest Management', 'Residue Free Farming'],
    availability: 'Next Available: 2:30 PM',
    rating: '4.8 ★ (315+ Calls)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80'
  },
  {
    id: 'exp-3',
    name: 'Rajesh Kumar Verma',
    title: 'Field Diagnostics & N8N Automation Specialist',
    experience: '10+ Years Exp',
    specialties: ['Drip Fertigation', 'Drone Pesticide Spraying', 'N8N WhatsApp Advisory'],
    availability: 'Available Today',
    rating: '4.9 ★ (190+ Calls)',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&q=80'
  }
];

export const N8N_WORKFLOW_NODES = [
  { id: 1, name: 'WhatsApp Webhook (Twilio / Meta API)', type: 'trigger', status: 'Active', desc: 'Receives farmer incoming message & photo' },
  { id: 2, name: 'AI Disease & Symptom Parser (LLM)', type: 'action', status: 'Success', desc: 'Extracts crop type, disease symptoms & location' },
  { id: 3, name: 'Sathya Bio Catalog Lookup DB', type: 'search', status: 'Success', desc: 'Matches exact fungicide / insecticide remedy' },
  { id: 4, name: 'Automated WhatsApp Response Generator', type: 'response', status: 'Ready', desc: 'Sends instant dosage, video guide & order button' }
];

export const SAMPLE_DISEASE_DIAGNOSES = [
  {
    keyword: 'blight',
    diseaseName: 'Early / Late Blight (Alternaria / Phytophthora)',
    cropDetected: 'Tomato / Potato',
    confidence: '96.4%',
    symptoms: 'Dark brown concentric rings on lower leaves, stem lesions, and water-soaked spots during humid weather.',
    recommendedProduct: 'Sathya Bio BlightStop Pro (500g/acre)',
    productId: 'sb-03',
    preventiveTip: 'Avoid overhead sprinkler irrigation late in the evening and maintain 45cm row spacing.'
  },
  {
    keyword: 'blast',
    diseaseName: 'Paddy Rice Blast (Magnaporthe oryzae)',
    cropDetected: 'Paddy / Rice',
    confidence: '98.1%',
    symptoms: 'Diamond-shaped or spindle spots with greyish center and reddish-brown margins on leaf blades.',
    recommendedProduct: 'Sathya Bio BlastShield 75 WP (120g/acre)',
    productId: 'sb-01',
    preventiveTip: 'Apply standing water management and avoid excessive Nitrogen fertilization.'
  },
  {
    keyword: 'whitefly',
    diseaseName: 'Cotton Whitefly & Sooty Mold Complex',
    cropDetected: 'Cotton / Chilli',
    confidence: '94.8%',
    symptoms: 'Sticky honey-dew exudate on leaves, yellowing vector damage, curling leaves.',
    recommendedProduct: 'Sathya Bio FlyKill Ultra (250g/acre)',
    productId: 'sb-02',
    preventiveTip: 'Install yellow sticky traps (15 traps/acre) alongside foliar spray.'
  }
];
