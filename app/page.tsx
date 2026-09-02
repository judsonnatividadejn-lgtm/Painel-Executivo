"use client";

import { useEffect, useState } from "react";

type View = "gmail" | "agenda" | "noticias" | "mensagem" | null;
type LiveData = { connected: boolean; checkedAt: string; gmail: { unreadInbox: number; messages: Array<{ id: string; sender: string; subject: string; snippet: string }> }; calendar: { remainingToday: number; events: Array<{ id: string; title: string; start?: string; location?: string }> } };

const priorities = [
  { level: "Alta", title: "Recarga da Negra Rosa às 12:00", detail: "O compromisso começa em menos de uma hora. Garanta a recarga do chip antes das próximas estratégias.", tag: "Operação" },
  { level: "Média", title: "Preservar a sequência da tarde", detail: "Crostreiner às 16:00, horário curinga às 17:00 e estudo às 18:00 formam uma sequência sem folga.", tag: "Agenda" },
];

const agenda = [
  { time: "12:00", title: "Recarga do chip Negra Rosa", note: "Tarefa operacional · próximo compromisso", alert: true },
  { time: "16:00", title: "Crostreiner — JT", note: "Compromisso da tarde", alert: false },
  { time: "17:00", title: "Horário Curinga", note: "Bloco flexível", alert: false },
  { time: "18:00", title: "Estudar algo", note: "Desenvolvimento profissional ou pessoal", alert: false },
];

const emails: Array<{ sender: string; subject: string; summary: string; reason: string }> = [];

const news = [
  { category: "META ADS", title: "Meta acelera anúncios com IA e novos modelos de ranking", impact: "Os avanços elevaram cliques e conversões; vale revisar testes de criativo e atribuição nas contas.", url: "https://about.fb.com/news/2026/01/2026-ai-drives-performance/" },
  { category: "GOOGLE ADS", title: "Campanhas legadas começam a migrar para o AI Max", impact: "ACA e correspondência ampla entram na transição em setembro; antecipe auditorias para manter controle.", url: "https://blog.google/products/ads-commerce/dsa-upgrade-to-ai-max-2026/" },
  { category: "GOOGLE ADS", title: "Google Ads e Analytics recebem novos agentes de IA", impact: "Resumos, relatórios por linguagem natural e benchmarks podem acelerar diagnósticos e decisões de campanha.", url: "https://blog.google/products/ads-commerce/google-ads-analytics-ai-updates/" },
  { category: "INSTAGRAM", title: "Dados apontam maior atividade no Instagram entre 18h e 00h", impact: "É uma boa hipótese de teste para os calendários de conteúdo dos clientes — valide com dados próprios.", url: "https://blog.opinionbox.com/melhor-horario-para-postar-no-instagram/" },
  { category: "MARKETING", title: "Automação ganha espaço na nutrição e segmentação de leads", impact: "Oportunidade de reduzir tarefas manuais e acelerar follow-ups comerciais da agência e dos clientes.", url: "https://blog.opinionbox.com/ferramentas-de-automacao-de-marketing-como-funcionam-e-como-podem-ajudar-sua-empresa/" },
  { category: "IA & NEGÓCIOS", title: "Oracle abre formação gratuita de IA para negócios", impact: "Capacitação prática para Marketing, Vendas e Operações, sem exigir conhecimento técnico prévio.", url: "https://canaltech.com.br/mercado/oracle-abre-inscricoes-para-curso-gratuito-de-ia-para-negocios-veja-como-se-inscrever/" },
  { category: "VAREJO", title: "Varejo e e-commerce enfrentam trimestre mais difícil", impact: "Consumo fraco, juros e pressão sobre margens pedem campanhas mais eficientes e ofertas bem calibradas.", url: "https://www.infomoney.com.br/mercados/varejo-enfrenta-tri-dificil-mas-ca-se-destaca-diz-morgan-stanley/" },
  { category: "TECNOLOGIA", title: "Bancos brasileiros ampliam investimento em IA e dados", impact: "O setor prevê R$ 3 bilhões em IA e analytics em 2026, sinal de demanda crescente por transformação digital.", url: "https://www.infomoney.com.br/business/bancos-brasileiros-pretendem-investir-r-3-bi-em-ia-e-analise-de-dados-em-2026/" },
  { category: "TRIBUTÁRIO", title: "Agenda tributária de setembro já está disponível", impact: "Vale revisar os vencimentos do mês para antecipar obrigações e alertar clientes.", url: "https://www.gov.br/receitafederal/pt-br/assuntos/agenda-tributaria/2026/Setembro" },
].slice(0, 8);

function Icon({ children }: { children: React.ReactNode }) { return <span className="icon" aria-hidden="true">{children}</span>; }

export default function Home() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [view, setView] = useState<View>(null);
  const [requestType, setRequestType] = useState("update");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [liveError, setLiveError] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LiveData["calendar"]["events"][number] | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleStatus, setRescheduleStatus] = useState("");
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setView(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    const update = async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(`/api/google/status?t=${Date.now()}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Falha ao atualizar");
          const data = await response.json();
          if (active) { setLiveData(data); setLiveError(false); }
          return;
        } catch {
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
        }
      }
      if (active) setLiveError(true);
    };
    update();
    const timer = window.setInterval(update, 60 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const checkedAt = liveData?.checkedAt ? new Date(liveData.checkedAt) : null;
  const nextCheck = checkedAt ? new Date(checkedAt.getTime() + 60 * 60 * 1000) : null;
  const time = (date: Date | null) => date ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bahia" }) : "—";
  const hour = Number(currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", hour12: false, timeZone: "America/Bahia" }));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const todayLabel = currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bahia" }).toUpperCase();
  async function sendRequest(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setSent(false);
    const response = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: requestType, message }) });
    setSending(false);
    if (response.ok) { setMessage(""); setSent(true); }
  }
  function chooseEvent(event: LiveData["calendar"]["events"][number]) {
    setSelectedEvent(event);
    const start = event.start ? new Date(event.start) : null;
    setNewDate(start ? start.toLocaleDateString("en-CA", { timeZone: "America/Bahia" }) : "");
    setNewTime(start ? start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Bahia" }) : "");
    setRescheduleStatus("");
  }
  async function rescheduleEvent(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedEvent || !newDate || !newTime) return;
    setRescheduling(true); setRescheduleStatus("");
    const response = await fetch(`/api/google/events/${encodeURIComponent(selectedEvent.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: newDate, time: newTime }) });
    setRescheduling(false);
    if (!response.ok) { setRescheduleStatus("Não foi possível remarcar. Tente novamente."); return; }
    setRescheduleStatus("Evento remarcado no Google Agenda.");
    window.setTimeout(() => window.location.reload(), 900);
  }
  return <main>
    <header className="topbar">
      <div className="brand"><img src="/jeta-logo.png" alt="JETA Performance" /><div><strong>JETA PERFORMANCE</strong><span>Seu Painel Executivo</span></div></div>
      <div className="update"><span className="live-dot" /><div><b>{liveError ? "Último resumo preservado" : checkedAt ? `Atualizado hoje, ${time(checkedAt)}` : "Atualizando agora…"}</b><span>{nextCheck ? `Próxima atualização · ${time(nextCheck)}` : "Consultando Gmail e Agenda"}</span></div></div>
    </header>
    <section className="hero">
      <div><p className="eyebrow">{todayLabel}</p><h1>{greeting}, Judson.</h1><p>Seu painel foi atualizado. Há <b>2 pontos</b> que merecem sua atenção.</p></div>
      <div className="source-status" aria-label="Abrir detalhes das fontes">
        <button onClick={()=>setView("gmail")}><span>●</span> Gmail <small>{liveData?.gmail.unreadInbox ?? emails.length}</small></button>
        <button onClick={()=>setView("agenda")}><span>●</span> Agenda <small>{liveData?.calendar.remainingToday ?? agenda.length}</small></button>
        <button onClick={()=>setView("noticias")}><span>●</span> Notícias <small>{news.length}</small></button>
        <button className="message-button" onClick={()=>{setSent(false);setView("mensagem")}}><span>✦</span> Pedir atualização</button>
      </div>
    </section>
    <section className="attention">
      <div className="section-title"><Icon>!</Icon><div><span>ATENÇÃO IMEDIATA</span><h2>O que pode custar tempo ou oportunidade</h2></div></div>
      <div className="priority-grid">{priorities.map((item,index)=><article className="priority" key={item.title}><div className="priority-head"><span className={`rank ${index===2?"medium":""}`}>{item.level}</span><span className="tag">{item.tag}</span></div><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
    </section>
    <div className="dashboard-grid">
      <section className="panel focus-panel"><div className="section-title small"><Icon>↗</Icon><div><span>PRIORIDADES</span><h2>Hoje eu focaria em</h2></div></div><ol>
        <li><b>Concluir o bloco de trabalho atual</b><span>Você tem até 12:00 antes do próximo compromisso.</span></li>
        <li><b>Fazer a recarga do chip da Negra Rosa</b><span>A tarefa começa às 12:00 e não deve ser empurrada para a tarde.</span></li>
        <li><b>Preparar a sequência das 16:00 às 18:00</b><span>Organize antecipadamente Crostreiner, pendências e o bloco de estudo.</span></li>
      </ol></section>
      <section className="panel"><div className="section-title small"><Icon>□</Icon><div><span>AGENDA</span><h2>Compromissos que importam</h2></div></div><div className="timeline">{agenda.map(item=><div className="event" key={item.time}><time>{item.time}</time><i className={item.alert?"alert":""}/><div><b>{item.title}</b><span>{item.note}</span></div>{item.alert&&<em>PREPARAR</em>}</div>)}</div><p className="agenda-note">Não há conflitos identificados entre os compromissos principais.</p></section>
    </div>
    <section className="panel news-panel"><div className="section-title small"><Icon>⌁</Icon><div><span>RADAR DE MERCADO</span><h2>Notícias com impacto prático</h2></div></div><div className="news-grid">{news.map(item=><article key={item.title}><span>{item.category}</span><h3>{item.title}</h3><p>{item.impact}</p><a href={item.url} target="_blank" rel="noreferrer">Abrir fonte ↗</a></article>)}</div></section>
    <section className="mail-monitor"><div><span className="mail-pulse">●</span><div><b>Monitor executivo ativo</b><p>Gmail e Google Agenda são verificados ao abrir o painel e novamente a cada hora.</p></div></div><span>{nextCheck ? `PRÓXIMA ATUALIZAÇÃO · ${time(nextCheck)}` : "ATUALIZANDO AGORA"}</span></section>
    <section className="insight"><div className="insight-mark">✦</div><div><span>OBSERVAÇÃO EXECUTIVA</span><p>Não há e-mails não lidos relevantes. Seu próximo ponto de atenção é a <b>recarga do chip da Negra Rosa às 12:00</b>; depois, há uma janela livre até 16:00.</p></div></section>
    <footer><span>JETA PERFORMANCE · INFORMAÇÃO PARA DECIDIR MELHOR</span><span>Último resumo preservado automaticamente em caso de falha</span></footer>
    {view && <div className="drawer-backdrop" role="presentation" onMouseDown={(event)=>event.target===event.currentTarget&&setView(null)}><section className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="drawer-head"><div><span>{view === "mensagem" ? "FALE COM SEU EXECUTIVO" : "VISÃO DETALHADA"}</span><h2 id="drawer-title">{view === "gmail" ? "Mensagens relevantes" : view === "agenda" ? "Agenda do dia" : view === "noticias" ? "Notícias selecionadas" : "O que você precisa?"}</h2></div><button onClick={()=>setView(null)} aria-label="Fechar">×</button></div>
      {view === "gmail" && <div className="detail-list">{(liveData?.gmail.messages?.length ?? 0) === 0 ? <article className="empty-state"><span>✓</span><h3>Caixa de entrada em dia</h3><p>Nenhuma mensagem não lida foi encontrada nesta atualização.</p></article> : liveData?.gmail.messages.map((item)=><article key={item.id}><div className="detail-meta"><span>NÃO LIDO</span></div><h3>{item.subject}</h3><b>{item.sender}</b><p>{item.snippet}</p></article>)}</div>}
      {view === "agenda" && <div className="detail-list">{liveData?.calendar.events?.map(item=><button className="event-choice" type="button" key={item.id} onClick={()=>chooseEvent(item)}><div className="detail-meta"><span>{item.start ? time(new Date(item.start)) : "DIA TODO"}</span><time>CLIQUE PARA REMARCAR</time></div><h3>{item.title}</h3>{item.location&&<p>{item.location}</p>}</button>)}{selectedEvent&&<form className="request-form reschedule-form" onSubmit={rescheduleEvent}><h3>Remarcar: {selectedEvent.title}</h3><div className="reschedule-fields"><label>Nova data<input type="date" value={newDate} onChange={event=>setNewDate(event.target.value)} required /></label><label>Novo horário<input type="time" value={newTime} onChange={event=>setNewTime(event.target.value)} required /></label></div><div className="form-foot"><button type="button" onClick={()=>setSelectedEvent(null)}>Cancelar</button><button type="submit" disabled={rescheduling}>{rescheduling?"Salvando…":"Confirmar nova data ↗"}</button></div>{rescheduleStatus&&<output>{rescheduleStatus}</output>}</form>}</div>}
      {view === "noticias" && <div className="detail-list">{news.map(item=><article key={item.title}><div className="detail-meta"><span>{item.category}</span></div><h3>{item.title}</h3><p>{item.impact}</p><a href={item.url} target="_blank" rel="noreferrer">Ler notícia na fonte ↗</a></article>)}</div>}
      {view === "mensagem" && <form className="request-form" onSubmit={sendRequest}>
        <p>Registre uma atualização ou ajuste. O monitor executivo processará o pedido na próxima verificação horária.</p>
        <div className="quick-actions">
          <button type="button" className={requestType==="update"?"active":""} onClick={()=>{setRequestType("update");setMessage("Faça uma nova atualização completa do meu painel agora.")}}>Atualizar painel</button>
          <button type="button" className={requestType==="gmail"?"active":""} onClick={()=>{setRequestType("gmail");setMessage("Revise novamente os e-mails não lidos e destaque o que exige atenção.")}}>Revisar Gmail</button>
          <button type="button" className={requestType==="calendar"?"active":""} onClick={()=>{setRequestType("calendar");setMessage("Evento ou cliente: \nData e horário atual: \nNova data e horário: \nAvisar convidados: sim\nObservações: ")}}>Remarcar evento</button>
          <button type="button" className={requestType==="adjustment"?"active":""} onClick={()=>{setRequestType("adjustment");setMessage("")}}>Solicitar ajuste</button>
        </div>
        <label htmlFor="executive-message">Sua mensagem</label>
        <textarea id="executive-message" value={message} onChange={event=>setMessage(event.target.value)} placeholder="Ex.: Atualize minha agenda e destaque apenas os compromissos da tarde." maxLength={1200} required />
        <div className="form-foot"><small>{message.length}/1200</small><button type="submit" disabled={sending||!message.trim()}>{sending?"Enviando…":"Enviar solicitação ↗"}</button></div>
        {sent&&<output>Solicitação registrada para a próxima verificação horária.</output>}
      </form>}
    </section></div>}
  </main>;
}
