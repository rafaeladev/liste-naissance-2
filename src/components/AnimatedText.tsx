export default function AnimatedText({
    text,
    className = '',
    delayMs = 0,
    staggerMs = 120, // plus lent car par mot
}: {
    text: string;
    className?: string;
    delayMs?: number;
    staggerMs?: number;
}) {
    const words = text.split(' ');

    return (
        <span
            className={className}
            aria-label={text}
            role='text'
        >
            {words.map((word, i) => (
                <span
                    key={`${word}-${i}`}
                    className='inline-block animate-float-gentle will-change-transform'
                    style={{ animationDelay: `${delayMs + i * staggerMs}ms` }}
                >
                    {word}
                    {/* espace qui, lui, peut wrap */}
                    {i < words.length - 1 ? '\u00A0' : ''}
                </span>
            ))}
        </span>
    );
}
