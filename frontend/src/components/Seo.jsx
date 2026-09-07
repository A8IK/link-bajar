import { Helmet } from 'react-helmet-async';

const SITE = import.meta.env.VITE_SITE_NAME || 'Link Bajar';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://linkbajar.com';

export default function Seo({ title, description, image, path = '', noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — SEO Link Marketplace`;
  const url = `${SITE_URL}${path}`;
  const desc =
    description ||
    'Marketplace for guest posts, link insertions, HARO and SEO services. Connect with vetted publishers.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
