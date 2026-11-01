import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="c-col" style={{ paddingBlock: "96px 40px" }}>
      <h1 className="c-h1">This page is missing.</h1>
      <p className="c-text">
        The address may be old. Every library is in the Libraries menu above.
      </p>
      <Link className="c-link" href="/">
        Go to the home page
      </Link>
    </main>
  );
}
