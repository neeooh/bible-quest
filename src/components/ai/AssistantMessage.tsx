interface AssistantMessageProps {
  content: string;
}

/** Renders a mentor reply. */
export default function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <div className="text-cream/90 text-base leading-relaxed whitespace-pre-wrap break-words">
      {content}
    </div>
  );
}
