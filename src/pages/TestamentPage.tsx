import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, Info, X } from 'lucide-react';
import {
  getOldTestamentBooks,
  getNewTestamentBooks,
  type BookMeta,
} from '../lib/book-metadata';

/** Placeholder descriptions — replace with real content later. */
const BOOK_DESCRIPTIONS: Record<string, string> = {
  // Old Testament
  genesis: 'Discover the Bible\'s account of creation, humanity\'s beginnings, and the origin of Israel. Stories of faith, failure, family, and God\'s promises.',
  exodus: 'Follow Israel\'s escape from slavery in Egypt and the beginning of its covenant with God. Themes of freedom, worship, justice, and God\'s presence.',
  leviticus: 'Understand the laws and rituals that shaped Israel\'s worship and daily life. Explores holiness, sacrifice, purity, and relationship with a holy God.',
  numbers: 'Follow Israel\'s difficult journey through the wilderness toward the Promised Land. Consequences of distrust and rebellion, but also God\'s patience.',
  deuteronomy: 'Moses prepares a new generation to enter the Promised Land. A call to remember God, love him, and choose a faithful way of life.',
  joshua: 'See how Israel enters and settles in the Promised Land. Explores courage, obedience, leadership, and faithfulness to God.',
  judges: 'A turbulent period when Israel repeatedly turned away from God. Cycles of failure and rescue show the cost of moral confusion.',
  ruth: 'A quiet but powerful story of loyalty, kindness, and hope amid loss. Faithfulness in ordinary decisions becomes part of a larger story.',
  '1samuel': 'Israel\'s transition from judges to kings through Samuel, Saul, and David. Leadership, obedience, ambition, and the difference between appearance and heart.',
  '2samuel': 'David\'s reign including achievements, failures, and painful family conflicts. The possibilities and dangers of power.',
  '1kings': 'How Israel\'s united kingdom divides and begins to decline. Solomon and the prophets challenge readers about compromise and divided loyalty.',
  '2kings': 'The final years of Israel and Judah, ending in conquest and exile. How persistent injustice and unfaithfulness can destroy a nation.',
  '1chronicles': 'Israel\'s history with special attention to David, worship, and the temple. Connecting community identity with calling and heritage.',
  '2chronicles': 'The kings of Judah and the spiritual life of the nation. Consequences of seeking or abandoning God, ending with hope for restoration.',
  ezra: 'Jewish exiles return to Jerusalem and rebuild the temple. Renewal, commitment to Scripture, and challenges of restoring community after disaster.',
  nehemiah: 'The rebuilding of Jerusalem\'s walls and renewal of its people. Prayer, courageous leadership, perseverance, and shared responsibility.',
  esther: 'A Jewish woman risks her life to protect her people in the Persian Empire. Courage, identity, providence, and standing against injustice.',
  job: 'Wrestling with suffering, injustice, and the limits of human understanding. Challenges simplistic explanations and invites deeper reflection on faith.',
  psalms: 'Language for the full range of human experience — joy, gratitude, fear, grief, and anger. Honest emotions brought before God.',
  proverbs: 'Practical wisdom about character, relationships, work, speech, money, and decisions. A life shaped by humility, discipline, and reverence for God.',
  ecclesiastes: 'An honest examination of pleasure, achievement, work, wealth, and meaning. Challenges readers to face life\'s limits and consider what truly matters.',
  songofsolomon: 'Poetic reflections on romantic love, desire, and mutual delight. Celebrates the beauty of committed human affection.',
  isaiah: 'A sweeping vision of judgment, hope, justice, and restoration. Calls people away from empty religion toward God\'s promised salvation.',
  jeremiah: 'Warnings as Judah\'s destruction approaches. The cost of truth-telling, the seriousness of injustice, and the hope of a renewed covenant.',
  lamentations: 'The grief of a people after Jerusalem\'s destruction. Poems giving voice to suffering while showing sorrow and hope side by side.',
  ezekiel: 'Vivid visions and symbolic actions addressing a people in exile. Accountability, God\'s glory, personal responsibility, and spiritual renewal.',
  daniel: 'Faithfulness under foreign rule and visions about the rise and fall of kingdoms. Courage, wisdom, and trust when powerful institutions demand compromise.',
  hosea: 'A broken marriage portraying Israel\'s unfaithfulness and God\'s persistent love. Confronts betrayal while offering a moving picture of mercy.',
  joel: 'A national crisis and the call to return to God. Points toward the day of the Lord and the promise that God\'s Spirit will be poured out.',
  amos: 'A forceful challenge to religious hypocrisy and social injustice. Worship means little when the vulnerable are exploited.',
  obadiah: 'Prophetic judgment against Edom for pride and hostility toward Judah. Arrogance and taking advantage of others will not go unanswered.',
  jonah: 'A reluctant prophet who resents God\'s compassion toward enemies. Challenges narrow ideas of mercy.',
  micah: 'A clear call to practise justice, love mercy, and walk humbly with God. Confronts corruption while holding out hope.',
  nahum: 'The announcement of Nineveh\'s downfall and the end of its oppressive power. Cruelty and violence do not escape judgment.',
  habakkuk: 'A prophet\'s honest questions about evil, injustice, and God\'s silence. Faith can include difficult questions and endure tough circumstances.',
  zephaniah: 'Warning about the day of the Lord and a call to seek humility. Moves from judgment toward hope of a purified people.',
  haggai: 'Why the returned exiles should rebuild the temple rather than focus on their own homes. Examine your priorities.',
  zechariah: 'Visions and promises encouraging a discouraged community rebuilding Jerusalem. Faithfulness combined with hope for God\'s future kingdom.',
  malachi: 'A challenge to careless worship, corrupt leadership, and unfaithfulness. Take your commitments seriously.',
  // New Testament
  matthew: 'Jesus as the promised Messiah and fulfilment of Israel\'s Scriptures. Teachings, parables, and what life in God\'s kingdom looks like.',
  mark: 'A fast-moving account of Jesus\' actions, authority, suffering, and resurrection. Discipleship as trust, service, and following a difficult path.',
  luke: 'A detailed account of Jesus\' life with attention to outsiders, the poor, women, and the overlooked. God\'s mercy and the wide reach of good news.',
  john: 'Who Jesus is through signs, conversations, and extended teachings. An invitation to believe in Jesus and find life through him.',
  acts: 'The early Christian movement from Jerusalem into the wider Roman world. The Holy Spirit empowers ordinary people across cultural boundaries.',
  romans: 'A systematic exploration of sin, grace, faith, salvation, and life in the Spirit. Foundations of the Christian message.',
  '1corinthians': 'A divided church challenged over relationships, worship, morality, and spiritual gifts. Building community shaped by love rather than rivalry.',
  '2corinthians': 'Christian ministry, weakness, suffering, and reconciliation. Strength comes not from status but from vulnerability in service.',
  galatians: 'A passionate defence of freedom through faith in Christ. Grace, identity, and using freedom in love.',
  ephesians: 'The unity of believers in Christ and their new shared identity. Big ideas about grace connected with practical guidance.',
  philippians: 'Joy, humility, perseverance, and unity even in hardship. Jesus\' self-giving attitude as a model for life.',
  colossians: 'The central place of Christ in creation and the church. Resist misleading ideas and let new identity shape conduct.',
  '1thessalonians': 'Encouragement to a young church facing pressure. Faith, love, hope, holy living, and the return of Jesus.',
  '2thessalonians': 'Perseverance, the day of the Lord, and responsible living. Do not be unsettled by speculation or neglect everyday responsibilities.',
  '1timothy': 'Practical guidance on leadership, teaching, worship, and community life. Protecting sound teaching and developing trustworthy leaders.',
  '2timothy': 'A personal charge to remain faithful through hardship. Courage, endurance, and confidence in Scripture.',
  titus: 'Concise guidance on appointing leaders and building communities marked by integrity and good works.',
  philemon: 'A brief appeal for reconciliation between a slaveholder and an enslaved man. How faith should transform relationships and power.',
  hebrews: 'How Jesus fulfils and surpasses priests, sacrifices, and the old covenant. Perseverance and why trust in Jesus is worth holding onto.',
  james: 'Practical teaching about putting faith into action through speech, patience, humility, and care for people in need.',
  '1peter': 'Encouragement to remain hopeful and live faithfully while facing hostility. Christian identity grounded in hope, holiness, and resilient love.',
  '2peter': 'Warnings about false teachers and reminders to grow in knowledge and character. Remain alert and live responsibly.',
  '1john': 'The connection between belief in Jesus, love for others, and truth. Reassurance while challenging readers to make faith visible.',
  '2john': 'Hold together truth and love while remaining discerning about misleading teaching.',
  '3john': 'Hospitality, cooperation, and humility support a healthy community. Generous versus controlling leadership.',
  jude: 'A forceful warning about people who distort the faith. Remain grounded and care for others with mercy and discernment.',
  revelation: 'A symbolic vision of evil, endurance, judgment, and the renewal of creation. Oppressive powers do not have the final word.',
};

function getDescription(slug: string, name: string): string {
  return (
    BOOK_DESCRIPTIONS[slug] ??
    `The book of ${name}. A key part of the biblical narrative that offers wisdom, history, and spiritual insight for readers.`
  );
}

export default function TestamentPage() {
  const { testament } = useParams<{ testament: string }>();
  const isOT = testament === 'ot';
  const books: BookMeta[] = isOT
    ? getOldTestamentBooks()
    : getNewTestamentBooks();
  const label = isOT ? 'Old Testament' : 'New Testament';

  const [infoOpen, setInfoOpen] = useState<string | null>(null);

  if (testament !== 'ot' && testament !== 'nt') {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-cream/50 text-lg">Testament not found.</p>
        <Link to="/library" className="btn-outline inline-block">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Link
            to="/library"
            className="text-cream/40 hover:text-cream transition-colors"
            aria-label="Back to library"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <BookOpen className="w-6 h-6 text-gold-500" />
          <h1 className="text-3xl font-serif font-bold text-cream">{label}</h1>
        </div>
        <p className="text-cream/40 text-sm">
          {books.length} books &middot; World English Bible
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {books.map((book, index) => (
          <div key={book.slug} className="relative">
            <Link
              to={`/library/${book.slug}`}
              className="card group hover:border-gold-500/30 transition-all duration-200 cursor-pointer block !p-4"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl font-bold text-cream/8 font-sans leading-none shrink-0 w-6 text-right">
                  {index + 1}
                </span>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-serif font-semibold text-cream group-hover:text-gold-400 transition-colors text-sm">
                    {book.name}
                  </h3>
                  <span className="text-xs text-cream/30">
                    {book.chapterCount} chapter{book.chapterCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </Link>

            {/* Info button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInfoOpen(infoOpen === book.slug ? null : book.slug);
              }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full text-cream/15 hover:text-gold-400 hover:bg-gold-500/10 transition-colors flex items-center justify-center z-10"
              aria-label={`About ${book.name}`}
              title={`About ${book.name}`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Info tooltip */}
            {infoOpen === book.slug && (
              <div className="absolute top-0 right-0 z-20 w-64 bg-navy-800 border border-gold-500/20 rounded-xl p-4 shadow-lg shadow-navy-900/50 -translate-y-2 translate-x-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-gold-400 font-serif font-semibold text-sm">
                    {book.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setInfoOpen(null)}
                    className="text-cream/30 hover:text-cream/60 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-cream/50 text-xs leading-relaxed">
                  {getDescription(book.slug, book.name)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Click-away overlay to close info */}
      {infoOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setInfoOpen(null)}
        />
      )}
    </div>
  );
}
