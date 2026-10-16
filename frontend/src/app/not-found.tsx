import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#F8F6F0] text-[#161A18]">
      <div className="border border-[#E5E0D6] bg-white p-8 max-w-md text-center rounded-sm shadow-sm">
        <span className="font-sans text-xs font-semibold text-[#183D33] uppercase tracking-wider block mb-2">
          404 / Protocol Notice
        </span>
        <h2 className="font-sans text-xl font-semibold mb-2 text-[#161A18] tracking-tight">Record Not Found</h2>
        <p className="text-[#6B736D] text-sm mb-6 font-sans leading-relaxed">
          The requested concierge record or executive route does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 border border-[#183D33] bg-[#183D33] text-white text-xs font-semibold tracking-wider uppercase transition-colors hover:bg-[#224F43] rounded-sm shadow-sm"
        >
          Return to Terminal
        </Link>
      </div>
    </div>
  );
}
