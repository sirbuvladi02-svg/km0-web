'use client';

interface SponsorCardProps {
  imageUrl: string;
  title: string;
  description: string;
}

export default function SponsorCard({ imageUrl, title, description }: SponsorCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 pointer-events-none" />
      <div className="relative flex gap-3 items-start">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/30">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-green-700 text-sm uppercase tracking-tight mb-1">
            {title}
          </h4>
          <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
