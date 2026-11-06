import {
  BookOpen,
  Heart,
  Star,
  Flame,
  Shield,
  Crown,
  Music,
  Mountain,
  Anchor,
  Cross,
  Lightbulb,
  Feather,
  Gem,
  Leaf,
  Sun,
  Moon,
  Flower2,
  Sword,
  Hand,
  Sparkles,
  Scroll,
  Church,
  Waves,
  Compass,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { CollectionIconName } from '../../lib/collections';

const ICON_MAP: Record<CollectionIconName, React.ComponentType<LucideProps>> = {
  BookOpen,
  Heart,
  Star,
  Flame,
  Shield,
  Crown,
  Music,
  Mountain,
  Anchor,
  Cross,
  Lightbulb,
  Feather,
  Gem,
  Leaf,
  Sun,
  Moon,
  Flower2,
  Sword,
  Hand,
  Sparkles,
  Scroll,
  Church,
  Waves,
  Compass,
};

interface CollectionIconProps {
  name: string;
  className?: string;
}

export default function CollectionIcon({ name, className = 'w-5 h-5' }: CollectionIconProps) {
  const Icon = ICON_MAP[name as CollectionIconName] || BookOpen;
  return <Icon className={className} />;
}

export { ICON_MAP };
