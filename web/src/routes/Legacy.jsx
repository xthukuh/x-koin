import { Link } from 'react-router-dom';

/**
 * The three legacy pages are preserved as static HTML, built by
 * scripts/inline-data.mjs into public/legacy/. They are shown in a full-height
 * iframe rather than ported to React, so what an investor or a landlord sees is
 * exactly the file that gets published.
 */
export default function Legacy({ file, title }) {
  const src = `/legacy/${file}`;
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b border-neutral-300 bg-neutral-100 px-4 py-2 text-sm">
        <Link className="font-medium underline" to="/">
          xKoin index
        </Link>
        <span className="text-neutral-500">{title}</span>
        <a className="ml-auto text-neutral-500 underline" href={src}>
          open standalone
        </a>
      </div>
      <iframe className="min-h-0 w-full grow border-0" src={src} title={title} />
    </div>
  );
}
