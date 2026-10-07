import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container py-5 text-center">
      <h1 className="h3">Page not found</h1>
      <p className="text-muted">The page you requested does not exist.</p>
      <Link href="/" className="btn btn-primary">Return to dashboard</Link>
    </main>
  );
}
