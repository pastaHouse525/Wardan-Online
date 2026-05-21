import { useEffect } from "react";

interface SEOMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  structuredData?: object;
}

const SITE_NAME = "وردان أونلاين";
const DEFAULT_DESCRIPTION = "سوق وردان الإلكتروني الشامل — بيع وشراء العقارات والمواشي والطيور والملابس والأجهزة المنزلية، ودليل الخدمات من مطاعم وفنيين وتعليم وأكثر في منطقة وردان، الجيزة، مصر.";
const DEFAULT_IMAGE = "https://wardanonline.com/opengraph.jpg";
const BASE_URL = "https://wardanonline.com";

function setMeta(name: string, content: string, useProperty = false) {
  const attr = useProperty ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOrRemoveJsonLd(data: object | undefined) {
  const existing = document.getElementById("__structured_data__");
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement("script");
  script.id = "__structured_data__";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export default function SEOMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  structuredData,
}: SEOMetaProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    document.title = fullTitle;

    setMeta("description", description);
    setMeta("keywords", "وردان، سوق وردان، إعلانات وردان، عقارات وردان، مواشي، طيور، خضروات، ملابس، أجهزة منزلية، خدمات وردان، مطاعم، فنيون، تعليم، وظائف، الجيزة، مصر");
    setMeta("author", SITE_NAME);
    setMeta("language", "ar");

    setMeta("og:type", type, true);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:image", image, true);
    setMeta("og:url", fullUrl, true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("og:locale", "ar_EG", true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);

    setOrRemoveJsonLd(structuredData);

    return () => {
      document.title = SITE_NAME;
      setOrRemoveJsonLd(undefined);
    };
  }, [fullTitle, description, image, fullUrl, type, structuredData]);

  return null;
}
