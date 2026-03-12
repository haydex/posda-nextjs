import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/api-demo", label: "API Demo" },
];

export default function Navbar() {
  return (
    <header className="border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/15 dark:bg-black/80">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          POSDA Next.js
        </Link>
        <ul className="flex items-center gap-5 text-sm font-medium">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
