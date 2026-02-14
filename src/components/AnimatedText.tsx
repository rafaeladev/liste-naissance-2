export default function AnimatedText({
    text,
    className = '',
    delayMs = 0,
    staggerMs = 25,
}: {
    text: string;
    className?: string;
    delayMs?: number;
    staggerMs?: number;
}) {
    return (
        <span
            className={className}
            aria-label={text}
            role='text'
        >
            {Array.from(text).map((char, i) => (
                <span
                    key={`${char}-${i}`}
                    className='inline-block animate-float-gentle will-change-transform'
                    style={{ animationDelay: `${delayMs + i * staggerMs}ms` }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
}
