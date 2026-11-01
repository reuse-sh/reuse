import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="reading-page">
      <p className="eyebrow">404</p>
      <h1>This page is missing.</h1>
      <p>Find the library in the collection.</p>
      <Link className="text-link" href="/#libraries">
        Explore libraries
      </Link>
    </main>
  );
}
