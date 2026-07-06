const fs = require('fs');
const path = require('path');

const existing = require('../data/conditions.json');
const batch1 = require('../data/new-conditions-batch1.json');
const states = require('../data/states.json');

const existingNames = new Set(existing.map(c => c.name));
const batch1Names = new Set(batch1.map(c => c.name));
const batch1Slugs = new Set(batch1.map(c => c.slug));

// Find duplicates in batch1
const dupes = batch1.filter(c => existingNames.has(c.name));
console.log('Duplicates found in batch1:', dupes.map(c => c.name));
// Remove them
const cleaned = batch1.filter(c => !existingNames.has(c.name));
console.log('Cleaned batch1 size:', cleaned.length);

const allConditionNames = existing.map(c => c.name);

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const allStateNames = states.map(s => s.name);

function faq(condition) {
  return [
    { q: `What are ${condition} clinical trials?`, a: `${condition} clinical trials are research studies that test new treatments, medications, devices, or interventions for managing or treating ${condition.toLowerCase()}. They help determine the safety and effectiveness of potential new approaches.` },
    { q: `Who can participate in ${condition} clinical trials?`, a: `Eligibility varies by study. Factors include the type and severity of ${condition.toLowerCase()}, age, overall health status, and prior treatment history. Each study has specific inclusion and exclusion criteria.` },
    { q: `How much do ${condition} clinical trials pay?`, a: `Compensation depends on the study duration, number of visits, and procedures involved. Participants may receive payments ranging from $50 to $300 per visit, with total compensation varying by study.` },
    { q: `Are ${condition} clinical trials safe?`, a: `All clinical trials follow strict safety protocols and are reviewed by Institutional Review Boards (IRBs) to protect participants. Potential risks are explained during the informed consent process before enrollment.` }
  ];
}

const moreConditions = [
  // Replacement for removed duplicate "Fibromyalgia" - Skin/Allergy
  {
    name: "Hives", slug: "hives", icon: "🧴",
    description: "Hives, or urticaria, are raised, itchy welts on the skin caused by allergic reactions or other triggers. They can be acute or chronic and significantly impact quality of life. Clinical trials explore novel antihistamines, biologic therapies including omalizumab, and immune-modulating treatments for chronic spontaneous urticaria.",
    symptoms: "Raised red or skin-colored welts, intense itching, swelling that may come and go, round or ring-shaped welts, welts that change shape and size, burning or stinging sensation",
    riskFactors: "Allergies to foods, medications, or insect stings, stress, infections, autoimmune conditions, thyroid disease, physical triggers such as pressure, cold, heat, or exercise",
    treatment: "Treatment includes antihistamines, corticosteroids, and omalizumab for chronic cases. Clinical trials study Bruton tyrosine kinase inhibitors and novel biologic therapies for refractory urticaria.",
    whyParticipate: "Hives clinical trials provide access to next-generation treatments for chronic urticaria that does not respond to standard antihistamines.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Hives"),
    category: "Dermatology"
  },
  // Replacement for removed duplicate "Cataracts" - Dental
  {
    name: "Periodontitis", slug: "periodontitis", icon: "🦷",
    description: "Periodontitis is a serious gum infection that damages the soft tissue and bone supporting teeth, potentially leading to tooth loss. Clinical trials explore novel antimicrobial therapies, regenerative procedures, laser treatments, and host-modulation approaches.",
    symptoms: "Swollen, red, or tender gums, bleeding while brushing or flossing, receding gums, loose teeth, persistent bad breath, pus between teeth and gums, painful chewing, changes in bite alignment",
    riskFactors: "Poor oral hygiene, smoking, diabetes, genetic susceptibility, certain medications, hormonal changes in women, immunodeficiency, stress, poor nutrition",
    treatment: "Treatment includes scaling and root planing, antibiotics, and surgical procedures for advanced cases. Clinical trials study locally delivered antimicrobials, regenerative materials, and laser-assisted treatments.",
    whyParticipate: "Periodontitis trials provide access to advanced regenerative treatments and non-surgical approaches for gum disease.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Periodontitis"),
    category: "Infectious Disease"
  },
  // Replacement for removed duplicate "Macular Degeneration" - Neurological
  {
    name: "Tinnitus", slug: "tinnitus", icon: "👂",
    description: "Tinnitus is the perception of noise or ringing in the ears without an external sound source, affecting millions worldwide. Clinical trials explore sound therapy, cognitive behavioral therapy, neuromodulation devices, medications targeting neural pathways, and hearing aid innovations.",
    symptoms: "Ringing, buzzing, roaring, clicking, hissing, or whistling sounds in one or both ears, sounds that may be constant or intermittent, varying volume, difficulty concentrating, sleep disturbances, anxiety or depression",
    riskFactors: "Age-related hearing loss, noise exposure, earwax buildup, ear infections, Meniere disease, certain medications, head or neck injuries, cardiovascular conditions, smoking",
    treatment: "Treatment includes sound therapy, hearing aids, CBT, and lifestyle modifications. Clinical trials study bimodal neuromodulation, transcranial magnetic stimulation, and pharmacological approaches targeting neural plasticity.",
    whyParticipate: "Tinnitus trials offer access to innovative neuromodulation devices and therapies that may reduce or eliminate phantom sounds.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Tinnitus"),
    category: "Neurology"
  },
  // --- Mental Health additions ---
  {
    name: "Body Dysmorphic Disorder", slug: "body-dysmorphic-disorder", icon: "🧠",
    description: "Body dysmorphic disorder is a mental health condition characterized by an obsessive focus on perceived flaws in appearance that are minor or not observable to others. Clinical trials explore selective serotonin reuptake inhibitors, cognitive-behavioral therapy adaptations, and neuromodulation approaches.",
    symptoms: "Constant preoccupation with one or more perceived defects in appearance, repetitive behaviors such as mirror checking or skin picking, comparing appearance to others, seeking reassurance, avoiding social situations, difficulty concentrating, low self-esteem",
    riskFactors: "Family history, childhood abuse or neglect, social pressures around appearance, perfectionism, being bullied or teased, certain personality traits",
    treatment: "Treatment includes SSRIs and CBT with exposure and response prevention. Clinical trials study augmentation strategies with glutamatergic agents and transcranial magnetic stimulation targeting the orbitofrontal cortex.",
    whyParticipate: "BDD clinical trials provide access to targeted therapies for this underrecognized condition that causes significant distress.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Body Dysmorphic Disorder"),
    category: "Mental Health"
  },
  {
    name: "Hoarding Disorder", slug: "hoarding-disorder", icon: "🧠",
    description: "Hoarding disorder is a persistent difficulty discarding possessions regardless of their actual value, leading to cluttered living spaces and significant distress. Clinical trials explore cognitive-behavioral therapy protocols, pharmacotherapy with SSRIs, and digital intervention delivery methods.",
    symptoms: "Persistent difficulty throwing away possessions, severe anxiety when discarding items, inability to organize possessions, accumulation of items to the point of unusable rooms, social isolation, conflict with family and neighbors",
    riskFactors: "Family history, age over 50, chronic indecisiveness, perfectionism, procrastination, traumatic life events, social isolation",
    treatment: "Treatment includes CBT specifically designed for hoarding. Clinical trials study group therapy approaches, digital CBT programs, and augmentation with SSRIs or stimulants.",
    whyParticipate: "Hoarding disorder trials provide access to specialized CBT interventions and digital tools for reducing clutter and improving quality of life.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Hoarding Disorder"),
    category: "Mental Health"
  },
  {
    name: "Seasonal Affective Disorder", slug: "seasonal-affective-disorder", icon: "☀️",
    description: "Seasonal affective disorder is a type of depression related to changes in seasons, typically occurring during fall and winter. Clinical trials explore light therapy optimization, dawn simulators, agomelatine, cognitive-behavioral therapy, and vitamin D supplementation.",
    symptoms: "Feeling depressed most of the day, loss of interest in activities, low energy, oversleeping, carbohydrate cravings and weight gain, difficulty concentrating, feelings of hopelessness, social withdrawal",
    riskFactors: "Female sex, younger age, family history, living far from the equator, existing depression or bipolar disorder, low vitamin D levels",
    treatment: "Treatment includes light therapy, antidepressants, psychotherapy, and vitamin D supplementation. Clinical trials study novel chronotherapeutic interventions and dawn simulation devices.",
    whyParticipate: "SAD trials provide access to innovative light therapy devices and chronobiological treatments for winter depression.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Seasonal Affective Disorder"),
    category: "Mental Health"
  },
  {
    name: "Premenstrual Dysphoric Disorder", slug: "pmdd", icon: "🩺",
    description: "Premenstrual dysphoric disorder is a severe form of premenstrual syndrome causing debilitating emotional and physical symptoms in the luteal phase of the menstrual cycle. Clinical trials explore SSRIs, hormonal contraceptives, GnRH analogs, and novel neurosteroid modulators.",
    symptoms: "Severe mood swings, irritability, depression or hopelessness, anxiety and tension, marked anger, decreased interest in usual activities, difficulty concentrating, fatigue, appetite changes, sleep disturbances, feeling overwhelmed",
    riskFactors: "Family history, personal history of mood disorders, stress, age late 20s to early 40s, history of postpartum depression",
    treatment: "Treatment includes SSRIs, hormonal contraceptives, and lifestyle interventions. Clinical trials study GABAergic neurosteroids and GnRH antagonist add-back therapy protocols.",
    whyParticipate: "PMDD trials provide access to targeted treatments that address the unique neuroendocrine basis of this condition.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("PMDD"),
    category: "Women's Health"
  },
  // --- Orthopedics ---
  {
    name: "Frozen Shoulder", slug: "frozen-shoulder", icon: "💪",
    description: "Frozen shoulder, or adhesive capsulitis, is a condition causing stiffness and pain in the shoulder joint that gradually progresses and can take years to resolve. Clinical trials explore physical therapy protocols, corticosteroid injections, hydrodilatation, manipulation under anesthesia, and arthroscopic release techniques.",
    symptoms: "Dull or aching shoulder pain, stiffness making it difficult to move the shoulder, limited range of motion in all directions, difficulty with daily activities like dressing or reaching, pain that may worsen at night",
    riskFactors: "Age 40-60, female sex, diabetes, thyroid disorders, previous shoulder injury or surgery, cardiovascular disease, immobilization after injury or surgery",
    treatment: "Treatment includes physical therapy, NSAIDs, corticosteroid injections, and in severe cases, manipulation or arthroscopic release. Clinical trials study hyaluronic acid injections and nerve blocks for pain management.",
    whyParticipate: "Frozen shoulder trials offer access to advanced physical therapy protocols and innovative injection therapies for faster recovery.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Frozen Shoulder"),
    category: "Orthopedics"
  },
  {
    name: "Tennis Elbow", slug: "tennis-elbow", icon: "💪",
    description: "Tennis elbow, or lateral epicondylitis, is a painful condition caused by overuse of the forearm muscles and tendons. Clinical trials explore PRP injections, corticosteroid injections, shockwave therapy, novel orthotic devices, and minimally invasive tenotomy techniques.",
    symptoms: "Pain and tenderness on the outside of the elbow, stiffness in the morning, weak grip strength, pain that worsens with gripping or twisting motions, radiating pain down the forearm",
    riskFactors: "Repetitive arm movements, age 30-50, occupations involving manual labor or typing, racket sports, improper technique in sports, poor equipment",
    treatment: "Treatment includes rest, ice, physical therapy, bracing, and NSAIDs. Clinical trials study regenerative injection therapies and focused extracorporeal shockwave therapy.",
    whyParticipate: "Tennis elbow trials provide access to regenerative treatments including PRP and stem cell therapies for tendon healing.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Tennis Elbow"),
    category: "Orthopedics"
  },
  {
    name: "Bunions", slug: "bunions", icon: "🦶",
    description: "Bunions are bony bumps that form on the joint at the base of the big toe, causing pain and difficulty wearing shoes. Clinical trials explore minimally invasive bunionectomy techniques, orthotic innovations, and novel osteotomy fixation methods.",
    symptoms: "Bony bump at the base of the big toe, swelling and redness around the joint, big toe leaning toward the other toes, persistent or intermittent pain, calluses on the bottom of the foot, difficulty moving the big toe",
    riskFactors: "Inherited foot structure, wearing narrow or high-heeled shoes, female sex, arthritis, flexible flatfeet, congenital foot deformities",
    treatment: "Treatment includes proper footwear, orthotics, padding, and NSAIDs. Clinical trials study minimally invasive surgical techniques with faster recovery and improved fixation devices.",
    whyParticipate: "Bunion trials offer access to less invasive surgical approaches and advanced orthotic interventions.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Bunions"),
    category: "Orthopedics"
  },
  {
    name: "Golfer Elbow", slug: "golfer-elbow", icon: "💪",
    description: "Golfer elbow, or medial epicondylitis, is pain and inflammation on the inner side of the elbow caused by overuse of the wrist flexor muscles. Clinical trials explore eccentric strengthening protocols, PRP injections, dry needling, and surgical release techniques.",
    symptoms: "Pain and tenderness on the inner elbow, stiffness, weakness in the hand and wrist, tingling or numbness in the ring and little fingers, pain when flexing the wrist or gripping",
    riskFactors: "Repetitive wrist flexion activities, golfing, throwing sports, weightlifting, occupations requiring repeated wrist movements, age 40-60",
    treatment: "Treatment includes rest, ice, physical therapy, and NSAIDs. Clinical trials study regenerative injection therapies and novel rehabilitation protocols.",
    whyParticipate: "Golfer elbow trials provide access to cutting-edge rehabilitation and regenerative medicine approaches for chronic tendonitis.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Golfer Elbow"),
    category: "Orthopedics"
  },
  // --- Sleep ---
  {
    name: "Bruxism", slug: "bruxism", icon: "🦷",
    description: "Bruxism is involuntary grinding or clenching of teeth, often during sleep, causing tooth damage and jaw pain. Clinical trials explore intraoral appliances, biofeedback devices, botulinum toxin injections, and pharmacological interventions targeting the central nervous system.",
    symptoms: "Loud grinding or clenching sounds during sleep, worn flattened teeth, tooth sensitivity or pain, jaw tiredness or tightness, earache-like pain, headache, facial pain, damage to the inside of the cheek",
    riskFactors: "Stress and anxiety, sleep disorders, certain medications including SSRIs, caffeine and alcohol, smoking, family history, age, certain neurological conditions",
    treatment: "Treatment includes mouthguards, stress management, and biofeedback. Clinical trials study botulinum toxin injections and targeted pharmacotherapies for nocturnal bruxism.",
    whyParticipate: "Bruxism trials provide access to innovative biofeedback devices and treatments that prevent long-term dental damage.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Bruxism"),
    category: "Sleep"
  },
  {
    name: "Shift Work Sleep Disorder", slug: "shift-work-sleep-disorder", icon: "🌙",
    description: "Shift work sleep disorder is a circadian rhythm sleep disorder affecting people who work non-traditional hours, causing insomnia and excessive sleepiness. Clinical trials explore melatonin modulation, timed light exposure, wake-promoting agents, and sleep scheduling interventions.",
    symptoms: "Excessive sleepiness during work shifts, difficulty falling asleep or staying asleep during off hours, lack of energy, difficulty concentrating, irritability, depression, poor job performance, increased accidents",
    riskFactors: "Working night shifts, rotating shifts, early morning shifts, evening chronotype for early shifts, morning chronotype for night shifts, age over 50",
    treatment: "Treatment includes strategic light exposure, melatonin, wake-promoting medications such as modafinil, and consistent sleep scheduling. Clinical trials study novel orexin receptor antagonists and chronotherapeutic interventions.",
    whyParticipate: "Shift work disorder trials provide access to wake-promoting medications and light therapy protocols that improve alertness and sleep quality.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Shift Work Sleep Disorder"),
    category: "Sleep"
  },
  {
    name: "Narcolepsy Type 1", slug: "narcolepsy-type-1", icon: "😴",
    description: "Narcolepsy type 1 is a chronic sleep disorder causing overwhelming daytime drowsiness and sudden sleep attacks due to loss of hypocretin-producing neurons. Clinical trials explore orexin receptor agonists, histamine H3 receptor antagonists, and novel wake-promoting agents.",
    symptoms: "Excessive daytime sleepiness, cataplexy sudden loss of muscle tone triggered by strong emotions, sleep paralysis, hallucinations when falling asleep or waking, disrupted nighttime sleep, automatic behaviors during microsleeps",
    riskFactors: "Family history, autoimmune disorders, certain infections including H1N1, head trauma, genetic predisposition with HLA-DQB1*06:02 allele",
    treatment: "Treatment includes modafinil, amphetamines, sodium oxybate, and antidepressants for cataplexy. Clinical trials study orexin receptor agonists that may address the underlying hypocretin deficiency.",
    whyParticipate: "Narcolepsy trials provide access to hypocretin replacement therapies that target the root cause of the condition.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Narcolepsy Type 1"),
    category: "Neurology"
  },
  // --- Hematology ---
  {
    name: "Polycythemia Vera", slug: "polycythemia-vera", icon: "🩸",
    description: "Polycythemia vera is a rare blood cancer causing excessive red blood cell production, increasing blood thickness and risk of clots. Clinical trials explore JAK2 inhibitors, interferon therapies, and novel agents targeting mutant hematopoietic stem cells.",
    symptoms: "Headache, dizziness, blurred vision, pruritus especially after warm baths, fatigue, shortness of breath, ringing in the ears, visual disturbances, high blood pressure, redness or purple color of the skin",
    riskFactors: "Age over 60, male sex, JAK2 V617F mutation, family history of myeloproliferative neoplasms, certain genetic polymorphisms",
    treatment: "Treatment includes phlebotomy, low-dose aspirin, and cytoreductive therapy with hydroxyurea or interferon. Clinical trials study JAK2 inhibitors and mutant calreticulin targeting approaches.",
    whyParticipate: "Polycythemia vera trials provide access to novel JAK2 inhibitors and disease-modifying therapies that reduce clot risk and symptom burden.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Polycythemia Vera"),
    category: "Hematology"
  },
  {
    name: "Thrombocytopenia", slug: "thrombocytopenia", icon: "🩸",
    description: "Thrombocytopenia is a condition of low platelet count, increasing the risk of bleeding and bruising. Clinical trials explore thrombopoietin receptor agonists, novel immunomodulatory agents, and spleen tyrosine kinase inhibitors for immune thrombocytopenia.",
    symptoms: "Easy or excessive bruising, superficial bleeding into the skin as pinpoints, prolonged bleeding from cuts, spontaneous bleeding from gums or nose, blood in urine or stool, heavy menstrual bleeding, fatigue",
    riskFactors: "Autoimmune conditions, certain medications, infections, heavy alcohol use, bone marrow disorders, family history, pregnancy, chemotherapy",
    treatment: "Treatment depends on cause and includes corticosteroids, IVIG, TPO receptor agonists, and splenectomy. Clinical trials study novel oral TPO agonists and BTK inhibitors for ITP.",
    whyParticipate: "Thrombocytopenia trials provide access to next-generation platelet-boosting therapies with improved safety profiles.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Thrombocytopenia"),
    category: "Hematology"
  },
  {
    name: "Hemochromatosis", slug: "hemochromatosis", icon: "🩸",
    description: "Hemochromatosis is a genetic disorder causing excessive absorption of dietary iron, leading to iron overload and organ damage. Clinical trials explore novel iron chelators, hepcidin analogs, and phlebotomy alternatives for managing iron levels.",
    symptoms: "Fatigue, weakness, joint pain especially in the knuckles, abdominal pain, loss of libido, impotence, heart palpitations, skin bronzing, diabetes, liver enlargement, hypothyroidism",
    riskFactors: "Family history, Northern European ancestry, C282Y and H63D HFE gene mutations, male sex for earlier onset, excessive dietary iron or vitamin C, alcohol consumption",
    treatment: "Treatment includes therapeutic phlebotomy and iron chelation for severe cases. Clinical trials study hepcidin mimetics and novel oral chelators that may replace phlebotomy.",
    whyParticipate: "Hemochromatosis trials offer access to hepcidin-based therapies that may improve iron management without frequent phlebotomy.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Hemochromatosis"),
    category: "Hematology"
  },
  // --- Pulmonology ---
  {
    name: "Pulmonary Hypertension", slug: "pulmonary-hypertension", icon: "🫁",
    description: "Pulmonary hypertension is high blood pressure in the arteries of the lungs, causing shortness of breath and right heart strain. Clinical trials explore prostacyclin analogs, endothelin receptor antagonists, PDE5 inhibitors, and novel combination therapies targeting the pulmonary vasculature.",
    symptoms: "Shortness of breath during activity, fatigue, chest pain, rapid heartbeat, dizziness or fainting, swelling in ankles and legs, bluish lips or skin, racing pulse",
    riskFactors: "Family history, connective tissue diseases, congenital heart disease, liver disease, HIV infection, certain diet pills or drugs, sleep apnea, chronic lung disease",
    treatment: "Treatment includes vasodilators, endothelin receptor antagonists, PDE5 inhibitors, and prostacyclin therapies. Clinical trials study novel implantable drug delivery systems combination PAH therapies.",
    whyParticipate: "Pulmonary hypertension trials provide access to advanced vasodilator therapies and innovative drug delivery methods.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Pulmonary Hypertension"),
    category: "Pulmonology"
  },
  {
    name: "Lung Nodules", slug: "lung-nodules", icon: "🫁",
    description: "Lung nodules are small growths in the lung detected on imaging scans, which may be benign or early cancer. Clinical trials explore novel diagnostic biomarkers, risk stratification models, navigational bronchoscopy innovations, and minimally invasive biopsy techniques.",
    symptoms: "Most lung nodules cause no symptoms and are found incidentally on imaging; larger nodules may cause cough, chest pain, shortness of breath, wheezing, coughing up blood",
    riskFactors: "Smoking, age over 50, family history of lung cancer, previous cancer, exposure to asbestos or radon, chronic lung disease, occupational exposures",
    treatment: "Treatment depends on nodule size and characteristics and includes surveillance imaging, biopsy, and surgical removal if suspicious. Clinical trials study biomarker-based risk stratification and advanced bronchoscopic navigation.",
    whyParticipate: "Lung nodule trials provide access to advanced diagnostic techniques that may reduce unnecessary invasive procedures.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Lung Nodules"),
    category: "Pulmonology"
  },
  // --- Infectious Disease additional ---
  {
    name: "Septicemia", slug: "septicemia", icon: "🦠",
    description: "Septicemia is a serious bloodstream infection that can lead to sepsis, a life-threatening response to infection. Clinical trials explore rapid diagnostic technologies, novel antibiotics for resistant organisms, anti-inflammatory agents for sepsis management, and immunotherapy approaches.",
    symptoms: "Fever and chills, rapid breathing and heart rate, confusion or disorientation, severe pain or discomfort, clammy or sweaty skin, low blood pressure, decreased urine output",
    riskFactors: "Age over 65 or under 1, weakened immune system, chronic medical conditions, recent surgery or hospitalization, indwelling catheters or devices, recent infection, ICU stay",
    treatment: "Treatment includes broad-spectrum antibiotics, fluid resuscitation, and vasopressors. Clinical trials study novel rapid diagnostic panels and targeted immunomodulatory therapies to improve sepsis outcomes.",
    whyParticipate: "Septicemia trials contribute to the development of rapid diagnostics and targeted treatments for this time-critical condition.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Septicemia"),
    category: "Infectious Disease"
  },
  {
    name: "Tetanus", slug: "tetanus", icon: "🦠",
    description: "Tetanus is a serious bacterial infection causing painful muscle contractions and rigidity, typically through contaminated wounds. Clinical trials explore improved vaccines, immunoglobulin therapies, and new approaches to wound management and prevention.",
    symptoms: "Jaw cramping or lockjaw, sudden involuntary muscle spasms, stiffness in neck and abdominal muscles, difficulty swallowing, fever, sweating, rapid heart rate, headache",
    riskFactors: "Inadequate vaccination, deep puncture wounds, contaminated wounds, age over 60, immunosuppression, diabetes, intravenous drug use",
    treatment: "Treatment includes tetanus immune globulin, wound care, antibiotics, and supportive care for muscle spasms. Clinical trials study novel vaccine formulations and longer-lasting monoclonal antibody prophylaxis.",
    whyParticipate: "Tetanus trials provide access to advanced vaccine technologies and antibody-based preventative treatments.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Tetanus"),
    category: "Infectious Disease"
  },
  {
    name: "Rocky Mountain Spotted Fever", slug: "rocky-mountain-spotted-fever", icon: "🦟",
    description: "Rocky Mountain spotted fever is a serious tick-borne bacterial infection causing fever, headache, and a characteristic rash. Clinical trials explore improved diagnostic tests, optimal antibiotic regimens, and vaccine development approaches.",
    symptoms: "High fever, severe headache, muscle aches, nausea and vomiting, abdominal pain, red spotted rash starting on wrists and ankles, sensitivity to light, confusion in severe cases",
    riskFactors: "Outdoor activities in tick-endemic areas, living in southeastern US, spring and summer months, contact with dogs, failure to remove ticks promptly",
    treatment: "Treatment includes doxycycline, which is highly effective when started early. Clinical trials study rapid PCR-based diagnostics and alternative antibiotics for pregnant patients.",
    whyParticipate: "Rocky Mountain spotted fever trials contribute to improved diagnostics and vaccine development for this potentially fatal infection.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Rocky Mountain Spotted Fever"),
    category: "Infectious Disease"
  },
  // --- Dental/Oral Health ---
  {
    name: "Gingivitis", slug: "gingivitis", icon: "🦷",
    description: "Gingivitis is a common mild form of gum disease causing irritation, redness, and swelling of the gums, which is reversible with good oral hygiene. Clinical trials explore novel mouth rinses, probiotic formulations, ultrasonic scaling technologies, and anti-inflammatory treatments.",
    symptoms: "Swollen or puffy gums, dusky red or dark red gums, gums that bleed easily when brushing or flossing, bad breath, tender gums, receding gums",
    riskFactors: "Poor oral hygiene, smoking or chewing tobacco, dry mouth, dental restorations that fit poorly, certain medications, hormonal changes, crooked teeth, genetic susceptibility",
    treatment: "Treatment includes improved oral hygiene, professional dental cleaning, and antimicrobial mouth rinses. Clinical trials study probiotic oral health supplements and novel anti-gingivitis compounds.",
    whyParticipate: "Gingivitis trials provide access to advanced oral care products and non-invasive treatments for gum inflammation.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Gingivitis"),
    category: "Infectious Disease"
  },
  // --- Pain Management ---
  {
    name: "Postherpetic Neuralgia", slug: "postherpetic-neuralgia", icon: "💥",
    description: "Postherpetic neuralgia is a complication of shingles causing persistent nerve pain that can last months or years after the rash heals. Clinical trials explore topical lidocaine and capsaicin and gabapentinoids, nerve blocks, spinal cord stimulation, and novel pain modulators.",
    symptoms: "Burning, sharp, or aching pain in the area where the shingles rash occurred, extreme sensitivity to touch, numbness, itching, headache, fatigue, sleep disturbance",
    riskFactors: "Age over 60, severe shingles rash, pain during acute shingles phase, location on forehead or eye area, weakened immune system, chronic medical conditions",
    treatment: "Treatment includes gabapentinoids, tricyclic antidepressants, lidocaine patches, and capsaicin patches. Clinical trials study nerve growth factor antibodies and novel sodium channel blockers for neuropathic pain.",
    whyParticipate: "Postherpetic neuralgia trials provide access to advanced neuropathic pain treatments and novel topical formulations.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Postherpetic Neuralgia"),
    category: "Pain Management"
  },
  {
    name: "Trigeminal Neuralgia", slug: "trigeminal-neuralgia", icon: "🤕",
    description: "Trigeminal neuralgia is a chronic pain condition affecting the trigeminal nerve, causing severe facial pain triggered by routine activities. Clinical trials explore anticonvulsants, nerve block techniques, gamma knife radiosurgery, microvascular decompression innovations, and neuromodulation approaches.",
    symptoms: "Sudden, severe, electric shock-like facial pain on one side, pain triggered by touch, chewing, speaking, or brushing teeth, attacks lasting seconds to minutes, aching or burning between attacks, pain in cheeks, jaw, teeth, gums, or lips",
    riskFactors: "Female sex, age over 50, family history, multiple sclerosis, high blood pressure",
    treatment: "Treatment includes carbamazepine, oxcarbazepine, gabapentin, and surgical options such as microvascular decompression and gamma knife radiosurgery. Clinical trials study novel sodium channel blockers and noninvasive neuromodulation.",
    whyParticipate: "Trigeminal neuralgia trials provide access to advanced surgical and neuromodulatory treatments for severe facial pain.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Trigeminal Neuralgia"),
    category: "Neurology"
  },
  // --- Gastroenterology ---
  {
    name: "Constipation", slug: "constipation", icon: "🫃",
    description: "Constipation is a common digestive condition characterized by infrequent bowel movements or difficulty passing stool, affecting quality of life. Clinical trials explore novel secretagogues, probiotics, fiber supplements, biofeedback therapy, and neuromodulation for chronic constipation.",
    symptoms: "Fewer than three bowel movements per week, hard or lumpy stools, straining during bowel movements, feeling of incomplete evacuation, abdominal bloating and discomfort, rectal blockage sensation",
    riskFactors: "Low-fiber diet, inadequate fluid intake, sedentary lifestyle, ignoring the urge to have a bowel movement, certain medications, pregnancy, aging, medical conditions such as IBS or diabetes",
    treatment: "Treatment includes dietary fiber, increased fluids, exercise, and over-the-counter laxatives. Clinical trials study guanylate cyclase-C agonists and microbiome-based interventions.",
    whyParticipate: "Constipation trials provide access to novel medications that improve bowel regularity with fewer side effects than traditional laxatives.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Constipation"),
    category: "Gastroenterology"
  },
  {
    name: "Lactose Intolerance", slug: "lactose-intolerance", icon: "🥛",
    description: "Lactose intolerance is a digestive disorder where the body cannot properly digest lactose, the sugar in milk and dairy products, causing gastrointestinal distress. Clinical trials explore lactase enzyme supplements, probiotic formulations, prebiotic compounds, and genetically modified dairy alternatives.",
    symptoms: "Bloating, abdominal cramps and pain, gas, diarrhea, nausea, borborygmi stomach growling, vomiting in severe cases, symptoms starting 30 minutes to 2 hours after consuming dairy",
    riskFactors: "Age, ethnicity with higher prevalence in Asian African and Hispanic populations, family history, prematurity, small intestine conditions such as Celiac disease or Crohn disease, chemotherapy or radiation to the abdomen",
    treatment: "Treatment includes dietary avoidance, lactase enzyme supplements, and lactose-free dairy products. Clinical trials study novel lactase formulations and microbiome modulation to improve lactose tolerance.",
    whyParticipate: "Lactose intolerance trials provide access to next-generation enzyme supplements and dietary interventions for improved dairy tolerance.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Lactose Intolerance"),
    category: "Gastroenterology"
  },
  // --- Renal / Nephrology ---
  {
    name: "Acute Kidney Injury", slug: "acute-kidney-injury", icon: "🫘",
    description: "Acute kidney injury is a sudden episode of kidney failure or damage occurring over hours to days, often in hospitalized patients. Clinical trials explore biomarkers for early detection, nephroprotective agents, renal replacement therapy innovations, and strategies to prevent progression to chronic kidney disease.",
    symptoms: "Decreased urine output, fluid retention causing swelling, shortness of breath, fatigue, confusion, nausea, weak or irregular heartbeat, chest pain or pressure, seizures in severe cases",
    riskFactors: "Sepsis, major surgery, diabetes, hypertension, age over 65, preexisting kidney disease, certain medications, radiocontrast exposure, volume depletion, heart failure",
    treatment: "Treatment addresses the underlying cause and includes fluid management, electrolyte correction, and dialysis for severe cases. Clinical trials study biomarkers for early detection and novel nephroprotective agents.",
    whyParticipate: "AKI trials contribute to the development of early detection biomarkers and treatments that may prevent long-term kidney damage.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Acute Kidney Injury"),
    category: "Nephrology"
  },
  // -- Cardiology ---
  {
    name: "Hypertrophic Cardiomyopathy", slug: "hypertrophic-cardiomyopathy", icon: "❤️",
    description: "Hypertrophic cardiomyopathy is a genetic heart condition where the heart muscle becomes abnormally thick, making it harder for the heart to pump blood. Clinical trials explore cardiac myosin inhibitors, septal reduction therapies, implantable cardioverter-defibrillators, and gene therapies.",
    symptoms: "Shortness of breath especially during exercise, chest pain, heart palpitations, fainting especially during or after activity, fatigue, swelling in legs and feet, heart murmur",
    riskFactors: "Family history, genetic mutations in sarcomere genes, autosomal dominant inheritance, higher prevalence with certain ethnic backgrounds",
    treatment: "Treatment includes beta-blockers, calcium channel blockers, and surgical myectomy or alcohol septal ablation. Clinical trials study novel myosin ATPase inhibitors and gene therapy approaches.",
    whyParticipate: "Hypertrophic cardiomyopathy trials provide access to targeted myosin inhibitors and potential gene therapies.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Hypertrophic Cardiomyopathy"),
    category: "Cardiology"
  },
  {
    name: "Myocarditis", slug: "myocarditis", icon: "❤️",
    description: "Myocarditis is inflammation of the heart muscle, often caused by viral infections, reducing the heart's ability to pump blood. Clinical trials explore immunosuppressive therapies, antiviral medications, and advanced imaging techniques for diagnosis and monitoring.",
    symptoms: "Chest pain, shortness of breath, fatigue, rapid or irregular heartbeat, fever, signs of heart failure including swelling, reduced ability to exercise, flu-like symptoms including headache and muscle aches",
    riskFactors: "Recent viral infection, certain medications, autoimmune disorders, illicit drug use, heavy alcohol consumption, exposure to certain toxins",
    treatment: "Treatment includes heart failure medications, antiarrhythmics, and immunosuppression for certain types. Clinical trials study antiviral agents and advanced immunomodulation protocols.",
    whyParticipate: "Myocarditis trials provide access to targeted anti-inflammatory and antiviral treatments that may preserve heart function.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Myocarditis"),
    category: "Cardiology"
  },
  // --- Endocrinology ---
  {
    name: "Hyperthyroidism", slug: "hyperthyroidism", icon: "🦋",
    description: "Hyperthyroidism is a condition where the thyroid gland produces excessive thyroid hormone, accelerating the body's metabolism and causing a range of symptoms. Clinical trials explore novel antithyroid drugs, radioactive iodine optimization, TSH receptor antagonists, and improved surgical outcomes.",
    symptoms: "Rapid or irregular heartbeat, unexplained weight loss, increased appetite, anxiety, irritability, tremors, heat intolerance, increased sweating, frequent bowel movements, bulging eyes, fatigue, sleep disturbances",
    riskFactors: "Female sex, family history, autoimmune conditions including Graves disease, type 1 diabetes, age 20-40, iodine intake, smoking, pregnancy",
    treatment: "Treatment includes antithyroid drugs, radioactive iodine ablation, and thyroidectomy. Clinical trials study TSH receptor antagonists and immune tolerance induction for Graves disease.",
    whyParticipate: "Hyperthyroidism trials provide access to targeted thyroid receptor antagonists and immune-modulating therapies.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Hyperthyroidism"),
    category: "Endocrinology"
  },
  {
    name: "Hypothyroidism", slug: "hypothyroidism", icon: "🦋",
    description: "Hypothyroidism is a condition where the thyroid gland does not produce enough thyroid hormone, slowing the body's metabolism. Clinical trials explore novel levothyroxine formulations, combination T3/T4 therapies, thyroid cell regeneration, and personalized dosing algorithms.",
    symptoms: "Fatigue, weight gain, cold intolerance, constipation, dry skin, thinning hair, muscle aches, depression, memory problems, heavy or irregular menstrual periods, slowed heart rate, puffy face",
    riskFactors: "Female sex, age over 60, family history, autoimmune conditions such as Hashimoto thyroiditis, type 1 diabetes, certain medications, iodine deficiency, pituitary disorders",
    treatment: "Treatment includes levothyroxine T4 replacement. Clinical trials study sustained-release T3 formulations and tissue-specific thyroid hormone modulators.",
    whyParticipate: "Hypothyroidism trials provide access to advanced thyroid hormone formulations that may improve symptom management.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Hypothyroidism"),
    category: "Endocrinology"
  },
  // --- Autoimmune ---
  {
    name: "Raynaud Phenomenon", slug: "raynaud-phenomenon", icon: "🧊",
    description: "Raynaud phenomenon is a condition causing blood vessels in fingers and toes to overreact to cold or stress, turning them white or blue. Clinical trials explore calcium channel blockers, vasodilators, prostacyclin analogs, and novel endothelin receptor antagonists.",
    symptoms: "Fingers or toes turning white then blue upon cold exposure or stress, numbness or tingling upon warming, throbbing pain during rewarming, color changes in ears, nose, or nipples, skin ulcers in severe cases",
    riskFactors: "Female sex, age 15-30, family history, living in cold climates, connective tissue diseases such as scleroderma or lupus, certain medications including beta-blockers, occupational hand vibration",
    treatment: "Treatment includes avoiding cold, calcium channel blockers, and vasodilators. Clinical trials study topical nitrates, botulinum toxin injections, and phosphodiesterase inhibitors.",
    whyParticipate: "Raynaud trials provide access to novel vasodilator therapies and treatments that prevent digital ulcers in severe cases.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Raynaud Phenomenon"),
    category: "Rheumatology"
  },
  {
    name: "Sjogren Syndrome", slug: "sjogren-syndrome", icon: "🩺",
    description: "Sjogren syndrome is an autoimmune disorder characterized by dry eyes and dry mouth, often occurring with other rheumatic diseases. Clinical trials explore immunomodulators, B-cell targeting therapies, and novel treatments for glandular function restoration.",
    symptoms: "Dry eyes with gritty or burning sensation, dry mouth causing difficulty swallowing or speaking, joint pain and stiffness, swollen salivary glands, dry cough, fatigue, vaginal dryness, skin rashes, numbness or tingling in extremities",
    riskFactors: "Female sex, age 40-60, family history, other autoimmune diseases including rheumatoid arthritis or lupus",
    treatment: "Treatment includes artificial tears saliva substitutes and immunosuppressants. Clinical trials study hydroxychloroquine, rituximab, and novel B-cell-targeting agents.",
    whyParticipate: "Sjogren syndrome trials provide access to targeted biologic therapies addressing the underlying autoimmune process.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Sjogren Syndrome"),
    category: "Rheumatology"
  },
  // --- Gastroenterology ---
  {
    name: "Gastritis", slug: "gastritis", icon: "🫃",
    description: "Gastritis is inflammation of the stomach lining that can be acute or chronic, caused by infection, medications, or immune factors. Clinical trials explore Helicobacter pylori eradication regimens, mucosal protective agents, and novel anti-inflammatory treatments.",
    symptoms: "Gnawing or burning pain in the upper abdomen, nausea, vomiting, feeling of fullness after eating, loss of appetite, weight loss, black or tarry stools from bleeding, bloating",
    riskFactors: "Helicobacter pylori infection, regular NSAID use, excessive alcohol consumption, stress, age, autoimmune conditions, bile reflux, smoking, severe illness",
    treatment: "Treatment includes acid reducers, antibiotics for H pylori, and avoiding triggers. Clinical trials study novel H pylori eradication protocols and mucosal healing agents.",
    whyParticipate: "Gastritis trials provide access to improved treatments for H pylori eradication and stomach lining protection.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Gastritis"),
    category: "Gastroenterology"
  },
  // --- Pulmonary ---
  {
    name: "Pleural Effusion", slug: "pleural-effusion", icon: "🫁",
    description: "Pleural effusion is the buildup of excess fluid between the layers of tissue lining the lungs and chest cavity, causing breathing difficulty. Clinical trials explore improved drainage techniques, pleurodesis agents, indwelling pleural catheter innovations, and treatments for underlying causes.",
    symptoms: "Shortness of breath, chest pain especially with deep breathing, cough, fever if from infection, fatigue, difficulty lying flat, hiccups",
    riskFactors: "Heart failure, pneumonia, pulmonary embolism, cancer especially lung or breast, cirrhosis, kidney disease, autoimmune diseases, asbestos exposure, chest trauma or surgery",
    treatment: "Treatment addresses the underlying cause and may include thoracentesis, chest tube drainage, and pleurodesis. Clinical trials study novel sclerosing agents and indwelling catheter management protocols.",
    whyParticipate: "Pleural effusion trials provide access to advanced drainage techniques and improved management strategies for recurrent effusions.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Pleural Effusion"),
    category: "Pulmonology"
  },
  // --- Additional Oncology ---
  {
    name: "Esophageal Cancer", slug: "esophageal-cancer", icon: "🎗️",
    description: "Esophageal cancer arises in the esophagus and is often diagnosed at advanced stages, but treatment advances are improving outcomes. Clinical trials explore immunotherapy combinations, targeted therapies based on histology, and multimodal treatment approaches.",
    symptoms: "Difficulty swallowing, unintended weight loss, chest pain or pressure, worsening heartburn or indigestion, hoarseness, chronic cough, vomiting, hiccups, bone pain if metastasized",
    riskFactors: "Tobacco use, heavy alcohol consumption, GERD and Barrett esophagus, obesity, age over 55, male sex, poor nutrition, drinking very hot liquids, occupational exposures",
    treatment: "Treatment includes surgery, radiation, chemotherapy, and immunotherapy. Clinical trials study neoadjuvant immunotherapy combinations and targeted therapies for HER2 and EGFR subtypes.",
    whyParticipate: "Esophageal cancer trials provide access to multimodal treatment protocols and immunotherapy options for improved survival.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Esophageal Cancer"),
    category: "Oncology"
  },
  {
    name: "Cervical Cancer", slug: "cervical-cancer", icon: "🎗️",
    description: "Cervical cancer is a preventable malignancy caused by high-risk HPV types, with screening and vaccination dramatically reducing incidence. Clinical trials explore HPV vaccination expansion, immunotherapy for advanced disease, and de-escalation of treatment for early-stage disease.",
    symptoms: "Abnormal vaginal bleeding between periods or after menopause, heavier longer periods, watery or bloody discharge with odor, pelvic pain, pain during intercourse, lower back pain",
    riskFactors: "HPV infection, smoking, multiple sex partners, early sexual activity, weakened immune system, long-term oral contraceptive use, multiple full-term pregnancies",
    treatment: "Treatment includes surgery, radiation, and chemotherapy depending on stage. Clinical trials study checkpoint inhibitors and antibody-drug conjugates for advanced cervical cancer.",
    whyParticipate: "Cervical cancer trials provide access to immunotherapies and targeted treatments for advanced and recurrent disease.",
    relatedConditions: pickRandom(allConditionNames, 5),
    relatedStates: pickRandom(allStateNames, 5),
    faq: faq("Cervical Cancer"),
    category: "Oncology"
  }
];

// Check for duplicates with existing AND batch1
const allSlugs = new Set([...existing.map(c => c.slug), ...cleaned.map(c => c.slug)]);
const allNames = new Set([...existing.map(c => c.name), ...cleaned.map(c => c.name)]);

const finalDupes = [];
for (const c of moreConditions) {
  if (allSlugs.has(c.slug)) {
    finalDupes.push(c.slug);
  }
  if (allNames.has(c.name)) {
    finalDupes.push(c.name + ' (name)');
  }
  allSlugs.add(c.slug);
  allNames.add(c.name);
}

if (finalDupes.length > 0) {
  console.error('DUPLICATES IN MORE CONDITIONS:', finalDupes);
  process.exit(1);
}

// Verify relatedConditions
for (const c of moreConditions) {
  for (const rc of c.relatedConditions) {
    if (!existingNames.has(rc)) {
      console.error(`Invalid relatedCondition "${rc}" in "${c.name}"`);
      process.exit(1);
    }
  }
}

// Merge with cleaned batch1
const merged = [...cleaned, ...moreConditions];
console.log(`Cleaned batch1: ${cleaned.length}`);
console.log(`More conditions: ${moreConditions.length}`);
console.log(`Total new conditions: ${merged.length}`);
console.log('Names:', merged.map(c => c.name).join(', '));

const outputPath = path.join(__dirname, '..', 'data', 'new-conditions-batch1.json');
fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
console.log('Written to', outputPath);
console.log(`Total in new-conditions-batch1.json: ${merged.length}`);
