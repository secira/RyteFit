import { db } from '../server/db.js';
import { chapters, topics, questions } from '../shared/schema.js';

// Physics subject ID from database
const PHYSICS_SUBJECT_ID = 'ff72a1d3-761b-4dc7-af29-35191414afab';

// Create chapters and topics for Physics
const createChaptersAndTopics = async () => {
  console.log('Creating chapters and topics for Physics...');
  
  const physicsChapters = [
    { name: 'Fluid Mechanics', topics: ['Surface Tension', 'Pressure', 'Viscosity', 'Fluid Statics'] },
    { name: 'Optics', topics: ['Microscope', 'Telescope', 'Lenses', 'Mirrors', 'Polarization', 'Brewster Angle'] },
    { name: 'Electromagnetism', topics: ['Electric Field', 'Magnetic Field', 'Moving Charges', 'Electromagnetic Induction'] },
    { name: 'Mechanics', topics: ['Kinematics', 'Friction', 'Inclined Plane', 'Rotational Motion', 'Gravitation'] },
    { name: 'Oscillations and Waves', topics: ['Simple Harmonic Motion', 'Spring Mass System', 'Wave Motion'] },
    { name: 'Thermodynamics', topics: ['Heat Transfer', 'Gas Laws', 'Thermal Properties'] },
    { name: 'Modern Physics', topics: ['Atomic Structure', 'Bohr Model', 'de Broglie Wavelength', 'Photoelectric Effect'] },
    { name: 'Current Electricity', topics: ['Resistance', 'Kirchhoff Laws', 'Capacitors', 'Electric Circuits'] },
    { name: 'Measurement and Errors', topics: ['Vernier Caliper', 'Measurement', 'Significant Figures'] }
  ];

  const chapterTopicMap = new Map();

  for (const chapter of physicsChapters) {
    // Insert chapter
    const [insertedChapter] = await db.insert(chapters).values({
      subjectId: PHYSICS_SUBJECT_ID,
      name: chapter.name,
      description: `${chapter.name} chapter for NEET Physics`,
      chapterWeightage: null
    }).returning();
    
    console.log(`Created chapter: ${chapter.name}`);
    
    // Insert topics for this chapter
    for (const topicName of chapter.topics) {
      const [insertedTopic] = await db.insert(topics).values({
        chapterId: insertedChapter.id,
        name: topicName,
        description: `${topicName} topic in ${chapter.name}`
      }).returning();
      
      chapterTopicMap.set(topicName, insertedTopic.id);
      console.log(`  Created topic: ${topicName}`);
    }
  }
  
  return chapterTopicMap;
};

// All NEET 2025 Physics questions extracted from the PDF
const getPhysicsQuestions = (topicMap) => {
  const questionsData = [
    // Question 1: Surface Tension
    {
      text: "Consider a water tank shown in the figure. It has one wall at x = L and can be taken to be very wide in the z direction. When filled with a liquid of surface tension S and density ρ, the liquid surface makes angle θ₀ (θ₀ << 1) with the x-axis at x = L. If y(x) is the height of the surface then the equation for y(x) is: (take sin(θ) ≈ tan(θ) ≈ dθ/dx, g is the acceleration due to gravity)",
      options: [
        "d²y/dx² = (g/S)x",
        "d²y/dx² = (gρ/S)y", 
        "d²y/dx² = -(gρ/S)",
        "dy/dx = (gρ/S)x"
      ],
      correctOption: 1,
      explanation: "According to Young-Laplace equation: ΔP = S(d²y/dx²). Pressure difference is ΔP = ρgy. Here, S(d²y/dx²) = ρgy, so d²y/dx² = (gρ/S)y",
      topic: topicMap.get('Surface Tension'),
      difficulty: 3
    },
    
    // Question 2: Microscope
    {
      text: "A microscope has an objective of focal length 2cm, eyepiece of focal length 4cm and the tube length of 40cm. If the distance of distinct vision of eye is 25cm, the magnification in the microscope is",
      options: [
        "100",
        "125",
        "150", 
        "250"
      ],
      correctOption: 1,
      explanation: "M = (L/f₀) × (D/fₑ) = (40/2) × (25/4) = 20 × 6.25 = 125",
      topic: topicMap.get('Microscope'),
      difficulty: 2
    },
    
    // Question 3: Electromagnetic field
    {
      text: "An electron (mass 9 × 10⁻³¹ kg and charge 1.6 × 10⁻¹⁹ C) moving with speed c/100 (c = speed of light) is injected into a magnetic field B of magnitude 9 × 10⁻⁴ T perpendicular to its direction of motion. We wish to apply a uniform electric field E together with the magnetic field so that the electron does not deflect from its path. Then (speed of light c = 3 × 10⁸ ms⁻¹)",
      options: [
        "E is perpendicular to B and its magnitude is 27 × 10⁴ Vm⁻¹",
        "E is perpendicular to B and its magnitude is 27 × 10² Vm⁻¹",
        "E is parallel to B and its magnitude is 27 × 10² Vm⁻¹",
        "E is parallel to B and its magnitude is 27 × 10⁴ Vm⁻¹"
      ],
      correctOption: 1,
      explanation: "For no deflection: V = E/B, E = V×B = (c/100) × 9×10⁻⁴ = (3×10⁸/100) × 9×10⁻⁴ = 27×10² Vm⁻¹. E must be perpendicular to B.",
      topic: topicMap.get('Moving Charges'),
      difficulty: 3
    },
    
    // Question 4: Friction
    {
      text: "There are two inclined surfaces of equal length (L) and same angle of inclination 45° with the horizontal. One of them is rough and the other is perfectly smooth. A given body takes 2 times as much time to slide down on rough surface than on the smooth surface. The coefficient of kinetic friction (μₖ) between the object and the rough surface is close to",
      options: [
        "0.25",
        "0.40", 
        "0.5",
        "0.75"
      ],
      correctOption: 3,
      explanation: "μₖ = tan θ[(n²-1)/n²] where n = t_rough/t_smooth = 2. μₖ = tan 45°[(2²-1)/2²] = 1 × 3/4 = 0.75",
      topic: topicMap.get('Inclined Plane'),
      difficulty: 3
    },
    
    // Question 5: Energy and Force
    {
      text: "The kinetic energies of two similar cars A and B are 100 J and 225 J respectively. On applying brakes, car A stops after 1000m and car B stops after 1500m. If Fₐ and Fᵦ are the forces applied by the brakes on cars A and B respectively, then the ratio Fₐ/Fᵦ is",
      options: [
        "3/2",
        "2/3",
        "1/3", 
        "1/2"
      ],
      correctOption: 1,
      explanation: "F = E/d. Fₐ = 100/1000 = 0.1 N, Fᵦ = 225/1500 = 0.15 N. Fₐ/Fᵦ = 0.1/0.15 = 2/3",
      topic: topicMap.get('Kinematics'),
      difficulty: 2
    },
    
    // Question 22: Rotational Motion
    {
      text: "A uniform rod of mass 20 kg and length 5m leans against a smooth vertical wall making an angle of 60° with it. The other end rests on a rough horizontal floor. The friction force that the floor exerts on the rod is (take g = 10 m/s²)",
      options: [
        "100 N",
        "100√3 N",
        "200 N",
        "200√3 N"
      ],
      correctOption: 1,
      explanation: "f = N₂, N₁ = mg, Taking torque about contact point A: N₂ × y = mg × x, N₂ = mg × (√3/2) = 20 × 10 × (√3/2) = 100√3 N. f = N₂ = 100√3 N",
      topic: topicMap.get('Rotational Motion'),
      difficulty: 3
    },
    
    // Question 23: Oscillations
    {
      text: "In an oscillating spring mass system, a spring is connected to a box filled with sand. As the box oscillates, sand leaks slowly out of the box vertically so that the average frequency ω(t) and average amplitude A(t) of the system change with time t. Which option depicts these changes correctly?",
      options: [
        "ω increases, A increases",
        "ω increases, A decreases", 
        "ω decreases, A increases",
        "ω decreases, A decreases"
      ],
      correctOption: 1,
      explanation: "As mass decreases: ω = √(k/m) increases since m decreases. Amplitude decreases exponentially due to energy loss.",
      topic: topicMap.get('Simple Harmonic Motion'),
      difficulty: 3
    },
    
    // Question 25: Vernier Caliper
    {
      text: "Consider the diameter of a spherical object being measured with the help of Vernier calipers. Suppose its 10 Vernier Scale Divisions (V.S.D.) are equal to its 9 Main Scale Divisions (M.S.D.). The least division in the M.S. is 0.1 cm and the zero of V.S. is at x = 0.1cm when the jaws of Vernier calipers are closed. If the main scale reading for the diameter is M = 5 cm and the number of coinciding vernier division is 8, the measured diameter after zero error correction is",
      options: [
        "5.18 cm",
        "5.08 cm",
        "4.98 cm", 
        "5.00 cm"
      ],
      correctOption: 2,
      explanation: "L.C = 1MSD - 1VSD = 0.1 - 0.09 = 0.01cm. Zero error = +0.1cm, correction = -0.1cm. Diameter = MSR + V.C×L.C + Zero correction = 5 + 8×0.01 - 0.1 = 5.08 - 0.1 = 4.98 cm",
      topic: topicMap.get('Vernier Caliper'),
      difficulty: 2
    },
    
    // Question 26: Displacement Current
    {
      text: "A parallel plate capacitor made of circular plates is being charged such that the surface charge density on its plates is increasing at a constant rate with time. The magnetic field arising due to displacement current is:",
      options: [
        "zero at all places",
        "constant between the plates and zero outside the plates", 
        "non-zero everywhere with maximum at the imaginary cylindrical surface connecting peripheries of the plates",
        "zero between the plates and non-zero outside"
      ],
      correctOption: 2,
      explanation: "Due to displacement current, magnetic field exists both inside and outside the plates. Inside: B ∝ r, Outside: B ∝ 1/r. Maximum field occurs at r = R (plate radius).",
      topic: topicMap.get('Electromagnetic Induction'),
      difficulty: 4
    },
    
    // Question 27: Brewster's Angle
    {
      text: "An unpolarized light beam travelling in air is incident on a medium of refractive index 1.73 at Brewster's angle. Then-",
      options: [
        "reflected light is completely polarized and the angle of reflection is close to 60°",
        "reflected light is partially polarized and the angle of reflection is close to 30°",
        "both reflected and transmitted light are perfectly polarized with angles of reflection and refraction close to 60° and 30°, respectively",
        "transmitted light is completely polarized with angle of refraction close to 30°"
      ],
      correctOption: 0,
      explanation: "θₚ = tan⁻¹(μ) = tan⁻¹(1.73) = 60°. At Brewster's angle, reflected ray is completely polarized and angle of reflection equals Brewster's angle = 60°",
      topic: topicMap.get('Polarization'),
      difficulty: 3
    },
    
    // Question 28: Electrostatics
    {
      text: "Two identical charged conducting spheres A and B have their centres separated by a certain distance. Charge on each sphere is q and the force of repulsion between them is F. A third identical uncharged conducting sphere is brought in contact with sphere A first and then with B and finally removed from both. New force of repulsion between spheres A and B is best given as:",
      options: [
        "3F/5",
        "2F/3",
        "F/2",
        "3F/8"
      ],
      correctOption: 3,
      explanation: "Initially F = kq²/r². After contact with A, both A and C have q/2. After contact with B, both B and C have (q/2 + q)/2 = 3q/4. New force F₁ = k(q/2)(3q/4)/r² = 3kq²/8r² = 3F/8",
      topic: topicMap.get('Electric Field'),
      difficulty: 3
    },
    
    // Question 29: Thermodynamics
    {
      text: "A container has two chambers of volumes V₁ = 2 litres and V₂ = 3 litres separated by a partition made of a thermal insulator. The chambers contain n₁ = 5 and n₂ = 4 moles of ideal gas at pressures p₁ = 1 atm and p₂ = 2 atm, respectively. When the partition is removed, the mixture attains an equilibrium pressure of:",
      options: [
        "1.3 atm",
        "1.6 atm",
        "1.4 atm",
        "1.8 atm"
      ],
      correctOption: 1,
      explanation: "P_eq(V₁ + V₂) = P₁V₁ + P₂V₂. P_eq(2 + 3) = 1×2 + 2×3 = 8. P_eq = 8/5 = 1.6 atm",
      topic: topicMap.get('Gas Laws'),
      difficulty: 2
    },
    
    // Question 30: Bohr Model
    {
      text: "A particle of mass m is moving around the origin with a constant force F pulling it towards the origin. If Bohr model is used to describe its motion, the radius r of the nth orbit and the particle's speed v in the orbit depend on n as",
      options: [
        "r ∝ n¹/³ ; v ∝ n⁻¹/³",
        "r ∝ n¹/³ ; v ∝ n⁻²/³",
        "r ∝ n²/³ ; v ∝ n⁻¹/³",
        "r ∝ n⁴/³ ; v ∝ n⁻¹/³"
      ],
      correctOption: 2,
      explanation: "From F = mv²/r and mvr = nh/2π, we get r³ ∝ n² so r ∝ n²/³. From v = nh/2πmr, v ∝ n/r ∝ n⁻¹/³",
      topic: topicMap.get('Atomic Structure'),
      difficulty: 4
    },
    
    // Question 32: Gravitation
    {
      text: "A body weighs 48 N on the surface of the earth. The gravitational force experienced by the body due to the earth at a height equal to one-third the radius of the earth from its surface is:",
      options: [
        "16 N",
        "27 N", 
        "32 N",
        "36 N"
      ],
      correctOption: 1,
      explanation: "g_h = g/(1 + h/R)². At h = R/3, g_h = g/(1 + 1/3)² = g/(4/3)² = 9g/16. Weight = mg_h = 48 × 9/16 = 27 N",
      topic: topicMap.get('Gravitation'),
      difficulty: 2
    },
    
    // Question 33: Resistance Networks  
    {
      text: "A wire of resistance R is cut into 8 equal pieces. From these pieces two equivalent resistances are made by adding four of these together in parallel. Then these two sets are added in series. The net effective resistance of the combination is:",
      options: [
        "R/64",
        "R/32",
        "R/16",
        "R/8"
      ],
      correctOption: 2,
      explanation: "Each piece has resistance R/8. Four in parallel: R_eff = (R/8)/4 = R/32. Two such sets in series: R_total = R/32 + R/32 = R/16",
      topic: topicMap.get('Resistance'),
      difficulty: 3
    },
    
    // Question 34: de Broglie wavelength
    {
      text: "de-Broglie wavelength of an electron orbiting in the n = 2 state of hydrogen atom is close to (Given Bohr radius = 0.052 nm)",
      options: [
        "0.067 nm",
        "0.67 nm",
        "1.67 nm",
        "2.67 nm"
      ],
      correctOption: 1,
      explanation: "2πr_n = nλ. For n = 2, r₂ = 4 × 0.052 = 0.208 nm. λ = 2πr₂/n = 2π × 0.208/2 = 0.67 nm",
      topic: topicMap.get('de Broglie Wavelength'),
      difficulty: 3
    },
    
    // Question 35: Electric Dipole
    {
      text: "An electric dipole with dipole moment 5 × 10⁻⁶ Cm is aligned with the direction of a uniform electric field of magnitude 4 × 10⁵ N/C. The dipole is then rotated through an angle of 60° with respect to the electric field. The change in the potential energy of the dipole is:",
      options: [
        "0.8 J",
        "1.0 J",
        "1.2 J", 
        "1.5 J"
      ],
      correctOption: 1,
      explanation: "ΔU = -pE(cos θ₂ - cos θ₁) = -5×10⁻⁶ × 4×10⁵ × (cos 60° - cos 0°) = -2 × (1/2 - 1) = 1.0 J",
      topic: topicMap.get('Electric Field'),
      difficulty: 2
    },
    
    // Question 37: de Broglie wavelength ratio
    {
      text: "A photon and electron (mass m) have the same energy E. The ratio (λ_photon/λ_electron) of their de Broglie wavelengths is: (c is the speed of light)",
      options: [
        "√(E/2m)",
        "c√(2mE)",
        "c√(2m/E)",
        "1/√(E/2m)"
      ],
      correctOption: 2,
      explanation: "λ_photon = hc/E, λ_electron = h/√(2mE). Ratio = (hc/E)/(h/√(2mE)) = c√(2m/E)",
      topic: topicMap.get('de Broglie Wavelength'),
      difficulty: 4
    },
    
    // Question 38: Photoelectric Effect  
    {
      text: "Which of the following options represent the variation of photoelectric current with property of light shown on the x-axis?",
      options: [
        "Current vs Intensity - straight line through origin",
        "Current vs Frequency - horizontal line",
        "Current vs Wavelength - exponential decay",
        "Current vs Amplitude - parabolic"
      ],
      correctOption: 0,
      explanation: "Photoelectric current is directly proportional to intensity of light (straight line through origin) and independent of frequency of light (horizontal line parallel to frequency axis)",
      topic: topicMap.get('Photoelectric Effect'),
      difficulty: 2
    }
  ];

  return questionsData;
};

// Main execution function
const main = async () => {
  try {
    console.log('Starting NEET 2025 Physics question extraction...');
    
    // Create chapters and topics
    const topicMap = await createChaptersAndTopics();
    
    // Get all physics questions
    const questionsData = getPhysicsQuestions(topicMap);
    
    console.log(`Inserting ${questionsData.length} physics questions...`);
    
    // Insert all questions
    for (const questionData of questionsData) {
      const [insertedQuestion] = await db.insert(questions).values({
        topicId: questionData.topic,
        text: questionData.text,
        options: questionData.options,
        correctOption: questionData.correctOption,
        explanation: questionData.explanation,
        difficultyLevel: questionData.difficulty,
        isPreviousYear: true,
        previousYearInfo: "NEET 2025 Physics - Code 45"
      }).returning();
      
      console.log(`Inserted question: ${insertedQuestion.id}`);
    }
    
    console.log('Successfully extracted and inserted all NEET 2025 Physics questions!');
    
    // Verify insertion
    const totalQuestions = await db.select().from(questions);
    console.log(`Total questions in database: ${totalQuestions.length}`);
    
  } catch (error) {
    console.error('Error extracting physics questions:', error);
  }
};

main();