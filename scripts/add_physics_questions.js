// Simple script to add NEET 2025 Physics questions to database
import { db } from '../server/db.js';
import { chapters, topics, questions } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Physics subject ID from database
const PHYSICS_SUBJECT_ID = 'ff72a1d3-761b-4dc7-af29-35191414afab';

const main = async () => {
  try {
    console.log('🚀 Adding NEET 2025 Physics questions...');

    // First, create a general Physics chapter for all questions
    let generalChapter;
    try {
      [generalChapter] = await db.insert(chapters).values({
        subjectId: PHYSICS_SUBJECT_ID,
        name: 'NEET 2025 Physics',
        description: 'NEET 2025 Physics questions - Mixed topics',
        chapterWeightage: 100
      }).returning();
      console.log('✅ Created chapter: NEET 2025 Physics');
    } catch (error) {
      // Chapter might already exist, try to find it
      const existingChapter = await db.select().from(chapters)
        .where(eq(chapters.name, 'NEET 2025 Physics'))
        .limit(1);
      if (existingChapter.length > 0) {
        generalChapter = existingChapter[0];
        console.log('📋 Found existing chapter: NEET 2025 Physics');
      } else {
        throw error;
      }
    }

    // Create a general topic for all physics questions
    let generalTopic;
    try {
      [generalTopic] = await db.insert(topics).values({
        chapterId: generalChapter.id,
        name: 'Mixed Physics Topics',
        description: 'Various physics topics from NEET 2025 exam'
      }).returning();
      console.log('✅ Created topic: Mixed Physics Topics');
    } catch (error) {
      // Topic might already exist
      const existingTopic = await db.select().from(topics)
        .where(eq(topics.name, 'Mixed Physics Topics'))
        .limit(1);
      if (existingTopic.length > 0) {
        generalTopic = existingTopic[0];
        console.log('📋 Found existing topic: Mixed Physics Topics');
      } else {
        throw error;
      }
    }

    // NEET 2025 Physics questions extracted from PDF
    const physicsQuestions = [
      {
        text: "Consider a water tank shown in the figure. It has one wall at x = L and can be taken to be very wide in the z direction. When filled with a liquid of surface tension S and density ρ, the liquid surface makes angle θ₀ (θ₀ << 1) with the x-axis at x = L. If y(x) is the height of the surface then the equation for y(x) is:",
        options: [
          "d²y/dx² = (g/S)x",
          "d²y/dx² = (gρ/S)y", 
          "d²y/dx² = -(gρ/S)",
          "dy/dx = (gρ/S)x"
        ],
        correctOption: 1,
        explanation: "According to Young-Laplace equation: ΔP = S(d²y/dx²). Pressure difference is ΔP = ρgy. Here, S(d²y/dx²) = ρgy, so d²y/dx² = (gρ/S)y",
        difficulty: 3
      },
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
        difficulty: 2
      },
      {
        text: "An electron (mass 9 × 10⁻³¹ kg and charge 1.6 × 10⁻¹⁹ C) moving with speed c/100 is injected into a magnetic field B of magnitude 9 × 10⁻⁴ T perpendicular to its direction of motion. We wish to apply a uniform electric field E together with the magnetic field so that the electron does not deflect from its path. Then (c = 3 × 10⁸ ms⁻¹)",
        options: [
          "E is perpendicular to B and its magnitude is 27 × 10⁴ Vm⁻¹",
          "E is perpendicular to B and its magnitude is 27 × 10² Vm⁻¹",
          "E is parallel to B and its magnitude is 27 × 10² Vm⁻¹",
          "E is parallel to B and its magnitude is 27 × 10⁴ Vm⁻¹"
        ],
        correctOption: 1,
        explanation: "For no deflection: V = E/B, E = V×B = (c/100) × 9×10⁻⁴ = 27×10² Vm⁻¹. E must be perpendicular to B.",
        difficulty: 3
      },
      {
        text: "There are two inclined surfaces of equal length (L) and same angle of inclination 45° with the horizontal. One of them is rough and the other is perfectly smooth. A given body takes 2 times as much time to slide down on rough surface than on the smooth surface. The coefficient of kinetic friction (μₖ) is close to",
        options: [
          "0.25",
          "0.40", 
          "0.5",
          "0.75"
        ],
        correctOption: 3,
        explanation: "μₖ = tan θ[(n²-1)/n²] where n = 2. μₖ = tan 45°[(4-1)/4] = 1 × 3/4 = 0.75",
        difficulty: 3
      },
      {
        text: "The kinetic energies of two similar cars A and B are 100 J and 225 J respectively. On applying brakes, car A stops after 1000m and car B stops after 1500m. If Fₐ and Fᵦ are the forces applied by the brakes, then the ratio Fₐ/Fᵦ is",
        options: [
          "3/2",
          "2/3",
          "1/3", 
          "1/2"
        ],
        correctOption: 1,
        explanation: "F = E/d. Fₐ = 100/1000 = 0.1 N, Fᵦ = 225/1500 = 0.15 N. Fₐ/Fᵦ = 0.1/0.15 = 2/3",
        difficulty: 2
      },
      {
        text: "A uniform rod of mass 20 kg and length 5m leans against a smooth vertical wall making an angle of 60° with it. The other end rests on a rough horizontal floor. The friction force that the floor exerts on the rod is (g = 10 m/s²)",
        options: [
          "100 N",
          "100√3 N",
          "200 N",
          "200√3 N"
        ],
        correctOption: 1,
        explanation: "Taking torque about contact point: N₂ = mg × (√3/2) = 20 × 10 × (√3/2) = 100√3 N. Friction f = N₂ = 100√3 N",
        difficulty: 3
      },
      {
        text: "In an oscillating spring mass system, a spring is connected to a box filled with sand. As the box oscillates, sand leaks slowly out so that the average frequency ω(t) and amplitude A(t) change with time t. Which depicts these changes correctly?",
        options: [
          "ω increases, A increases",
          "ω increases, A decreases", 
          "ω decreases, A increases",
          "ω decreases, A decreases"
        ],
        correctOption: 1,
        explanation: "As mass decreases: ω = √(k/m) increases. Amplitude decreases exponentially due to energy loss.",
        difficulty: 3
      },
      {
        text: "Consider measuring a spherical object's diameter with Vernier calipers. 10 VSD = 9 MSD. Least division in MS is 0.1 cm and zero of VS is at 0.1cm when jaws are closed. If MSR = 5 cm and coinciding vernier division is 8, the measured diameter after zero error correction is",
        options: [
          "5.18 cm",
          "5.08 cm",
          "4.98 cm", 
          "5.00 cm"
        ],
        correctOption: 2,
        explanation: "LC = 0.01cm. Zero error = +0.1cm. Diameter = 5 + 8×0.01 - 0.1 = 4.98 cm",
        difficulty: 2
      },
      {
        text: "A parallel plate capacitor made of circular plates is being charged such that surface charge density increases at constant rate. The magnetic field arising due to displacement current is:",
        options: [
          "zero at all places",
          "constant between plates and zero outside", 
          "non-zero everywhere with maximum at cylindrical surface connecting plate peripheries",
          "zero between plates and non-zero outside"
        ],
        correctOption: 2,
        explanation: "Due to displacement current, B exists inside (∝ r) and outside (∝ 1/r). Maximum at r = R.",
        difficulty: 4
      },
      {
        text: "An unpolarized light beam in air is incident on a medium of refractive index 1.73 at Brewster's angle. Then-",
        options: [
          "reflected light is completely polarized and angle of reflection is close to 60°",
          "reflected light is partially polarized and angle of reflection is close to 30°",
          "both reflected and transmitted light are perfectly polarized",
          "transmitted light is completely polarized with angle of refraction close to 30°"
        ],
        correctOption: 0,
        explanation: "θₚ = tan⁻¹(1.73) = 60°. At Brewster's angle, reflected ray is completely polarized.",
        difficulty: 3
      },
      {
        text: "Two identical charged conducting spheres A and B have charge q each and force of repulsion F. A third uncharged sphere is touched to A, then B, then removed. New force of repulsion is:",
        options: [
          "3F/5",
          "2F/3",
          "F/2",
          "3F/8"
        ],
        correctOption: 3,
        explanation: "After contacts: A has q/2, B has 3q/4. New force = k(q/2)(3q/4)/r² = 3F/8",
        difficulty: 3
      },
      {
        text: "A container has two chambers: V₁ = 2L, V₂ = 3L with n₁ = 5 moles at p₁ = 1 atm and n₂ = 4 moles at p₂ = 2 atm. When partition is removed, equilibrium pressure is:",
        options: [
          "1.3 atm",
          "1.6 atm",
          "1.4 atm",
          "1.8 atm"
        ],
        correctOption: 1,
        explanation: "Pₑq(V₁ + V₂) = P₁V₁ + P₂V₂. Pₑq × 5 = 1×2 + 2×3 = 8. Pₑq = 1.6 atm",
        difficulty: 2
      },
      {
        text: "Using Bohr model for a particle of mass m moving around origin with constant inward force F, the radius r of nth orbit and speed v depend on n as:",
        options: [
          "r ∝ n¹/³ ; v ∝ n⁻¹/³",
          "r ∝ n¹/³ ; v ∝ n⁻²/³",
          "r ∝ n²/³ ; v ∝ n⁻¹/³",
          "r ∝ n⁴/³ ; v ∝ n⁻¹/³"
        ],
        correctOption: 2,
        explanation: "From F = mv²/r and mvr = nh/2π, get r³ ∝ n² so r ∝ n²/³ and v ∝ n⁻¹/³",
        difficulty: 4
      },
      {
        text: "A body weighs 48 N on earth's surface. At height h = R/3 above surface, gravitational force is:",
        options: [
          "16 N",
          "27 N", 
          "32 N",
          "36 N"
        ],
        correctOption: 1,
        explanation: "gₕ = g/(1 + h/R)² = g/(4/3)² = 9g/16. Weight = 48 × 9/16 = 27 N",
        difficulty: 2
      },
      {
        text: "A wire of resistance R is cut into 8 equal pieces. Four pieces are connected in parallel to make one set, four more to make another set. These two sets are connected in series. Net resistance is:",
        options: [
          "R/64",
          "R/32",
          "R/16",
          "R/8"
        ],
        correctOption: 2,
        explanation: "Each piece: R/8. Four in parallel: (R/8)/4 = R/32. Two sets in series: R/32 + R/32 = R/16",
        difficulty: 3
      },
      {
        text: "de-Broglie wavelength of electron in n = 2 state of hydrogen atom is close to (Bohr radius = 0.052 nm):",
        options: [
          "0.067 nm",
          "0.67 nm",
          "1.67 nm",
          "2.67 nm"
        ],
        correctOption: 1,
        explanation: "2πrₙ = nλ. For n = 2, r₂ = 4 × 0.052 = 0.208 nm. λ = 2π × 0.208/2 = 0.67 nm",
        difficulty: 3
      },
      {
        text: "Electric dipole with moment 5 × 10⁻⁶ Cm in field 4 × 10⁵ N/C is rotated from 0° to 60°. Change in potential energy is:",
        options: [
          "0.8 J",
          "1.0 J",
          "1.2 J", 
          "1.5 J"
        ],
        correctOption: 1,
        explanation: "ΔU = -pE(cos 60° - cos 0°) = -5×10⁻⁶ × 4×10⁵ × (0.5 - 1) = 1.0 J",
        difficulty: 2
      },
      {
        text: "A photon and electron have same energy E. Ratio of their de Broglie wavelengths λₚₕₒₜₒₙ/λₑₗₑcₜᵣₒₙ is:",
        options: [
          "√(E/2m)",
          "c√(2mE)",
          "c√(2m/E)",
          "1/√(E/2m)"
        ],
        correctOption: 2,
        explanation: "λₚₕₒₜₒₙ = hc/E, λₑₗₑcₜᵣₒₙ = h/√(2mE). Ratio = c√(2m/E)",
        difficulty: 4
      }
    ];

    console.log(`📝 Inserting ${physicsQuestions.length} physics questions...`);

    let insertedCount = 0;
    for (const questionData of physicsQuestions) {
      try {
        await db.insert(questions).values({
          topicId: generalTopic.id,
          text: questionData.text,
          options: questionData.options,
          correctOption: questionData.correctOption,
          explanation: questionData.explanation,
          difficultyLevel: questionData.difficulty,
          isPreviousYear: true,
          previousYearInfo: "NEET 2025 Physics - Code 45"
        });
        insertedCount++;
        console.log(`✅ Inserted question ${insertedCount}/${physicsQuestions.length}`);
      } catch (error) {
        console.error(`❌ Error inserting question: ${error.message}`);
      }
    }

    console.log(`🎉 Successfully inserted ${insertedCount} NEET 2025 Physics questions!`);
    
    // Verify total questions in database
    const allQuestions = await db.select().from(questions);
    console.log(`📊 Total questions in database: ${allQuestions.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
};

main();