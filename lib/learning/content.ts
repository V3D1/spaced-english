export const LEARNING_LEVELS = ['B2', 'C1', 'C2'] as const;
export const LEARNING_DOMAINS = ['business', 'tech', 'social'] as const;
export const FLASHCARD_TYPES = ['word', 'sentence'] as const;

export type LearningLevel = (typeof LEARNING_LEVELS)[number];
export type LearningDomain = (typeof LEARNING_DOMAINS)[number];
export type FlashcardType = (typeof FLASHCARD_TYPES)[number];

export type LearningCollocationSeed = {
  phrase: string;
  translation: string;
  example: string;
  domain: LearningDomain;
  category: string;
  level: LearningLevel;
};

export type LearningFlashcardSeed = {
  front: string;
  back: string;
  keyPhrase: string;
  domain: LearningDomain;
  source: string;
  level: LearningLevel;
  cardType: FlashcardType;
};

const b2Collocations: LearningCollocationSeed[] = [
  { phrase: 'follow through on', translation: 'doprowadzic do konca', example: 'We need to follow through on every client promise.', domain: 'business', category: 'Execution', level: 'B2' },
  { phrase: 'set clear priorities', translation: 'ustawic jasne priorytety', example: 'The team should set clear priorities before planning.', domain: 'business', category: 'Planning', level: 'B2' },
  { phrase: 'keep stakeholders updated', translation: 'aktualizowac interesariuszy', example: 'Please keep stakeholders updated every Friday.', domain: 'business', category: 'Communication', level: 'B2' },
  { phrase: 'make a solid plan', translation: 'zrobic solidny plan', example: 'Let us make a solid plan for the next quarter.', domain: 'business', category: 'Planning', level: 'B2' },
  { phrase: 'meet the deadline', translation: 'dotrzymac terminu', example: 'We can meet the deadline with focused scope.', domain: 'business', category: 'Execution', level: 'B2' },
  { phrase: 'ask for clarification', translation: 'poprosic o doprecyzowanie', example: 'I need to ask for clarification on this requirement.', domain: 'business', category: 'Communication', level: 'B2' },
  { phrase: 'share the context', translation: 'podzielic sie kontekstem', example: 'Before we decide, share the context with the team.', domain: 'business', category: 'Communication', level: 'B2' },
  { phrase: 'fix the root cause', translation: 'naprawic przyczyne zrodlowa', example: 'We should fix the root cause, not only the symptom.', domain: 'tech', category: 'Debugging', level: 'B2' },
  { phrase: 'run a quick test', translation: 'zrobic szybki test', example: 'Run a quick test before we merge this branch.', domain: 'tech', category: 'Testing', level: 'B2' },
  { phrase: 'improve code quality', translation: 'poprawic jakosc kodu', example: 'Refactoring now will improve code quality later.', domain: 'tech', category: 'Code Quality', level: 'B2' },
  { phrase: 'reduce response time', translation: 'zmniejszyc czas odpowiedzi', example: 'Caching helped us reduce response time.', domain: 'tech', category: 'Performance', level: 'B2' },
  { phrase: 'add better logging', translation: 'dodac lepsze logowanie', example: 'We need to add better logging in this service.', domain: 'tech', category: 'Observability', level: 'B2' },
  { phrase: 'deploy with confidence', translation: 'wdrazac z pewnoscia', example: 'Our tests let us deploy with confidence.', domain: 'tech', category: 'Delivery', level: 'B2' },
  { phrase: 'avoid duplicated logic', translation: 'unikac duplikacji logiki', example: 'Extract helpers to avoid duplicated logic.', domain: 'tech', category: 'Architecture', level: 'B2' },
  { phrase: 'bring up a topic', translation: 'poruszyc temat', example: 'Can I bring up a topic before we finish?', domain: 'social', category: 'Conversation', level: 'B2' },
  { phrase: 'get straight to the point', translation: 'przejsc do sedna', example: 'Let me get straight to the point.', domain: 'social', category: 'Conversation', level: 'B2' },
  { phrase: 'have a quick chat', translation: 'odbyc szybka rozmowe', example: 'Do you have time to have a quick chat?', domain: 'social', category: 'Conversation', level: 'B2' },
  { phrase: 'keep it simple', translation: 'utrzymac prostote', example: 'When explaining this, keep it simple.', domain: 'social', category: 'Communication', level: 'B2' },
  { phrase: 'look at it differently', translation: 'spojrzec na to inaczej', example: 'Try to look at it differently.', domain: 'social', category: 'Mindset', level: 'B2' },
  { phrase: 'make a better impression', translation: 'zrobic lepsze wrazenie', example: 'Small details can make a better impression.', domain: 'social', category: 'Communication', level: 'B2' },
];

const c1Collocations: LearningCollocationSeed[] = [
  { phrase: 'address an edge case', translation: 'obsluzyc przypadek brzegowy', example: 'We need to address this edge case in validation.', domain: 'tech', category: 'Code Review', level: 'C1' },
  { phrase: 'narrow down the cause', translation: 'zawezic przyczyne', example: 'I am trying to narrow down the cause of the bug.', domain: 'tech', category: 'Debugging', level: 'C1' },
  { phrase: 'roll back the changes', translation: 'wycofac zmiany', example: 'Let us roll back the changes and investigate.', domain: 'tech', category: 'Release', level: 'C1' },
  { phrase: 'optimize for performance', translation: 'optymalizowac pod wydajnosc', example: 'We should optimize this endpoint for performance.', domain: 'tech', category: 'Performance', level: 'C1' },
  { phrase: 'ship a feature safely', translation: 'wdrozyc funkcje bezpiecznie', example: 'Feature flags help us ship a feature safely.', domain: 'tech', category: 'Delivery', level: 'C1' },
  { phrase: 'mitigate operational risk', translation: 'mitygowac ryzyko operacyjne', example: 'We added retries to mitigate operational risk.', domain: 'tech', category: 'Reliability', level: 'C1' },
  { phrase: 'decouple critical services', translation: 'odseparowac krytyczne serwisy', example: 'We should decouple critical services before scaling.', domain: 'tech', category: 'Architecture', level: 'C1' },
  { phrase: 'align on expectations', translation: 'uzgodnic oczekiwania', example: 'We need to align on expectations before kickoff.', domain: 'business', category: 'Meetings', level: 'C1' },
  { phrase: 'move the needle', translation: 'zrobic realna roznice', example: 'This initiative can move the needle on retention.', domain: 'business', category: 'Strategy', level: 'C1' },
  { phrase: 'raise a concern early', translation: 'wczesnie zasygnalizowac obawy', example: 'Please raise a concern early if scope slips.', domain: 'business', category: 'Communication', level: 'C1' },
  { phrase: 'take ownership of delivery', translation: 'wziac odpowiedzialnosc za dowiezienie', example: 'I will take ownership of delivery this sprint.', domain: 'business', category: 'Ownership', level: 'C1' },
  { phrase: 'make a compelling case', translation: 'przedstawic przekonujacy argument', example: 'She made a compelling case for the redesign.', domain: 'business', category: 'Negotiation', level: 'C1' },
  { phrase: 'bridge the gap', translation: 'zniwelowac luke', example: 'We need to bridge the gap between plan and execution.', domain: 'business', category: 'Negotiation', level: 'C1' },
  { phrase: 'set the stage for', translation: 'przygotowac grunt pod', example: 'This workshop will set the stage for Q2 planning.', domain: 'business', category: 'Strategy', level: 'C1' },
  { phrase: 'weigh the trade-offs', translation: 'rozwazyc kompromisy', example: 'Let us weigh the trade-offs before committing.', domain: 'business', category: 'Decision Making', level: 'C1' },
  { phrase: 'as far as I am concerned', translation: 'jesli o mnie chodzi', example: 'As far as I am concerned, this approach is viable.', domain: 'social', category: 'Discussion', level: 'C1' },
  { phrase: 'it boils down to', translation: 'sprowadza sie do', example: 'It boils down to execution discipline.', domain: 'social', category: 'Discussion', level: 'C1' },
  { phrase: 'to put it bluntly', translation: 'mowiac wprost', example: 'To put it bluntly, we are not ready yet.', domain: 'social', category: 'Discussion', level: 'C1' },
  { phrase: 'from my perspective', translation: 'z mojej perspektywy', example: 'From my perspective, we should simplify the scope.', domain: 'social', category: 'Discussion', level: 'C1' },
  { phrase: 'keep an open mind', translation: 'zachowac otwarta glowe', example: 'Keep an open mind when reviewing feedback.', domain: 'social', category: 'Mindset', level: 'C1' },
];

const c2Collocations: LearningCollocationSeed[] = [
  { phrase: 'stress-test the assumption', translation: 'przetestowac zalozenie pod obciazeniem', example: 'Before investing, let us stress-test the assumption.', domain: 'business', category: 'Strategy', level: 'C2' },
  { phrase: 'future-proof the roadmap', translation: 'zabezpieczyc roadmape na przyszlosc', example: 'We need to future-proof the roadmap against market shifts.', domain: 'business', category: 'Strategy', level: 'C2' },
  { phrase: 'calibrate stakeholder expectations', translation: 'skalibrowac oczekiwania interesariuszy', example: 'The kickoff should calibrate stakeholder expectations.', domain: 'business', category: 'Communication', level: 'C2' },
  { phrase: 'de-risk the initiative', translation: 'odryzykowac inicjatywe', example: 'Pilot users will de-risk the initiative.', domain: 'business', category: 'Execution', level: 'C2' },
  { phrase: 'unlock compounding value', translation: 'odblokowac wartosc kumulujaca sie w czasie', example: 'Automation can unlock compounding value across teams.', domain: 'business', category: 'Growth', level: 'C2' },
  { phrase: 'drive cross-functional alignment', translation: 'budowac alignment miedzy zespolami', example: 'The PM should drive cross-functional alignment early.', domain: 'business', category: 'Leadership', level: 'C2' },
  { phrase: 'frame the narrative credibly', translation: 'wiarygodnie osadzic narracje', example: 'Data helps us frame the narrative credibly.', domain: 'business', category: 'Communication', level: 'C2' },
  { phrase: 'eliminate a single point of failure', translation: 'usunac pojedynczy punkt awarii', example: 'We must eliminate a single point of failure in auth.', domain: 'tech', category: 'Reliability', level: 'C2' },
  { phrase: 'harden the attack surface', translation: 'utwardzic powierzchnie ataku', example: 'This patch will harden the attack surface significantly.', domain: 'tech', category: 'Security', level: 'C2' },
  { phrase: 'decouple stateful dependencies', translation: 'odseparowac zaleznosci stanowe', example: 'We should decouple stateful dependencies before scale-up.', domain: 'tech', category: 'Architecture', level: 'C2' },
  { phrase: 'instrument end-to-end visibility', translation: 'wdrozyc widocznosc end-to-end', example: 'Tracing gives us end-to-end visibility in production.', domain: 'tech', category: 'Observability', level: 'C2' },
  { phrase: 'safeguard data integrity', translation: 'zabezpieczyc integralnosc danych', example: 'Idempotency keys safeguard data integrity.', domain: 'tech', category: 'Data', level: 'C2' },
  { phrase: 'quantify performance regressions', translation: 'kwantyfikowac regresje wydajnosci', example: 'Benchmarks help quantify performance regressions.', domain: 'tech', category: 'Performance', level: 'C2' },
  { phrase: 'orchestrate resilient failover', translation: 'orkiestrowac odporny failover', example: 'We orchestrate resilient failover across regions.', domain: 'tech', category: 'Reliability', level: 'C2' },
  { phrase: 'articulate a nuanced position', translation: 'wyrazic zniuansowane stanowisko', example: 'He can articulate a nuanced position under pressure.', domain: 'social', category: 'Discussion', level: 'C2' },
  { phrase: 'distill complexity into clarity', translation: 'destylowac zlozonosc do klarownosci', example: 'Your job is to distill complexity into clarity.', domain: 'social', category: 'Communication', level: 'C2' },
  { phrase: 'challenge the premise constructively', translation: 'konstruktywnie zakwestionowac zalozenie', example: 'I challenge the premise constructively, not defensively.', domain: 'social', category: 'Discussion', level: 'C2' },
  { phrase: 'read the room accurately', translation: 'trafnie czytac nastroj rozmowy', example: 'Great leaders read the room accurately.', domain: 'social', category: 'Communication', level: 'C2' },
  { phrase: 'hold two ideas in tension', translation: 'utrzymac dwa pomysly w tworczej sprzecznosci', example: 'We can hold two ideas in tension while deciding.', domain: 'social', category: 'Critical Thinking', level: 'C2' },
  { phrase: 'sustain a high-trust dialogue', translation: 'utrzymac dialog oparty na wysokim zaufaniu', example: 'Conflicts shrink when we sustain a high-trust dialogue.', domain: 'social', category: 'Communication', level: 'C2' },
];

export function getLearningCollocationSeed() {
  return [...b2Collocations, ...c1Collocations, ...c2Collocations];
}

export function buildFlashcardSeedFromCollocations(
  collocations: LearningCollocationSeed[]
): LearningFlashcardSeed[] {
  const cards: LearningFlashcardSeed[] = [];

  for (const collocation of collocations) {
    cards.push({
      front: collocation.translation,
      back: collocation.phrase,
      keyPhrase: collocation.phrase,
      domain: collocation.domain,
      source: 'Generated Learning Pack',
      level: collocation.level,
      cardType: 'word',
    });

    cards.push({
      front: `Use the phrase "${collocation.phrase}" in a sentence (${collocation.domain}).`,
      back: collocation.example,
      keyPhrase: collocation.phrase,
      domain: collocation.domain,
      source: 'Generated Learning Pack',
      level: collocation.level,
      cardType: 'sentence',
    });
  }

  return cards;
}
