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
    // Cell biology
    "cell", "nucleus", "mitosis", "chromosome", "DNA", "RNA", "protein", "ribosome",
    "mitochondria", "chloroplast", "vacuole", "cell wall", "cell membrane", "lysosome",
    "Golgi apparatus", "endoplasmic reticulum", "centriole", "cytoplasm", "meiosis",
    "osmosis", "diffusion", "active transport", "cell cycle", "apoptosis", "telomere",
    // Genetics
    "gene", "allele", "mutation", "genotype", "phenotype", "dominant", "recessive",
    "chromosome pair", "DNA replication", "transcription", "translation", "codon",
    "natural selection", "genetic drift", "evolution", "adaptation", "speciation",
    // Organism biology
    "photosynthesis", "respiration", "enzyme", "antibody", "antigen", "hormone",
    "nervous system", "neuron", "synapse", "reflex arc", "spinal cord",
    "immune system", "lymph node", "red blood cell", "white blood cell", "platelet",
    "artery", "vein", "capillary", "heart", "lung", "liver", "kidney", "brain",
    "stomach", "intestine", "pancreas", "spleen", "bladder", "muscle", "bone", "skin",
    "eye", "ear", "nose", "tongue", "nerve", "blood", "tissue", "organ",
    // Ecology
    "ecosystem", "food chain", "predator", "prey", "habitat", "biodiversity",
    "photosynthesis", "decomposer", "producer", "consumer", "population",
    // Plants & microorganisms
    "root", "leaf", "flower", "seed", "stem", "bark", "pollen", "germination",
    "transpiration", "xylem", "phloem", "bacteria", "virus", "fungi", "algae",
    "membrane", "homeostasis", "peristalsis", "bile", "amylase", "insulin",
    "hemoglobin", "antibody", "phagocytosis", "endocytosis",
  ],
  chemistry: [
    // Fundamentals
    "atom", "molecule", "element", "compound", "mixture", "ion", "electron",
    "proton", "neutron", "nucleus", "isotope", "periodic table", "mole",
    "atomic number", "mass number", "electron shell",
    // Bonding
    "covalent bond", "ionic bond", "metallic bond", "hydrogen bond",
    "bond", "polymer", "alloy", "crystal", "lattice",
    // Reactions
    "acid", "base", "salt", "pH", "catalyst", "reaction", "combustion",
    "oxidation", "reduction", "displacement", "precipitation", "neutralization",
    "electrolysis", "distillation", "filtration", "chromatography", "titration",
    "exothermic", "endothermic", "activation energy", "equilibrium",
    // Organic chemistry
    "hydrocarbon", "alkane", "alkene", "alcohol", "carboxylic acid", "ester",
    "amino acid", "peptide", "glucose", "starch", "cellulose", "fat", "oil",
    "functional group", "condensation", "hydrolysis", "fermentation",
    // Physical chemistry
    "concentration", "solution", "solvent", "solute", "precipitate", "gas",
    "enthalpy", "entropy", "noble gas", "transition metal", "metal", "non-metal",
    "oxidizing agent", "reducing agent", "half equation", "rate of reaction",
    // Lab
    "Bunsen burner", "test tube", "beaker", "pipette", "burette", "flask",
    "litmus paper", "indicator", "crucible", "spatula",
  ],
  physics: [
    // Mechanics
    "force", "gravity", "friction", "velocity", "acceleration", "momentum",
    "mass", "weight", "density", "pressure", "inertia", "torque",
    "kinetic energy", "potential energy", "work", "power", "efficiency",
    "Newton's laws", "Hooke's law", "centripetal force", "terminal velocity",
    // Waves and optics
    "wave", "frequency", "amplitude", "wavelength", "sound", "light",
    "refraction", "reflection", "diffraction", "interference", "resonance",
    "standing wave", "Doppler effect", "total internal reflection",
    "polarization", "lens", "mirror", "prism", "spectrum",
    // Electricity and magnetism
    "current", "voltage", "resistance", "magnet", "circuit",
    "parallel circuit", "series circuit", "transformer", "diode",
    "capacitor", "inductor", "electromagnetic", "motor", "generator",
    "Ohm's law", "Faraday's law",
    // Thermal physics
    "heat", "temperature", "conduction", "convection", "radiation",
    "thermal expansion", "entropy", "specific heat", "latent heat",
    // Modern physics
    "photon", "electron", "nuclear fission", "nuclear fusion", "half-life",
    "radioactive decay", "alpha particle", "beta particle", "gamma ray",
    "binding energy", "photoelectric effect", "black hole", "neutron star",
    "oscillation", "pendulum", "spring",
  ],
  maths: [
    // Shapes and geometry
    "triangle", "circle", "square", "rectangle", "hexagon", "cone", "cube",
    "sphere", "cylinder", "pyramid", "angle", "parallel", "perpendicular",
    "symmetry", "tessellation", "coordinate", "transformation",
    // Algebra
    "equation", "variable", "function", "graph", "parabola", "asymptote",
    "polynomial", "quadratic", "linear", "inequality", "fraction", "decimal",
    "percentage", "ratio", "proportion", "exponent", "logarithm",
    "simultaneous equations", "matrix", "vector", "determinant",
    // Numbers
    "prime number", "factor", "multiple", "integer", "irrational number",
    "complex number", "sequence", "series", "binomial", "factorial",
    // Calculus
    "derivative", "integral", "differentiation", "integration",
    "limit", "tangent", "gradient", "area under curve",
    // Statistics & probability
    "probability", "mean", "median", "mode", "range", "standard deviation",
    "normal distribution", "histogram", "scatter graph", "pie chart",
    "bar chart", "frequency table", "hypothesis test", "correlation",
    // Trigonometry
    "sine", "cosine", "tangent", "sine rule", "cosine rule", "right angle",
    "hypotenuse", "adjacent", "opposite", "pi", "radian",
    // Misc
    "volume", "area", "perimeter", "Pythagoras", "proof by induction",
    "set theory", "Venn diagram", "permutation", "combination",
  ],
  "medicine-academic": [
    // Cellular & molecular
    "neuron", "synapse", "action potential", "receptor", "ligand",
    "enzyme", "substrate", "ATP", "mitochondria", "ribosome",
    "DNA", "RNA", "transcription", "translation", "codon", "chromosome",
    "cell cycle", "apoptosis", "telomere", "stem cell",
    // Metabolism
    "glycolysis", "Krebs cycle", "electron transport chain",
    "gluconeogenesis", "beta oxidation", "fatty acid synthesis",
    "cholesterol", "lipoprotein", "insulin", "glucagon",
    // Endocrinology
    "hormone", "cortisol", "adrenaline", "thyroid hormone",
    "parathyroid hormone", "growth hormone", "prolactin",
    "aldosterone", "antidiuretic hormone", "oxytocin", "melatonin",
    "follicle stimulating hormone", "luteinizing hormone",
    // Immunology
    "antibody", "antigen", "B cell", "T cell", "cytokine",
    "inflammation", "immunity", "phagocytosis", "complement",
    "histamine", "mast cell", "natural killer cell", "interferon",
    // Neuroscience
    "dopamine", "serotonin", "acetylcholine", "noradrenaline",
    "myelin", "axon", "dendrite", "blood-brain barrier",
    "hippocampus", "cerebellum", "cerebral cortex", "amygdala",
    // Cardiovascular
    "hemoglobin", "albumin", "erythrocyte", "leukocyte", "platelet",
    "fibrinogen", "sinoatrial node", "cardiac output",
    "stroke volume", "preload", "afterload",
    // Renal & respiratory
    "nephron", "glomerulus", "renal tubule", "osmolarity", "pH buffer",
    "alveolus", "bronchiole", "surfactant", "tidal volume",
    // Histology
    "hepatocyte", "enterocyte", "osteoblast", "osteoclast",
    "fibroblast", "endothelium", "epithelium",
  ],
  "medicine-clinical": [
    // Investigations
    "X-ray", "CT scan", "MRI", "ultrasound", "ECG", "echocardiogram",
    "blood test", "biopsy", "lumbar puncture", "spirometry",
    "endoscope", "colonoscopy", "bronchoscopy", "cystoscopy",
    "bone marrow biopsy", "peak flow", "angiogram",
    // Procedures & equipment
    "surgery", "suture", "catheter", "stethoscope", "laparoscope",
    "ventilator", "defibrillator", "pacemaker", "cannula",
    "blood pressure cuff", "pulse oximeter", "nasogastric tube",
    "chest drain", "tracheostomy", "intubation", "tourniquet",
    // Symptoms & signs
    "jaundice", "cyanosis", "edema", "clubbing", "pallor",
    "tachycardia", "bradycardia", "hypertension", "hypotension",
    "fever", "rash", "wheeze", "crepitations", "murmur",
    // Cardiovascular
    "heart attack", "heart failure", "angina", "arrhythmia",
    "atrial fibrillation", "aortic dissection", "pulmonary embolism",
    "DVT", "stroke", "transient ischemic attack",
    // Respiratory
    "pneumonia", "asthma", "COPD", "tuberculosis", "pneumothorax",
    "pleural effusion", "respiratory failure",
    // Gastro & abdominal
    "appendicitis", "pancreatitis", "cholecystitis", "peritonitis",
    "liver failure", "cirrhosis", "Crohn's disease", "colitis",
    // Endocrine & metabolic
    "diabetes", "hypothyroidism", "hyperthyroidism",
    "diabetic ketoacidosis", "Addison's disease", "Cushing's syndrome",
    // Neuro & psych
    "meningitis", "Parkinson", "Alzheimer", "epilepsy", "migraine",
    "depression", "schizophrenia",
    // Oncology & other
    "tumor", "chemotherapy", "radiotherapy", "transplant", "vaccination",
    "sepsis", "anemia", "fracture", "infection", "renal failure",
    "prescription", "diagnosis", "triage", "ICU", "CPR",
  ],
  "engineering-basic": [
    // Electronics
    "circuit", "resistor", "capacitor", "transistor", "diode", "LED",
    "voltage", "current", "power", "oscilloscope", "multimeter",
    "breadboard", "PCB", "soldering", "fuse", "relay",
    "logic gate", "AND gate", "OR gate", "NOT gate", "flip flop",
    "binary", "hexadecimal", "microcontroller",
    // Mechanical
    "gear", "lever", "pulley", "screw", "spring", "bearing",
    "shaft", "coupling", "brake", "clutch", "motor", "generator",
    "torque", "stress", "strain", "elasticity", "fatigue", "creep",
    "welding", "casting", "machining", "lathe",
    // Civil & structural
    "beam", "column", "truss", "bridge", "concrete", "steel",
    "foundation", "arch", "cantilever", "shear force", "bending moment",
    // Thermodynamics & fluids
    "heat transfer", "thermodynamics", "fluid mechanics",
    "pump", "turbine", "compressor", "valve", "pipe",
    "hydraulics", "pneumatics",
    // Computing & software
    "algorithm", "variable", "loop", "function", "class", "array",
    "stack", "queue", "linked list", "recursion", "sorting",
    "database", "SQL", "API", "network", "server", "protocol",
    // Materials
    "hardness", "ductility", "corrosion", "polymer", "composite",
    "alloy", "ceramic", "semiconductor",
  ],
  "engineering-advanced": [
    // Control systems
    "PID controller", "transfer function", "Bode plot",
    "root locus", "state space", "Laplace transform",
    "feedback loop", "control system", "phase margin", "gain margin",
    "Kalman filter", "model predictive control", "Lyapunov stability",
    "sliding mode", "Z-transform", "discrete-time",
    // Signal processing
    "Fourier transform", "fast Fourier transform", "convolution",
    "sampling theorem", "Nyquist frequency", "aliasing",
    "wavelet transform", "signal processing", "bandwidth",
    // Electronics advanced
    "MOSFET", "FPGA", "differential equation", "eigenvalue",
    "Bode plot", "operational amplifier", "impedance", "resonance",
    // Computational methods
    "finite element", "finite difference", "Runge-Kutta",
    "Newton-Raphson", "Monte Carlo", "principal component analysis",
    "singular value decomposition", "gradient descent",
    "backpropagation", "neural network", "machine learning",
    // Fluid & thermal advanced
    "Navier-Stokes", "Reynolds number", "turbulence",
    "boundary layer", "Bernoulli equation", "computational fluid dynamics",
    "heat equation", "Stefan-Boltzmann",
    // Physics-based engineering
    "quantum tunneling", "superposition", "entanglement",
    "Hamiltonian", "Lagrangian", "Maxwell equations",
    "superconductor", "piezoelectric", "photovoltaic", "fuel cell",
    "nanotechnology", "MEMS", "biomedical imaging",
    // Computing advanced
    "compiler", "binary tree", "hash function", "encryption",
    "TCP/IP", "operating system", "cache", "pipeline",
    "interrupt", "RISC", "instruction set",
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
  // ies → y  (antibodies → antibody, diaries → diary)
  if (w.length > 4 && w.endsWith("ies")) {
    w = w.slice(0, -3) + "y";
  } else if (w.length > 4 && w.endsWith("es")) {
    // boxes → box, dishes → dish, masses → mass; otherwise just strip the s
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
    // protons → proton, cells → cell; preserves nucleus, basis, mass
    w = w.slice(0, -1);
  }
  // Past tense / gerund — modestly conservative length thresholds
  if (w.length > 4 && w.endsWith("ied")) {
    w = w.slice(0, -3) + "y";
  } else if (w.length > 5 && w.endsWith("ing")) {
    w = w.slice(0, -3);
  } else if (w.length > 4 && w.endsWith("ed")) {
    w = w.slice(0, -2);
  }
  // -ary → "" (complementary → complement, secondary → second)
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
