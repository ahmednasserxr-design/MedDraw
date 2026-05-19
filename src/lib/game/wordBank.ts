export type WordCategory =
  | "biology"
  | "chemistry"
  | "physics"
  | "maths"
  | "medicine-academic"
  | "medicine-clinical"
  | "engineering-basic"
  | "engineering-advanced";

export type Difficulty = "easy" | "medium" | "hard";

export type CategoryMeta = {
  label: string;
  group: string;
  color: string;
};

export const CATEGORY_META: Record<WordCategory, CategoryMeta> = {
  biology:               { label: "Biology",               group: "School",       color: "emerald" },
  chemistry:             { label: "Chemistry",             group: "School",       color: "sky" },
  physics:               { label: "Physics",               group: "School",       color: "violet" },
  maths:                 { label: "Maths",                 group: "School",       color: "orange" },
  "medicine-academic":   { label: "Medicine — Academic",   group: "University",   color: "rose" },
  "medicine-clinical":   { label: "Medicine — Clinical",   group: "University",   color: "pink" },
  "engineering-basic":   { label: "Engineering — Basic",   group: "University",   color: "amber" },
  "engineering-advanced":{ label: "Engineering — Advanced",group: "University",   color: "indigo" },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: "Easy",   color: "emerald" },
  medium: { label: "Medium", color: "amber" },
  hard:   { label: "Hard",   color: "rose" },
};

// Every word in this bank should be drawable in 60-90s on a small canvas.
// Difficulty is by drawability, not by academic level:
//   easy   — single concrete object with a recognizable silhouette
//   medium — compound concept needing 2-3 elements or a labeled structure
//   hard   — abstract process, technical term, or detailed scene
export const CATEGORY_WORDS: Record<WordCategory, Record<Difficulty, readonly string[]>> = {
  biology: {
    easy: [
      "cell", "heart", "lung", "liver", "kidney", "brain", "stomach", "intestine",
      "spleen", "bladder", "muscle", "bone", "skin", "eye", "ear", "nose", "tongue",
      "blood", "leaf", "flower", "seed", "stem", "root", "bark", "tree", "grass",
      "fish", "bird", "snake", "frog", "spider", "ant", "bee", "butterfly", "egg",
      "feather", "fur", "scale", "wing", "fang", "claw", "horn", "tail", "fin",
      "shell", "web", "nest", "fruit", "mushroom", "moss", "fern", "tooth", "hair",
      "beak", "gill", "tentacle", "trunk", "hoof", "paw", "snout", "whisker",
      "eyebrow", "fingernail", "antler",
    ],
    medium: [
      "DNA", "RNA", "chromosome", "mitochondria", "ribosome", "vacuole",
      "cell wall", "cell membrane", "lysosome", "cytoplasm", "centriole",
      "antibody", "antigen", "hormone", "neuron", "synapse", "spinal cord",
      "red blood cell", "white blood cell", "platelet", "artery", "vein",
      "capillary", "lymph node", "reflex arc", "food chain", "ecosystem",
      "predator", "prey", "habitat", "pollen", "xylem", "phloem", "bacteria",
      "virus", "fungi", "algae", "insulin", "enzyme", "hemoglobin",
      "skeleton", "rib cage", "skull", "jaw", "spine", "joint", "tendon",
      "ligament", "blood vessel", "alveolus", "villus", "iris", "pupil",
      "retina", "eardrum", "vocal cord", "embryo", "sperm", "ovum",
      "umbilical cord", "placenta", "amoeba", "paramecium", "thorax", "abdomen",
      "diaphragm", "trachea", "esophagus", "larynx", "appendix", "thyroid",
      "tonsil", "gallbladder", "femur", "vertebra", "rib", "pelvis",
      "scapula", "clavicle", "cornea", "pancreas", "nerve", "tissue", "organ",
    ],
    hard: [
      "mitosis", "meiosis", "osmosis", "diffusion", "active transport",
      "cell cycle", "apoptosis", "telomere", "gene", "allele", "mutation",
      "genotype", "phenotype", "dominant", "recessive", "DNA replication",
      "transcription", "translation", "codon", "natural selection",
      "genetic drift", "evolution", "adaptation", "speciation",
      "photosynthesis", "respiration", "homeostasis", "peristalsis",
      "phagocytosis", "endocytosis", "Golgi apparatus", "endoplasmic reticulum",
      "biodiversity", "decomposer", "producer", "consumer", "transpiration",
      "bile", "amylase", "nervous system", "immune system",
      "metamorphosis", "hibernation", "pollination", "fertilization",
      "blood clot", "vaccination", "stem cell", "myelin sheath",
      "blood-brain barrier", "lymphatic system", "endocrine system",
      "circulatory system", "chromosome pair", "germination",
    ],
  },

  chemistry: {
    easy: [
      "atom", "molecule", "salt", "acid", "gas", "metal", "crystal",
      "test tube", "beaker", "flask", "pipette", "burette", "spatula",
      "crucible", "Bunsen burner", "litmus paper", "magnet", "balloon",
      "fire", "ice", "water", "smoke", "bubble", "ash", "rust", "drop",
      "candle", "match", "spoon", "stopwatch", "thermometer", "scale",
      "funnel", "filter paper", "tongs", "goggles", "lab coat", "gloves",
    ],
    medium: [
      "element", "compound", "mixture", "ion", "electron", "proton", "neutron",
      "nucleus", "isotope", "periodic table", "mole", "electron shell",
      "covalent bond", "ionic bond", "metallic bond", "hydrogen bond",
      "polymer", "alloy", "lattice", "pH", "catalyst", "reaction",
      "combustion", "oxidation", "reduction", "precipitation",
      "neutralization", "electrolysis", "distillation", "filtration",
      "chromatography", "titration", "hydrocarbon", "alkane", "alkene",
      "alcohol", "ester", "glucose", "starch", "cellulose", "fat", "oil",
      "solution", "solvent", "solute", "precipitate", "noble gas",
      "transition metal", "non-metal", "indicator", "amino acid",
      "peptide", "atomic number", "mass number", "evaporation",
      "condensation", "sublimation", "boiling", "freezing", "melting",
      "soap", "detergent", "battery", "fuel",
    ],
    hard: [
      "covalent bond", "displacement", "exothermic", "endothermic",
      "activation energy", "equilibrium", "carboxylic acid",
      "functional group", "hydrolysis", "fermentation", "concentration",
      "enthalpy", "entropy", "oxidizing agent", "reducing agent",
      "half equation", "rate of reaction", "redox", "buffer solution",
      "molar mass", "Avogadro's number", "ideal gas", "kinetic theory",
      "Le Chatelier's principle", "Markovnikov rule", "saponification",
      "stereochemistry", "tetrahedron", "benzene ring", "polymerization",
      "esterification", "saturation",
    ],
  },

  physics: {
    easy: [
      "magnet", "mirror", "lens", "prism", "spring", "pendulum", "battery",
      "bulb", "wire", "switch", "fan", "ramp", "wheel", "pulley", "lever",
      "see-saw", "kite", "parachute", "telescope", "microscope", "compass",
      "rainbow", "shadow", "ruler", "clock", "scale", "balloon", "rocket",
      "arrow", "ball", "spinning top", "yo-yo", "swing", "slide", "boat",
    ],
    medium: [
      "force", "gravity", "friction", "velocity", "acceleration", "momentum",
      "mass", "weight", "density", "pressure", "torque", "kinetic energy",
      "potential energy", "work", "power", "wave", "frequency", "amplitude",
      "wavelength", "sound", "light", "refraction", "reflection",
      "diffraction", "interference", "resonance", "standing wave",
      "spectrum", "current", "voltage", "resistance", "circuit",
      "parallel circuit", "series circuit", "transformer", "diode",
      "capacitor", "motor", "generator", "heat", "temperature", "conduction",
      "convection", "radiation", "thermal expansion", "photon", "electron",
      "oscillation", "half-life", "alpha particle", "beta particle",
      "gamma ray", "black hole", "neutron star", "satellite", "orbit",
      "eclipse", "magnetic field", "electric field", "free fall",
      "projectile", "centripetal force",
    ],
    hard: [
      "inertia", "Newton's laws", "Hooke's law", "terminal velocity",
      "polarization", "Doppler effect", "total internal reflection",
      "electromagnetic", "Ohm's law", "Faraday's law", "specific heat",
      "latent heat", "nuclear fission", "nuclear fusion",
      "radioactive decay", "binding energy", "photoelectric effect",
      "efficiency", "inductor", "entropy", "wave-particle duality",
      "Heisenberg uncertainty", "Schrodinger equation", "Coulomb's law",
      "Lenz's law", "Bernoulli principle", "Kepler's laws",
      "tension", "buoyancy", "stress", "strain", "moment of inertia",
      "simple harmonic motion", "standing wave node", "blackbody radiation",
    ],
  },

  maths: {
    easy: [
      "triangle", "circle", "square", "rectangle", "hexagon", "pentagon",
      "octagon", "cone", "cube", "sphere", "cylinder", "pyramid", "angle",
      "line", "dot", "arrow", "graph", "ruler", "protractor", "compass",
      "calculator", "abacus", "dice", "clock", "tape measure", "scales",
      "fraction", "decimal", "percentage", "right angle", "diameter",
      "radius", "axis", "origin", "grid", "tally", "infinity sign",
      "plus", "minus", "equals", "less than", "greater than",
    ],
    medium: [
      "parallel", "perpendicular", "symmetry", "tessellation", "coordinate",
      "transformation", "equation", "variable", "function", "parabola",
      "asymptote", "polynomial", "quadratic", "linear", "inequality",
      "ratio", "proportion", "exponent", "logarithm", "matrix", "vector",
      "prime number", "factor", "multiple", "integer", "sequence",
      "series", "binomial", "factorial", "tangent", "gradient",
      "probability", "mean", "median", "mode", "range", "histogram",
      "scatter graph", "pie chart", "bar chart", "frequency table",
      "sine", "cosine", "hypotenuse", "adjacent", "opposite", "pi",
      "radian", "volume", "area", "perimeter", "Venn diagram",
      "permutation", "combination", "reflection", "rotation", "translation",
      "scale factor", "midpoint", "bisector", "polygon", "diagonal",
      "vertex", "edge",
    ],
    hard: [
      "irrational number", "complex number", "determinant", "derivative",
      "integral", "differentiation", "integration", "limit",
      "area under curve", "standard deviation", "normal distribution",
      "hypothesis test", "correlation", "sine rule", "cosine rule",
      "Pythagoras", "proof by induction", "set theory",
      "simultaneous equations", "logarithm rules", "binomial expansion",
      "modular arithmetic", "vector cross product", "matrix inverse",
      "eigenvalue", "convergence", "divergence", "Taylor series",
      "Riemann sum", "Bayesian probability", "Markov chain", "topology",
      "fractal",
    ],
  },

  "medicine-academic": {
    easy: [
      "neuron", "synapse", "DNA", "RNA", "ATP", "antibody", "antigen",
      "platelet", "hemoglobin", "insulin", "alveolus", "nephron",
      "axon", "dendrite", "myelin", "B cell", "T cell", "mast cell",
      "leukocyte", "erythrocyte", "histamine", "receptor", "enzyme",
      "substrate", "ligand", "stem cell", "hepatocyte", "fibroblast",
    ],
    medium: [
      "chromosome", "mitochondria", "ribosome", "transcription",
      "translation", "codon", "cell cycle", "apoptosis", "telomere",
      "action potential", "cortisol", "adrenaline", "thyroid hormone",
      "growth hormone", "oxytocin", "melatonin", "dopamine", "serotonin",
      "acetylcholine", "noradrenaline", "hippocampus", "cerebellum",
      "cerebral cortex", "amygdala", "albumin", "fibrinogen",
      "sinoatrial node", "cardiac output", "stroke volume",
      "glomerulus", "renal tubule", "bronchiole", "surfactant",
      "tidal volume", "osteoblast", "osteoclast", "endothelium",
      "epithelium", "enterocyte", "blood-brain barrier",
      "lymph node", "spleen", "thymus", "appendix", "pituitary gland",
      "adrenal gland", "parathyroid hormone", "prolactin",
    ],
    hard: [
      "gluconeogenesis", "beta oxidation", "fatty acid synthesis",
      "cholesterol", "lipoprotein", "glucagon", "aldosterone",
      "antidiuretic hormone", "follicle stimulating hormone",
      "luteinizing hormone", "cytokine", "inflammation", "immunity",
      "phagocytosis", "complement", "natural killer cell", "interferon",
      "glycolysis", "Krebs cycle", "electron transport chain",
      "preload", "afterload", "osmolarity", "pH buffer",
      "hemostasis", "coagulation cascade", "angiogenesis",
      "epigenetics", "gene expression", "signal transduction",
      "membrane potential", "depolarization", "repolarization",
      "saltatory conduction", "neurotransmitter release",
      "renin-angiotensin", "countercurrent multiplier",
      "acid-base balance", "oxygen dissociation curve",
      "cardiac conduction", "starling curve",
    ],
  },

  "medicine-clinical": {
    easy: [
      "X-ray", "stethoscope", "syringe", "bandage", "thermometer",
      "wheelchair", "crutch", "cast", "scalpel", "tweezers", "scissors",
      "pill", "tablet", "capsule", "tooth", "needle", "splint", "sling",
      "eye patch", "hospital bed", "ambulance", "first aid kit",
      "stretcher", "mask", "gloves", "gown", "IV bag", "blood bag",
      "tongue depressor", "cotton swab", "vial", "ointment", "spray",
      "drops", "ice pack", "heating pad", "walking stick",
    ],
    medium: [
      "CT scan", "MRI", "ultrasound", "ECG", "echocardiogram",
      "blood test", "biopsy", "lumbar puncture", "spirometry",
      "endoscope", "colonoscopy", "bronchoscopy", "cystoscopy",
      "peak flow", "angiogram", "suture", "catheter", "laparoscope",
      "ventilator", "defibrillator", "pacemaker", "cannula",
      "blood pressure cuff", "pulse oximeter", "nasogastric tube",
      "chest drain", "tracheostomy", "intubation", "tourniquet",
      "jaundice", "cyanosis", "edema", "clubbing", "pallor", "fever",
      "rash", "wheeze", "murmur", "heart attack", "heart failure",
      "angina", "arrhythmia", "stroke", "DVT", "pneumonia", "asthma",
      "tuberculosis", "pneumothorax", "appendicitis", "pancreatitis",
      "cholecystitis", "diabetes", "hypothyroidism", "hyperthyroidism",
      "meningitis", "migraine", "fracture", "infection", "anemia",
      "vaccination", "prescription", "diagnosis", "triage",
      "CPR", "tumor", "transplant", "chemotherapy", "radiotherapy",
    ],
    hard: [
      "bone marrow biopsy", "tachycardia", "bradycardia", "hypertension",
      "hypotension", "crepitations", "atrial fibrillation",
      "aortic dissection", "pulmonary embolism",
      "transient ischemic attack", "COPD", "pleural effusion",
      "respiratory failure", "peritonitis", "liver failure", "cirrhosis",
      "Crohn's disease", "colitis", "diabetic ketoacidosis",
      "Addison's disease", "Cushing's syndrome", "Parkinson disease",
      "Alzheimer disease", "epilepsy", "depression", "schizophrenia",
      "sepsis", "renal failure", "ICU", "anaphylaxis", "endocarditis",
      "thrombosis", "ischemia", "necrosis", "metastasis", "biopsy result",
      "differential diagnosis", "prognosis", "informed consent",
      "palliative care", "post-operative care",
    ],
  },

  "engineering-basic": {
    easy: [
      "gear", "lever", "pulley", "screw", "spring", "bearing", "wheel",
      "axle", "chain", "belt", "nut", "bolt", "washer", "nail", "hammer",
      "screwdriver", "wrench", "saw", "drill", "pliers", "ruler", "tape",
      "pipe", "valve", "pump", "tank", "barrel", "bucket", "ladder",
      "rope", "magnet", "wire", "cable", "plug", "socket", "bulb",
      "switch", "battery", "fan", "motor", "antenna", "satellite dish",
    ],
    medium: [
      "circuit", "resistor", "capacitor", "transistor", "diode", "LED",
      "oscilloscope", "multimeter", "breadboard", "PCB", "fuse", "relay",
      "logic gate", "AND gate", "OR gate", "NOT gate", "flip flop",
      "binary", "microcontroller", "shaft", "coupling", "brake", "clutch",
      "generator", "torque", "stress", "strain", "elasticity",
      "welding", "lathe", "beam", "column", "truss", "bridge",
      "concrete", "steel", "foundation", "arch", "cantilever",
      "shear force", "bending moment", "heat transfer", "thermodynamics",
      "turbine", "compressor", "hydraulics", "pneumatics", "algorithm",
      "variable", "loop", "function", "array", "stack", "queue",
      "linked list", "database", "SQL", "network", "server", "protocol",
      "hardness", "ductility", "corrosion", "composite", "ceramic",
      "semiconductor", "polymer", "alloy", "I-beam", "rivet",
      "scaffolding", "crane",
    ],
    hard: [
      "fatigue", "creep", "casting", "machining", "soldering",
      "hexadecimal", "fluid mechanics", "recursion", "sorting", "API",
      "object-oriented", "encapsulation", "inheritance", "polymorphism",
      "compiler", "interpreter", "operating system", "Boolean algebra",
      "Karnaugh map", "finite state machine", "Moore's law",
      "supply and demand", "load distribution", "Bernoulli equation",
      "stress-strain curve", "fatigue life", "buckling",
    ],
  },

  "engineering-advanced": {
    easy: [
      "robot", "drone", "satellite", "antenna", "solar panel", "wind turbine",
      "rocket", "submarine", "telescope", "microchip", "fiber optic",
      "laser", "3D printer", "barcode", "QR code", "USB drive",
      "circuit board", "magnet", "spring", "gauge",
    ],
    medium: [
      "Fourier transform", "convolution", "bandwidth", "MOSFET", "FPGA",
      "operational amplifier", "impedance", "resonance", "Bode plot",
      "feedback loop", "control system", "transfer function",
      "finite element", "Monte Carlo", "neural network",
      "machine learning", "Reynolds number", "turbulence",
      "boundary layer", "fuel cell", "superconductor", "piezoelectric",
      "photovoltaic", "MEMS", "binary tree", "hash function",
      "encryption", "TCP/IP", "cache", "pipeline", "interrupt",
      "instruction set", "Kalman filter", "PID controller",
      "differential equation", "eigenvalue", "biomedical imaging",
      "nanotechnology", "wavelet transform",
    ],
    hard: [
      "Laplace transform", "root locus", "state space",
      "phase margin", "gain margin", "model predictive control",
      "Lyapunov stability", "sliding mode", "Z-transform",
      "discrete-time", "fast Fourier transform", "sampling theorem",
      "Nyquist frequency", "aliasing", "signal processing",
      "Runge-Kutta", "Newton-Raphson", "principal component analysis",
      "singular value decomposition", "gradient descent",
      "backpropagation", "Navier-Stokes", "computational fluid dynamics",
      "heat equation", "Stefan-Boltzmann", "quantum tunneling",
      "superposition", "entanglement", "Hamiltonian", "Lagrangian",
      "Maxwell equations", "finite difference", "RISC",
      "Markov decision process", "convex optimization",
      "stochastic process", "Bayesian network",
    ],
  },
};

// Legacy difficulty-based bank kept for backwards-compat callers.
export const WORD_BANK: Record<Difficulty, readonly string[]> = {
  easy:   CATEGORY_WORDS.biology.easy.slice(0, 12) as string[],
  medium: CATEGORY_WORDS["medicine-clinical"].medium.slice(0, 12) as string[],
  hard:   CATEGORY_WORDS["medicine-academic"].hard.slice(0, 12) as string[],
};

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function buildPool(categories: WordCategory[], difficulties: Difficulty[]): string[] {
  if (categories.length === 0 || difficulties.length === 0) return [];
  const set = new Set<string>();
  for (const cat of categories) {
    for (const d of difficulties) {
      for (const w of CATEGORY_WORDS[cat][d]) set.add(w);
    }
  }
  return [...set];
}

export function countDifficultyWords(difficulties: Difficulty[], categories: WordCategory[] = []): number {
  return buildPool(categories, difficulties).length;
}

export function countCategoryWords(categories: WordCategory[]): number {
  return buildPool(categories, ALL_DIFFICULTIES).length;
}

export function pickWords(
  difficulties: Difficulty[],
  n: number,
  exclude: string[] = [],
  categories: WordCategory[] = [],
): string[] {
  const pool = buildPool(categories, difficulties);
  const available = pool.filter((w) => !exclude.includes(w));
  const out: string[] = [];
  const used = new Set<string>();
  const max = Math.min(n, available.length);
  let attempts = 0;
  while (out.length < max && attempts < available.length * 3) {
    const w = available[Math.floor(Math.random() * available.length)];
    if (!used.has(w)) { used.add(w); out.push(w); }
    attempts++;
  }
  return out;
}

export function maskWord(word: string): string {
  return word
    .split("")
    .map((c) => (c === " " ? "  " : c === "-" ? "-" : "_"))
    .join(" ");
}

export function normalizeGuess(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// Strip everything that isn't a letter or digit so that "half-life", "half life",
// and "halflife" all collapse to the same string.
function stripPunct(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Lightweight English stemmer covering the suffix variations a player is most
// likely to type: plurals, past tense / participle, and the -ary derivational
// suffix (so "complementary" matches "complement"). Intentionally conservative
// — we don't strip -ic / -al / -ous / -tion because those generate real word
// pairs already in the bank (e.g. "organ" vs "organic").
function stem(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) {
    w = w.slice(0, -3) + "y";
  } else if (w.length > 4 && w.endsWith("es")) {
    const stripEs = w.slice(0, -2);
    const last = stripEs[stripEs.length - 1];
    const last2 = stripEs.slice(-2);
    w = last === "s" || last === "x" || last === "z" || last2 === "ch" || last2 === "sh"
      ? stripEs
      : w.slice(0, -1);
  } else if (
    w.length > 3 &&
    w.endsWith("s") &&
    !w.endsWith("ss") &&
    !w.endsWith("us") &&
    !w.endsWith("is")
  ) {
    w = w.slice(0, -1);
  }
  if (w.length > 4 && w.endsWith("ied")) {
    w = w.slice(0, -3) + "y";
  } else if (w.length > 5 && w.endsWith("ing")) {
    w = w.slice(0, -3);
  } else if (w.length > 4 && w.endsWith("ed")) {
    w = w.slice(0, -2);
  }
  if (w.length > 5 && w.endsWith("ary")) {
    w = w.slice(0, -3);
  }
  return w;
}

export function isCorrectGuess(guess: string, word: string): boolean {
  const g = stripPunct(guess);
  const w = stripPunct(word);
  if (!g || !w) return false;
  if (g === w) return true;
  return stem(g) === stem(w);
}
