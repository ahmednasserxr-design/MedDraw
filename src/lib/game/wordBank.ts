export type WordCategory =
  | "biology"
  | "chemistry"
  | "physics"
  | "maths"
  | "medicine-academic"
  | "medicine-clinical"
  | "engineering-basic"
  | "engineering-advanced";

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

export const CATEGORY_WORDS: Record<WordCategory, readonly string[]> = {
  biology: [
    "cell", "nucleus", "mitosis", "chromosome", "DNA", "protein", "photosynthesis",
    "respiration", "ecosystem", "evolution", "membrane", "enzyme", "tissue", "organ",
    "nerve", "muscle", "blood", "heart", "lung", "liver", "kidney", "brain", "eye",
    "stomach", "bacteria", "virus", "fungi", "root", "leaf", "flower", "seed",
    "predator", "prey", "food chain", "adaptation", "mutation", "ribosome", "meiosis",
    "osmosis", "diffusion", "habitat", "biodiversity", "chloroplast", "vacuole",
    "cell wall", "antibody", "hormone", "nervous system", "reflex arc",
  ],
  chemistry: [
    "atom", "molecule", "bond", "element", "compound", "acid", "base", "salt",
    "reaction", "catalyst", "solution", "mixture", "metal", "electron", "proton",
    "neutron", "ion", "polymer", "oxidation", "reduction", "combustion", "precipitate",
    "distillation", "filtration", "periodic table", "alloy", "isotope", "pH",
    "concentration", "electrolysis", "covalent bond", "ionic bond", "mole",
    "activation energy", "equilibrium", "titration", "chromatography",
    "exothermic", "endothermic", "displacement", "noble gas", "transition metal",
  ],
  physics: [
    "force", "energy", "wave", "light", "sound", "gravity", "friction",
    "velocity", "acceleration", "momentum", "current", "voltage", "resistance",
    "magnet", "refraction", "reflection", "heat", "temperature", "pressure",
    "mass", "density", "frequency", "amplitude", "power", "work",
    "kinetic energy", "potential energy", "nuclear fission", "nuclear fusion",
    "electromagnetic", "spectrum", "photon", "electron", "inertia",
    "centripetal force", "terminal velocity", "half-life", "oscillation",
    "transformer", "diode", "circuit", "parallel circuit", "series circuit",
  ],
  maths: [
    "triangle", "circle", "equation", "graph", "fraction", "decimal",
    "percentage", "prime number", "angle", "volume", "area", "probability",
    "matrix", "vector", "sequence", "function", "derivative", "integral",
    "logarithm", "parabola", "tangent", "median", "mean", "mode",
    "parallel", "perpendicular", "ratio", "proportion", "quadratic",
    "simultaneous equations", "differentiation", "integration", "binomial",
    "sine rule", "cosine rule", "standard deviation", "hypothesis test",
    "polynomial", "asymptote", "coordinate", "transformation", "symmetry",
  ],
  "medicine-academic": [
    "neuron", "synapse", "action potential", "receptor", "hormone", "enzyme",
    "antibody", "antigen", "homeostasis", "ATP", "mitochondria", "RNA",
    "transcription", "translation", "cell cycle", "apoptosis", "inflammation",
    "immunity", "hemoglobin", "albumin", "insulin", "cortisol", "adrenaline",
    "acetylcholine", "dopamine", "serotonin", "histamine", "cytokine",
    "glomerulus", "nephron", "alveolus", "bronchiole", "sinoatrial node",
    "blood-brain barrier", "axon", "myelin", "dendrite", "sarcomere",
    "renal tubule", "bile duct", "hepatocyte", "enterocyte", "osteoblast",
    "erythrocyte", "leukocyte", "platelet", "fibrinogen", "complement",
    "phagocytosis", "endocytosis", "osmolarity", "pH buffer",
  ],
  "medicine-clinical": [
    "diagnosis", "surgery", "prescription", "X-ray", "CT scan", "MRI",
    "ECG", "blood test", "vaccination", "chemotherapy", "transplant",
    "fracture", "tumor", "infection", "hypertension", "diabetes",
    "asthma", "pneumonia", "appendicitis", "meningitis", "sepsis",
    "anemia", "stroke", "heart attack", "angina", "arrhythmia",
    "catheter", "stethoscope", "endoscope", "laparoscope", "ventilator",
    "defibrillator", "pacemaker", "biopsy", "suture", "triage",
    "ICU", "CPR", "renal failure", "liver failure", "pancreatitis",
    "cholecystitis", "peritonitis", "pulmonary embolism", "DVT",
    "atrial fibrillation", "heart failure", "COPD", "tuberculosis",
    "hypothyroidism", "hyperthyroidism", "Parkinson", "Alzheimer",
  ],
  "engineering-basic": [
    "circuit", "resistor", "capacitor", "transistor", "diode", "motor",
    "generator", "beam", "column", "truss", "bridge", "concrete", "steel",
    "algorithm", "variable", "loop", "function", "class", "database",
    "network", "server", "protocol", "voltage", "current", "power",
    "heat transfer", "thermodynamics", "fluid mechanics", "statics",
    "dynamics", "torque", "stress", "strain", "elasticity", "momentum",
    "kinetic energy", "potential energy", "efficiency", "gear", "lever",
    "pulley", "hydraulics", "pneumatics", "welding", "casting",
  ],
  "engineering-advanced": [
    "Fourier transform", "Laplace transform", "differential equation",
    "eigenvalue", "finite element", "PID controller", "Bode plot",
    "transfer function", "MOSFET", "bandwidth", "Nyquist frequency",
    "Reynolds number", "turbulence", "control system", "feedback loop",
    "microcontroller", "FPGA", "neural network", "convolution",
    "Hamiltonian", "Lagrangian", "Maxwell equations", "quantum tunneling",
    "superposition", "entanglement", "compiler", "binary tree",
    "hash function", "encryption", "TCP/IP", "operating system",
    "interrupt", "cache", "pipeline", "RISC", "machine learning",
    "gradient descent", "backpropagation", "signal processing",
  ],
};

// Legacy difficulty-based bank for backward compat (used when no categories selected)
export type Difficulty = "easy" | "medium" | "hard";

export const WORD_BANK: Record<Difficulty, readonly string[]> = {
  easy:   CATEGORY_WORDS.biology.slice(0, 9) as string[],
  medium: CATEGORY_WORDS["medicine-clinical"].slice(0, 10) as string[],
  hard:   CATEGORY_WORDS["medicine-academic"].slice(0, 8) as string[],
};

export function countCategoryWords(categories: WordCategory[]): number {
  if (categories.length === 0) return 0;
  return [...new Set(categories.flatMap((c) => CATEGORY_WORDS[c]))].length;
}

export function pickWords(
  categories: WordCategory[],
  n: number,
  exclude: string[] = [],
): string[] {
  const pool: string[] =
    categories.length > 0
      ? [...new Set(categories.flatMap((c) => [...CATEGORY_WORDS[c]]))]
      : [...WORD_BANK.medium];
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

export function isCorrectGuess(guess: string, word: string): boolean {
  return normalizeGuess(guess) === normalizeGuess(word);
}
