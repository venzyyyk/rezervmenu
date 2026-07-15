import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center">
      <p className="text-[10px] tracking-[.4em] uppercase text-sage mb-4">404</p>
      <h1 className="font-serif text-5xl font-light text-cream mb-4">Сторінку не знайдено</h1>
      <div className="mx-auto mb-8 h-px w-16 bg-gradient-to-r from-transparent via-sage to-transparent" />
      <p className="text-sm text-muted mb-8">Можливо, посилання застаріло або сторінка була видалена</p>
      <Link
        href="/"
        className="rounded-xl bg-sage px-6 py-3 text-sm font-medium text-base transition-opacity hover:opacity-90"
      >
        На головну
      </Link>
    </div>
  );
}
