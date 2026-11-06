export interface TopicPassage {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  reference: string;
  preview: string;
  explainer: string;
  verseCount: number;
}

export interface Topic {
  slug: string;
  name: string;
  description: string;
  icon: string;
  passages: TopicPassage[];
}

export const TOPICS: Topic[] = [
  {
    slug: 'faith',
    name: 'Faith',
    description: 'Trusting God, believing in His promises and relying on Him rather than our own understanding.',
    icon: 'Cross',
    passages: [
      { book: 'proverbs', chapter: 3, startVerse: 5, endVerse: 6, reference: 'Proverbs 3:5–6', preview: 'Trust in Yahweh with all your heart, and don\'t lean on your own understanding…', explainer: 'Trust God even when you cannot see the whole picture.', verseCount: 2 },
      { book: 'hebrews', chapter: 11, startVerse: 1, endVerse: 1, reference: 'Hebrews 11:1', preview: 'Now faith is assurance of things hoped for, proof of things not seen.', explainer: 'Faith means trusting in what God has promised, even when you cannot yet see the outcome.', verseCount: 1 },
      { book: 'mark', chapter: 11, startVerse: 22, endVerse: 24, reference: 'Mark 11:22–24', preview: 'Jesus answered them, "Have faith in God…"', explainer: 'Jesus teaches the importance of trusting God and praying with faith.', verseCount: 3 },
      { book: 'romans', chapter: 10, startVerse: 17, endVerse: 17, reference: 'Romans 10:17', preview: 'So faith comes by hearing, and hearing by the word of God.', explainer: 'Faith grows as you listen to, read and reflect on God\'s word.', verseCount: 1 },
      { book: '2corinthians', chapter: 5, startVerse: 7, endVerse: 7, reference: '2 Corinthians 5:7', preview: 'For we walk by faith, not by sight.', explainer: 'You do not need to understand or see everything before you trust God.', verseCount: 1 },
      { book: 'hebrews', chapter: 11, startVerse: 6, endVerse: 6, reference: 'Hebrews 11:6', preview: 'Without faith it is impossible to be well pleasing to him…', explainer: 'A relationship with God begins with believing in Him and sincerely seeking Him.', verseCount: 1 },
    ],
  },
  {
    slug: 'anxiety-fear',
    name: 'Anxiety & Fear',
    description: 'Finding peace, overcoming fear and trusting God during difficult and uncertain times.',
    icon: 'Feather',
    passages: [
      { book: 'philippians', chapter: 4, startVerse: 6, endVerse: 7, reference: 'Philippians 4:6–7', preview: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving…', explainer: 'Bring your worries to God through prayer instead of carrying them alone.', verseCount: 2 },
      { book: 'matthew', chapter: 6, startVerse: 25, endVerse: 27, reference: 'Matthew 6:25–27', preview: 'Therefore I tell you, don\'t be anxious for your life…', explainer: 'Jesus reminds us not to let worry about everyday needs take over our lives.', verseCount: 3 },
      { book: 'isaiah', chapter: 41, startVerse: 10, endVerse: 10, reference: 'Isaiah 41:10', preview: 'Don\'t you be afraid, for I am with you. Don\'t be dismayed, for I am your God…', explainer: 'God promises His presence and support in frightening situations.', verseCount: 1 },
      { book: 'psalms', chapter: 55, startVerse: 22, endVerse: 22, reference: 'Psalm 55:22', preview: 'Cast your burden on Yahweh, and he will sustain you…', explainer: 'Give your worries and burdens to God.', verseCount: 1 },
      { book: 'john', chapter: 14, startVerse: 27, endVerse: 27, reference: 'John 14:27', preview: 'Peace I leave with you. My peace I give to you…', explainer: 'Jesus offers a deeper peace than the temporary comfort the world can provide.', verseCount: 1 },
      { book: 'psalms', chapter: 34, startVerse: 4, endVerse: 4, reference: 'Psalm 34:4', preview: 'I sought Yahweh, and he answered me, and delivered me from all my fears.', explainer: 'Turning to God in fear and finding help.', verseCount: 1 },
    ],
  },
  {
    slug: 'love',
    name: 'Love',
    description: 'Understanding God\'s love and learning to love others with kindness, patience and compassion.',
    icon: 'Heart',
    passages: [
      { book: '1corinthians', chapter: 13, startVerse: 4, endVerse: 7, reference: '1 Corinthians 13:4–7', preview: 'Love is patient and is kind; love doesn\'t envy…', explainer: 'What genuine love looks like in everyday behaviour.', verseCount: 4 },
      { book: '1john', chapter: 4, startVerse: 19, endVerse: 19, reference: '1 John 4:19', preview: 'We love him, because he first loved us.', explainer: 'Our ability to love God comes in response to His love for us.', verseCount: 1 },
      { book: 'john', chapter: 15, startVerse: 12, endVerse: 13, reference: 'John 15:12–13', preview: 'This is my commandment, that you love one another…', explainer: 'Jesus calls us to love others with the same selflessness He showed.', verseCount: 2 },
      { book: '1john', chapter: 4, startVerse: 8, endVerse: 8, reference: '1 John 4:8', preview: 'He who doesn\'t love doesn\'t know God, for God is love.', explainer: 'Love is central to God\'s nature.', verseCount: 1 },
      { book: 'john', chapter: 13, startVerse: 34, endVerse: 35, reference: 'John 13:34–35', preview: 'A new commandment I give to you, that you love one another…', explainer: 'Love should be one of the clearest signs of following Jesus.', verseCount: 2 },
      { book: 'romans', chapter: 12, startVerse: 10, endVerse: 10, reference: 'Romans 12:10', preview: 'In love of the brothers be tenderly affectionate to one another…', explainer: 'Treat others with genuine affection and respect.', verseCount: 1 },
    ],
  },
  {
    slug: 'wisdom',
    name: 'Wisdom',
    description: 'Seeking God\'s guidance, making better decisions and learning to distinguish right from wrong.',
    icon: 'Lightbulb',
    passages: [
      { book: 'james', chapter: 1, startVerse: 5, endVerse: 5, reference: 'James 1:5', preview: 'But if any of you lacks wisdom, let him ask of God…', explainer: 'You can ask God for wisdom when you do not know what to do.', verseCount: 1 },
      { book: 'proverbs', chapter: 16, startVerse: 3, endVerse: 3, reference: 'Proverbs 16:3', preview: 'Commit your deeds to Yahweh, and your plans shall succeed.', explainer: 'Bring your plans and actions before God.', verseCount: 1 },
      { book: 'proverbs', chapter: 4, startVerse: 7, endVerse: 7, reference: 'Proverbs 4:7', preview: 'Wisdom is supreme. Get wisdom…', explainer: 'Wisdom is worth pursuing and should be treated as a priority.', verseCount: 1 },
      { book: 'psalms', chapter: 119, startVerse: 105, endVerse: 105, reference: 'Psalm 119:105', preview: 'Your word is a lamp to my feet, and a light for my path.', explainer: 'God\'s word can guide your next step.', verseCount: 1 },
      { book: 'proverbs', chapter: 15, startVerse: 22, endVerse: 22, reference: 'Proverbs 15:22', preview: 'Where there is no counsel, plans fail…', explainer: 'Wise decisions often involve listening to trustworthy advice.', verseCount: 1 },
    ],
  },
  {
    slug: 'forgiveness',
    name: 'Forgiveness',
    description: 'Learning to forgive others, letting go of resentment and seeking forgiveness for our own mistakes.',
    icon: 'Handshake',
    passages: [
      { book: 'ephesians', chapter: 4, startVerse: 31, endVerse: 32, reference: 'Ephesians 4:31–32', preview: 'Let all bitterness, wrath, anger, outcry, and slander, be put away from you…', explainer: 'Let go of bitterness and treat others with kindness and compassion.', verseCount: 2 },
      { book: 'matthew', chapter: 6, startVerse: 14, endVerse: 15, reference: 'Matthew 6:14–15', preview: 'For if you forgive men their trespasses, your heavenly Father will also forgive you…', explainer: 'Receiving God\'s forgiveness should change how we respond when others wrong us.', verseCount: 2 },
      { book: 'colossians', chapter: 3, startVerse: 13, endVerse: 13, reference: 'Colossians 3:13', preview: 'Bearing with one another, and forgiving each other…', explainer: 'Be patient and forgive others as Christ has forgiven us.', verseCount: 1 },
      { book: '1john', chapter: 1, startVerse: 9, endVerse: 9, reference: '1 John 1:9', preview: 'If we confess our sins, he is faithful and righteous to forgive us…', explainer: 'When you honestly admit your wrongdoing to God, you can trust His promise to forgive.', verseCount: 1 },
      { book: 'luke', chapter: 6, startVerse: 37, endVerse: 37, reference: 'Luke 6:37', preview: 'Don\'t judge, and you won\'t be judged. Don\'t condemn, and you won\'t be condemned…', explainer: 'Be willing to show the mercy and grace you hope to receive.', verseCount: 1 },
    ],
  },
  {
    slug: 'strength',
    name: 'Strength',
    description: 'Finding courage, perseverance and strength through God when facing hardship and adversity.',
    icon: 'Flame',
    passages: [
      { book: 'philippians', chapter: 4, startVerse: 13, endVerse: 13, reference: 'Philippians 4:13', preview: 'I can do all things through Christ, who strengthens me.', explainer: 'Christ gives strength to endure changing circumstances.', verseCount: 1 },
      { book: 'isaiah', chapter: 40, startVerse: 29, endVerse: 31, reference: 'Isaiah 40:29–31', preview: 'He gives power to the weak. He increases the strength of him who has no might…', explainer: 'Those who hope in God can find renewed strength to keep going.', verseCount: 3 },
      { book: 'joshua', chapter: 1, startVerse: 9, endVerse: 9, reference: 'Joshua 1:9', preview: 'Be strong and courageous. Don\'t be afraid…', explainer: 'Courage means moving forward with confidence that God is with you.', verseCount: 1 },
      { book: 'psalms', chapter: 46, startVerse: 1, endVerse: 1, reference: 'Psalm 46:1', preview: 'God is our refuge and strength, a very present help in trouble.', explainer: 'God is a safe place to turn when life becomes overwhelming.', verseCount: 1 },
      { book: '2corinthians', chapter: 12, startVerse: 9, endVerse: 9, reference: '2 Corinthians 12:9', preview: 'My grace is sufficient for you, for my power is made perfect in weakness…', explainer: 'God\'s strength can be at work in you even when you feel unable to cope.', verseCount: 1 },
    ],
  },
  {
    slug: 'hope',
    name: 'Hope',
    description: 'Remembering God\'s promises, finding encouragement and maintaining hope even when life feels difficult.',
    icon: 'Sun',
    passages: [
      { book: 'romans', chapter: 8, startVerse: 28, endVerse: 28, reference: 'Romans 8:28', preview: 'We know that all things work together for good for those who love God…', explainer: 'God can work even painful experiences towards His good purposes.', verseCount: 1 },
      { book: 'jeremiah', chapter: 29, startVerse: 11, endVerse: 11, reference: 'Jeremiah 29:11', preview: 'For I know the thoughts that I think toward you, says Yahweh, thoughts of peace…', explainer: 'God reassures His people that suffering is not the end of their story.', verseCount: 1 },
      { book: 'romans', chapter: 15, startVerse: 13, endVerse: 13, reference: 'Romans 15:13', preview: 'Now may the God of hope fill you with all joy and peace in believing…', explainer: 'Hope grows through trusting God.', verseCount: 1 },
      { book: 'lamentations', chapter: 3, startVerse: 22, endVerse: 23, reference: 'Lamentations 3:22–23', preview: 'It is because of Yahweh\'s loving kindnesses that we are not consumed…', explainer: 'Even in suffering, God\'s mercy remains. Each new day is a reminder of His faithfulness.', verseCount: 2 },
      { book: 'psalms', chapter: 42, startVerse: 11, endVerse: 11, reference: 'Psalm 42:11', preview: 'Why are you in despair, my soul? Hope in God!', explainer: 'Honestly acknowledges inner pain while reminding yourself to keep hoping.', verseCount: 1 },
      { book: 'isaiah', chapter: 43, startVerse: 2, endVerse: 2, reference: 'Isaiah 43:2', preview: 'When you pass through the waters, I will be with you…', explainer: 'God promises to remain with His people through overwhelming trials.', verseCount: 1 },
    ],
  },
  {
    slug: 'marriage-relationships',
    name: 'Marriage & Relationships',
    description: 'Building healthy relationships based on commitment, mutual respect, faithfulness and selfless love.',
    icon: 'Gem',
    passages: [
      { book: 'ephesians', chapter: 5, startVerse: 25, endVerse: 25, reference: 'Ephesians 5:25', preview: 'Husbands, love your wives, even as Christ also loved the assembly…', explainer: 'Love through selfless care and sacrifice, following Christ\'s example.', verseCount: 1 },
      { book: 'colossians', chapter: 3, startVerse: 12, endVerse: 14, reference: 'Colossians 3:12–14', preview: 'Put on therefore, as God\'s chosen ones, a heart of compassion, kindness…', explainer: 'Healthy relationships need compassion, humility, patience and forgiveness.', verseCount: 3 },
      { book: 'genesis', chapter: 2, startVerse: 24, endVerse: 24, reference: 'Genesis 2:24', preview: 'Therefore a man will leave his father and his mother, and will join with his wife…', explainer: 'Marriage as a deep and committed union.', verseCount: 1 },
      { book: 'ecclesiastes', chapter: 4, startVerse: 9, endVerse: 10, reference: 'Ecclesiastes 4:9–10', preview: 'Two are better than one, because they have a good reward for their labor…', explainer: 'A good relationship involves mutual support.', verseCount: 2 },
      { book: '1peter', chapter: 4, startVerse: 8, endVerse: 8, reference: '1 Peter 4:8', preview: 'Above all things be earnest in your love among yourselves…', explainer: 'Deep love makes room for patience and forgiveness.', verseCount: 1 },
    ],
  },
  {
    slug: 'loneliness',
    name: 'Loneliness',
    description: 'Finding comfort in God\'s presence, overcoming isolation and remembering that you are not abandoned.',
    icon: 'HeartHandshake',
    passages: [
      { book: 'deuteronomy', chapter: 31, startVerse: 8, endVerse: 8, reference: 'Deuteronomy 31:8', preview: 'Yahweh himself is who goes before you. He will be with you…', explainer: 'God promises to go with His people and not abandon them.', verseCount: 1 },
      { book: 'psalms', chapter: 27, startVerse: 10, endVerse: 10, reference: 'Psalm 27:10', preview: 'When my father and my mother forsake me, then Yahweh will take me up.', explainer: 'Even if the people closest to you let you down, God remains.', verseCount: 1 },
      { book: 'psalms', chapter: 23, startVerse: 4, endVerse: 4, reference: 'Psalm 23:4', preview: 'Even though I walk through the valley of the shadow of death, I will fear no evil…', explainer: 'God is present even in the darkest and loneliest parts of life.', verseCount: 1 },
      { book: 'matthew', chapter: 28, startVerse: 20, endVerse: 20, reference: 'Matthew 28:20', preview: 'Behold, I am with you always, even to the end of the age.', explainer: 'Jesus promises His followers will not be left alone.', verseCount: 1 },
      { book: 'psalms', chapter: 68, startVerse: 6, endVerse: 6, reference: 'Psalm 68:6', preview: 'God sets the lonely in families…', explainer: 'God cares about people who are isolated and without a place to belong.', verseCount: 1 },
    ],
  },
  {
    slug: 'depression',
    name: 'Depression',
    description: 'Finding hope during emotional suffering, remembering God\'s compassion and finding strength when life feels overwhelming.',
    icon: 'Leaf',
    passages: [
      { book: 'psalms', chapter: 34, startVerse: 18, endVerse: 18, reference: 'Psalm 34:18', preview: 'Yahweh is near to those who have a broken heart…', explainer: 'God does not turn away from people who are emotionally broken.', verseCount: 1 },
      { book: 'psalms', chapter: 42, startVerse: 5, endVerse: 5, reference: 'Psalm 42:5', preview: 'Why are you in despair, my soul? Hope in God!', explainer: 'Recognise despair honestly and encourage yourself to keep hoping in God.', verseCount: 1 },
      { book: 'matthew', chapter: 11, startVerse: 28, endVerse: 30, reference: 'Matthew 11:28–30', preview: 'Come to me, all you who labor and are heavily burdened, and I will give you rest…', explainer: 'Jesus invites exhausted and burdened people to come to Him.', verseCount: 3 },
      { book: '1kings', chapter: 19, startVerse: 4, endVerse: 5, reference: '1 Kings 19:4–5', preview: 'He requested for himself that he might die… an angel said, "Arise and eat!"', explainer: 'Elijah reaches deep despair. God responds by caring for his physical needs.', verseCount: 2 },
      { book: '2corinthians', chapter: 1, startVerse: 3, endVerse: 4, reference: '2 Corinthians 1:3–4', preview: 'Blessed be the God and Father of our Lord Jesus Christ, the Father of mercies…', explainer: 'God offers comfort in times of suffering.', verseCount: 2 },
    ],
  },
  {
    slug: 'business-career',
    name: 'Business & Career',
    description: 'Building a business, working diligently, making wise decisions, managing money, and pursuing meaningful goals.',
    icon: 'Mountain',
    passages: [
      { book: 'proverbs', chapter: 16, startVerse: 3, endVerse: 3, reference: 'Proverbs 16:3', preview: 'Commit your deeds to Yahweh, and your plans shall succeed.', explainer: 'Bring your work and ambitions before God.', verseCount: 1 },
      { book: 'proverbs', chapter: 21, startVerse: 5, endVerse: 5, reference: 'Proverbs 21:5', preview: 'The plans of the diligent surely lead to profit…', explainer: 'Sustainable progress comes from careful planning and consistent effort.', verseCount: 1 },
      { book: 'colossians', chapter: 3, startVerse: 23, endVerse: 24, reference: 'Colossians 3:23–24', preview: 'Whatever you do, work heartily, as for the Lord…', explainer: 'Give your work genuine care and effort, even when nobody is watching.', verseCount: 2 },
      { book: 'luke', chapter: 14, startVerse: 28, endVerse: 28, reference: 'Luke 14:28', preview: 'Which of you, desiring to build a tower, doesn\'t first sit down and count the cost…', explainer: 'Before a major project, understand what it will require.', verseCount: 1 },
      { book: 'proverbs', chapter: 22, startVerse: 29, endVerse: 29, reference: 'Proverbs 22:29', preview: 'Do you see a man skilled in his work? He will serve kings…', explainer: 'Take your craft seriously and keep improving your skills.', verseCount: 1 },
      { book: 'galatians', chapter: 6, startVerse: 9, endVerse: 9, reference: 'Galatians 6:9', preview: 'Let us not be weary in doing good, for we will reap in due season…', explainer: 'Keep going when progress is slow. Persistence pays off.', verseCount: 1 },
    ],
  },
  {
    slug: 'lust-self-control',
    name: 'Lust & Self-Control',
    description: 'Overcoming lust, resisting sexual temptation, practising self-control and keeping your thoughts and actions pure.',
    icon: 'Shield',
    passages: [
      { book: 'matthew', chapter: 5, startVerse: 27, endVerse: 28, reference: 'Matthew 5:27–28', preview: 'Everyone who gazes at a woman to lust after her has committed adultery with her already in his heart.', explainer: 'Jesus teaches that faithfulness begins in the heart, not just in physical actions.', verseCount: 2 },
      { book: '1corinthians', chapter: 6, startVerse: 18, endVerse: 20, reference: '1 Corinthians 6:18–20', preview: 'Flee sexual immorality! Your body is a temple of the Holy Spirit…', explainer: 'Your body deserves respect. Paul encourages us to honour God through our physical choices.', verseCount: 3 },
      { book: '1thessalonians', chapter: 4, startVerse: 3, endVerse: 5, reference: '1 Thessalonians 4:3–5', preview: 'This is the will of God: your sanctification, that you abstain from sexual immorality…', explainer: 'God calls people to practise sexual self-control rather than being ruled by uncontrolled desires.', verseCount: 3 },
      { book: '2timothy', chapter: 2, startVerse: 22, endVerse: 22, reference: '2 Timothy 2:22', preview: 'Flee from youthful lusts; but pursue righteousness, faith, love, and peace…', explainer: 'Replace unhealthy desires with positive pursuits such as faith, love, and meaningful relationships.', verseCount: 1 },
      { book: 'galatians', chapter: 5, startVerse: 16, endVerse: 16, reference: 'Galatians 5:16', preview: 'Walk by the Spirit, and you won\'t fulfill the lust of the flesh.', explainer: 'Focus on living according to God\'s guidance rather than giving in to every physical desire.', verseCount: 1 },
      { book: 'colossians', chapter: 3, startVerse: 5, endVerse: 5, reference: 'Colossians 3:5', preview: 'Put to death therefore your members which are on the earth: sexual immorality…', explainer: 'Actively reject behaviours and cravings that pull you away from God.', verseCount: 1 },
      { book: 'job', chapter: 31, startVerse: 1, endVerse: 1, reference: 'Job 31:1', preview: 'I made a covenant with my eyes, how then should I look lustfully at a young woman?', explainer: 'Self-control often begins with the choices we make about what we expose ourselves to.', verseCount: 1 },
      { book: '1corinthians', chapter: 10, startVerse: 13, endVerse: 13, reference: '1 Corinthians 10:13', preview: 'No temptation has taken you except such as is common to man. God is faithful…', explainer: 'Everyone experiences temptation. God provides opportunities to resist it and choose a different path.', verseCount: 1 },
    ],
  },
];

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
