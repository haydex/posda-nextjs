import Link from "next/link";

const navLinks = [
  // { href: "/", label: "Home" },
  // { href: "/about", label: "About" },
  // { href: "/dashboard", label: "Dashboard" },
  // { href: "/api-demo", label: "API Demo" },
  { href: "/datasets", label: "Datasets" },
  { href: "/recordsets", label: "Recordsets" },
  { href: "/transfers", label: "Transfers" },
  // { href: "/releases", label: "Releases" },
  // { href: "/drafts", label: "Drafts" },
];

export default function Navbar() {
  return (
    <header className="navbar fixed inset-x-0 top-0 z-50">
      <nav className="content-width flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-bold tracking-wide text-accent">
          POSDA Next.js
        </Link>
        <ul className="flex items-center gap-5 text-sm font-medium">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="transition-colors hover:text-accent"
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
