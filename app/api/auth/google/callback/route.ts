import { googleOAuthClient } from "../../../../../lib/google";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return new Response("Autorização cancelada ou inválida.", { status: 400 });
  const { tokens } = await googleOAuthClient().getToken(code);
  if (!tokens.refresh_token) return new Response("O Google não devolveu uma credencial permanente. Revogue o acesso e tente novamente.", { status: 400 });
  const token = escapeHtml(tokens.refresh_token);
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Google conectado</title><style>body{margin:0;background:#0b0b0b;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh}.card{max-width:620px;padding:40px;border:1px solid #333;border-radius:20px;background:#151515}b{color:#ff5a00}code{display:block;overflow-wrap:anywhere;color:#151515;background:#151515;user-select:none;height:1px;overflow:hidden}</style></head><body><main class="card"><b>JETA PERFORMANCE</b><h1>Google conectado com sucesso.</h1><p>A credencial permanente foi gerada e será guardada no servidor. Você pode fechar esta página após a confirmação.</p><code id="google-refresh-token">${token}</code></main></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
