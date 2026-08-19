import { useEffect } from 'react';

interface DocumentMeta {
  title: string;
  description?: string;
  image?: string;
  /** Absolute canonical URL for this page. */
  canonical?: string;
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Keeps <title>, the description, Open Graph tags and the canonical link in
 * step with the data the app rendered. The same values are baked into
 * index.html at build time for crawlers that never run JavaScript; this hook
 * covers client-side navigation and the admin routes.
 */
export function useDocumentMeta({ title, description, image, canonical }: DocumentMeta): void {
  useEffect(() => {
    document.title = title;

    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);

    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    }

    if (image) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', image);
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    }

    if (canonical) {
      setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);

      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }
  }, [title, description, image, canonical]);
}
