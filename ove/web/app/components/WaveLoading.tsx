'use client';

interface WaveLoadingProps {
  message?: string;
}

export function WaveLoading({ message = '당신의 얘기를 듣고 있어요' }: WaveLoadingProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-20 h-20 rounded-full border border-white/25"
            style={{
              animation: 'ove-wave 1.8s ease-out infinite',
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
      </div>
      <p className="text-ove-muted text-sm tracking-wide">{message}</p>
    </div>
  );
}
