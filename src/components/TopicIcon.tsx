import {
  Cross,
  Feather,
  Heart,
  Lightbulb,
  Handshake,
  Flame,
  Sun,
  Gem,
  HeartHandshake,
  Leaf,
  Mountain,
  Shield,
  BookOpen,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const TOPIC_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Cross,
  Feather,
  Heart,
  Lightbulb,
  Handshake,
  Flame,
  Sun,
  Gem,
  HeartHandshake,
  Leaf,
  Mountain,
  Shield,
  BookOpen,
};

interface TopicIconProps {
  name: string;
  className?: string;
}

export default function TopicIcon({ name, className = 'w-5 h-5' }: TopicIconProps) {
  const Icon = TOPIC_ICON_MAP[name] || BookOpen;
  return <Icon className={className} />;
}
