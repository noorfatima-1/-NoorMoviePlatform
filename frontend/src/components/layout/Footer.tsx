'use client';

import Link from 'next/link';

export default function Footer() {
  const footerLinks = [
    { label: 'FAQ', href: '#' },
    { label: 'Help Center', href: '#' },
    { label: 'Terms of Use', href: '#' },
    { label: 'Privacy', href: '#' },
    { label: 'Cookie Preferences', href: '#' },
    { label: 'Corporate Information', href: '#' },
  ];

  return (
    <footer className="bg-black/90 border-t border-gray-800 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} NoorMoviePlatform. Built with Next.js, Supabase & Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
}
