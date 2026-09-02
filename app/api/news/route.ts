export const dynamic = "force-dynamic";

const feeds = [
  { category: "META & INSTAGRAM", query: "(Meta Ads OR Instagram) marketing inovação" },
  { category: "GOOGLE ADS", query: "Google Ads marketing digital inteligência artificial" },
  { category: "MARKETING", query: "site:blog.opinionbox.com marketing comportamento consumidor inovação" },
  { category: "TECNOLOGIA", query: "site:canaltech.com.br tecnologia inteligência artificial empresas" },
  { category: "NEGÓCIOS", query: "site:infomoney.com.br empresas investimento varejo ecommerce economia" },
  { category: "BRASIL", query: "site:estadao.com.br economia empresas tecnologia clima El Niño" },
  { category: "TRIBUTÁRIO", query: "Brasil mudança tributária empresas varejo ecommerce" },
];

const excluded = /morre|morte|assassin|crime|tragédia|funeral|celebridade|fofoca/i;
const decode = (value: string) => value
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function loadFeed(category: string, query: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:1d")}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const response = await fetch(url, { next: { revalidate: 21600 } });
  if (!response.ok) return [];
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3).map((match) => {
    const item = match[1];
    const title = decode(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").replace(/\s+-\s+[^-]+$/, "");
    const link = decode(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
    const source = decode(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "Fonte selecionada");
    return { category, title, url: link, impact: `${source}: atualização recente com possível impacto em decisões de marketing, tecnologia ou negócios.` };
  }).filter((item) => item.title && item.url && !excluded.test(item.title));
}

export async function GET() {
  try {
    const batches = await Promise.all(feeds.map((feed) => loadFeed(feed.category, feed.query)));
    const seen = new Set<string>();
    const articles = batches.flat().filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
    return Response.json({ articles, checkedAt: new Date().toISOString() }, {
      headers: { "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch {
    return Response.json({ articles: [], error: "news_unavailable" }, { status: 502 });
  }
}
