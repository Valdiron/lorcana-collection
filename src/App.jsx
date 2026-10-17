import React, { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, BookOpen, Heart, Layers, Plus, Minus, RefreshCw, SlidersHorizontal, X, ExternalLink, Download, Upload, Library, ChevronDown, CircleAlert } from 'lucide-react';

const API_URL = 'https://lorcanajson.org/files/current/en/allCards.json';
const STORAGE_KEY = 'lorcana-collection-v1';
const sampleCards = [
  { id:'demo-1', name:'Mickey Mouse', fullName:'Mickey Mouse - Brave Little Tailor', setName:'The First Chapter', ink:'Amber', cost:8, type:'Character', rarity:'Legendary', image:'', collectorNumber:1 },
  { id:'demo-2', name:'Elsa', fullName:'Elsa - Snow Queen', setName:'The First Chapter', ink:'Amethyst', cost:8, type:'Character', rarity:'Super Rare', image:'', collectorNumber:2 },
  { id:'demo-3', name:'Stitch', fullName:'Stitch - Carefree Surfer', setName:'The First Chapter', ink:'Ruby', cost:4, type:'Character', rarity:'Rare', image:'', collectorNumber:3 },
  { id:'demo-4', name:'Maleficent', fullName:'Maleficent - Monstrous Dragon', setName:'The First Chapter', ink:'Emerald', cost:7, type:'Character', rarity:'Legendary', image:'', collectorNumber:4 },
  { id:'demo-5', name:'Simba', fullName:'Simba - Protective Cub', setName:'The First Chapter', ink:'Steel', cost:1, type:'Character', rarity:'Common', image:'', collectorNumber:5 },
  { id:'demo-6', name:'Ariel', fullName:'Ariel - Whoseit Collector', setName:'The First Chapter', ink:'Sapphire', cost:2, type:'Character', rarity:'Uncommon', image:'', collectorNumber:6 }
];
function getCardName(c) { return c.fullName || c.name || c.Name || 'Carta sem nome'; }
function normalizeCard(c, i) {
  const setName = c.setName || c.set_name || c.set?.name || c.setNameEnglish || c.set?.name || c.setCode || 'Coleção';
  const images = c.images || {};
  return {
    id: String(c.id ?? c.cardId ?? c.card_id ?? `${setName}-${c.number ?? i}`),
    name: c.name || c.Name || getCardName(c),
    fullName: getCardName(c),
    setName,
    ink: c.color || c.ink || c.colors?.[0] || 'Other',
    cost: c.cost ?? c.inkCost ?? c.ink_cost ?? '—',
    type: Array.isArray(c.type) ? c.type.join(', ') : (c.type || c.cardType || 'Carta'),
    rarity: c.rarity || c.Rarity || '—',
    image: (typeof images === 'string' ? images : (images.thumbnail || images.full || images.fullFoil || images.image || '')) || c.imageUrl || c.image_url || c.image_uri || c.imageUri || c.image || c.imageURL || c.image_url_full || '',
    imageFull: (typeof images === 'object' ? (images.full || images.fullFoil || images.thumbnail || '') : '') || c.imageUrl || c.image_url || c.image_uri || c.imageUri || c.image || '',
    collectorNumber: Number(c.number ?? c.collectorNumber ?? c.collector_number ?? i + 1),
    inkable: c.inkwell ?? c.inkable ?? c.isInkable ?? c.is_inkable ?? null,
    text: c.fullText || c.text || c.effect || c.ability || c.rulesText || c.rules_text || '',
    strength: c.strength ?? null,
    willpower: c.willpower ?? null,
    lore: c.lore ?? c.loreValue ?? null,
    raw: c
  };
}
function readSaved() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
export default function App() {
  const saved = useMemo(readSaved, []);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('loading');
  const [owned, setOwned] = useState(saved.owned || {});
  const [wishlist, setWishlist] = useState(saved.wishlist || {});
  const [query, setQuery] = useState('');
  const [setFilter, setSetFilter] = useState('Todos');
  const [inkFilter, setInkFilter] = useState('Todas');
  const [rarityFilter, setRarityFilter] = useState('Todas');
  const [inkability, setInkability] = useState('Todas');
  const [costFilter, setCostFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('set');
  const [selectedCard, setSelectedCard] = useState(null);
  const [view, setView] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 36;

  async function loadCards() {
    setLoading(true); setError('');
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('A fonte de cartas respondeu com erro.');
      const json = await response.json();
      const list = Array.isArray(json) ? json : (json.cards || json.data?.cards || json.data || json.results || []);
      if (!list.length) throw new Error('A fonte não retornou cartas.');
      setCards(list.map(normalizeCard).sort((a,b) => a.setName.localeCompare(b.setName) || a.collectorNumber - b.collectorNumber));
      setSource('live');
    } catch (e) {
      setCards(sampleCards.map(normalizeCard));
      setSource('demo');
      setError('Não foi possível carregar o catálogo online. Mostrando cartas de demonstração; tente novamente quando tiver conexão.');
    } finally { setLoading(false); }
  }
  useEffect(() => { loadCards(); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ owned, wishlist })); }, [owned, wishlist]);

  const sets = useMemo(() => ['Todos', ...new Set(cards.map(c => c.setName).filter(Boolean))].sort((a,b) => a === 'Todos' ? -1 : b === 'Todos' ? 1 : a.localeCompare(b)), [cards]);
  const inks = ['Todas', 'Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];
  const rarities = useMemo(() => ['Todas', ...new Set(cards.map(c => c.rarity).filter(Boolean))].sort((a,b) => a === 'Todas' ? -1 : a.localeCompare(b)), [cards]);
  const filtered = useMemo(() => {
    const result = cards.filter(c => {
    const q = query.toLowerCase().trim();
    const matchesQuery = !q || [c.name,c.fullName,c.setName,c.ink,c.rarity,c.type].some(v => String(v || '').toLowerCase().includes(q));
    return matchesQuery && (setFilter === 'Todos' || c.setName === setFilter) &&
      (inkFilter === 'Todas' || String(c.ink).toLowerCase().includes(inkFilter.toLowerCase())) &&
      (rarityFilter === 'Todas' || c.rarity === rarityFilter) &&
      (view === 'all' || (view === 'owned' && (owned[c.id] || 0) > 0) || (view === 'wishlist' && wishlist[c.id]));
    });
    if (sortBy === 'cost') result.sort((a,b) => Number(a.cost || 0) - Number(b.cost || 0));
    else if (sortBy === 'rarity') result.sort((a,b) => String(a.rarity).localeCompare(String(b.rarity)));
    else if (sortBy === 'name') result.sort((a,b) => a.fullName.localeCompare(b.fullName));
    else result.sort((a,b) => a.setName.localeCompare(b.setName) || a.collectorNumber - b.collectorNumber);
    return result;
  }, [cards, query, setFilter, inkFilter, rarityFilter, inkability, costFilter, sortBy, view, owned, wishlist]);
  useEffect(() => setPage(1), [query, setFilter, inkFilter, rarityFilter, inkability, costFilter, sortBy, view]);
  const ownedKinds = Object.values(owned).filter(n => n > 0).length;
  const ownedCopies = Object.values(owned).reduce((a,n) => a + Number(n || 0), 0);
  const wishlistCount = Object.values(wishlist).filter(Boolean).length;
  const visible = filtered.slice(0, page * pageSize);
  function changeOwned(card, delta) { setOwned(prev => { const next = Math.max(0, (prev[card.id] || 0) + delta); const out = {...prev}; if (next) out[card.id] = next; else delete out[card.id]; return out; }); }
  function toggleWish(card) { setWishlist(prev => { const out = {...prev}; if (out[card.id]) delete out[card.id]; else out[card.id] = true; return out; }); }
  function exportData() {
    const blob = new Blob([JSON.stringify({ version:1, owned, wishlist }, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='lorcana-collection-backup.json'; a.click(); URL.revokeObjectURL(url);
  }
  function importData(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); setOwned(data.owned || {}); setWishlist(data.wishlist || {}); alert('Coleção importada com sucesso!'); } catch { alert('Arquivo inválido. Selecione um backup JSON do Lorcana Collection.'); } };
    reader.readAsText(file); e.target.value = '';
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-mark"><Sparkles size={23}/></div>
      <div className="brand-copy"><strong>Lorcana <span>Collection</span></strong><small>SUA JORNADA, SUA COLEÇÃO</small></div>
      <a className="official-link" href="https://cards.disneylorcana.com/en-US/" target="_blank" rel="noreferrer" aria-label="Site oficial"><ExternalLink size={18}/></a>
    </header>
    <main>
      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line"></span> COLECIONE A MAGIA</div>
        <h1>Seu mundo.<br/><em>Suas cartas.</em></h1>
        <p>Organize sua coleção de Lorcana, acompanhe suas conquistas e descubra as próximas cartas da sua jornada.</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => {setView('all'); document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});}}><BookOpen size={17}/> Explorar coleção</button>
          <button className="secondary-btn" onClick={exportData}><Download size={17}/> Backup</button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card"><div className="stat-icon gold"><Library size={18}/></div><div><strong>{cards.length.toLocaleString('pt-BR')}</strong><span>Cartas no catálogo</span></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Layers size={18}/></div><div><strong>{ownedKinds.toLocaleString('pt-BR')}</strong><span>Cartas coletadas</span></div></div>
        <div className="stat-card"><div className="stat-icon purple"><Sparkles size={18}/></div><div><strong>{ownedCopies.toLocaleString('pt-BR')}</strong><span>Total de cópias</span></div></div>
        <div className="stat-card"><div className="stat-icon pink"><Heart size={18}/></div><div><strong>{wishlistCount.toLocaleString('pt-BR')}</strong><span>Lista de desejos</span></div></div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="section-heading"><div><div className="eyebrow">O ARQUIVO DO ILUMINADOR</div><h2>Minha coleção</h2></div><span className="catalog-count">{filtered.length.toLocaleString('pt-BR')} cartas</span></div>
        <div className="search-row"><div className="searchbox"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar carta, personagem, coleção..." aria-label="Buscar cartas"/>{query && <button className="clear-search" onClick={()=>setQuery('')}><X size={16}/></button>}</div><button className={showFilters?'filter-btn active':'filter-btn'} onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={18}/><span>Filtros</span><ChevronDown size={15}/></button></div>
        {showFilters && <div className="filters-panel">
          <label>Coleção<select value={setFilter} onChange={e=>setSetFilter(e.target.value)}>{sets.map(s=><option key={s}>{s}</option>)}</select></label>
          <label>Tinta<select value={inkFilter} onChange={e=>setInkFilter(e.target.value)}>{inks.map(s=><option key={s}>{s}</option>)}</select></label>
          <label>Raridade<select value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)}>{rarities.map(s=><option key={s}>{s}</option>)}</select></label>
          <button className="reset-btn" onClick={()=>{setSetFilter('Todos');setInkFilter('Todas');setRarityFilter('Todas');setQuery('');}}>Limpar filtros</button>
        </div>}
        <div className="view-tabs">
          <button className={view==='all'?'selected':''} onClick={()=>setView('all')}>Todas as cartas</button>
          <button className={view==='owned'?'selected':''} onClick={()=>setView('owned')}>Minhas cartas <span>{ownedKinds}</span></button>
          <button className={view==='wishlist'?'selected':''} onClick={()=>setView('wishlist')}>Lista de desejos <span>{wishlistCount}</span></button>
        </div>
        {error && <div className="notice"><CircleAlert size={18}/><span>{error}</span><button onClick={loadCards}><RefreshCw size={15}/> Tentar novamente</button></div>}
        {loading ? <div className="loading-state"><div className="spinner"></div><strong>Invocando o catálogo...</strong><span>Carregando as cartas da sua coleção</span></div> :
          visible.length ? <div className="cards-grid">{visible.map((card,i)=><article className="card-item" key={card.id} onClick={()=>setSelectedCard(card)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')setSelectedCard(card);}}>
            <div className={'card-art ink-'+String(card.ink).toLowerCase()}>
              {card.image ? <img src={card.image} alt={card.fullName} loading={i<12?'eager':'lazy'} onError={e=>{e.currentTarget.style.display='none'; const p=e.currentTarget.parentElement; if(p && !p.querySelector('.card-placeholder')) { const d=document.createElement('div'); d.className='card-placeholder'; d.innerHTML='<span>'+String(card.name).replace(/[&<>"']/g,'')+'</span><small>Imagem indisponível</small>'; p.prepend(d); }}}/> : <div className="card-placeholder"><Sparkles size={32}/><span>{card.name}</span><small>{card.ink}</small></div>}
              <span className="rarity-tag">{card.rarity}</span>
              <button className={wishlist[card.id]?'wish-btn wished':'wish-btn'} onClick={e=>{e.stopPropagation();toggleWish(card);}} aria-label={wishlist[card.id]?'Remover dos desejos':'Adicionar aos desejos'}><Heart size={17} fill={wishlist[card.id]?'currentColor':'none'}/></button>
              {owned[card.id]>0 && <span className="owned-badge">×{owned[card.id]}</span>}
            </div>
            <div className="card-info"><div className="card-set">{card.setName}</div><h3>{card.fullName}</h3><div className="card-meta"><span className="ink-dot"></span>{card.ink}<span className="meta-divider">•</span>Custo {card.cost}</div>
              <div className="quantity-row"><span>{owned[card.id] ? 'Na sua coleção' : 'Ainda não coletada'}</span><div className="quantity-controls"><button disabled={!owned[card.id]} onClick={e=>{e.stopPropagation();changeOwned(card,-1);}} aria-label="Diminuir quantidade"><Minus size={14}/></button><strong>{owned[card.id]||0}</strong><button onClick={e=>{e.stopPropagation();changeOwned(card,1);}} aria-label="Aumentar quantidade"><Plus size={14}/></button></div></div>
            </div>
          </article>)}</div> : <div className="empty-state"><div className="empty-icon"><Search size={25}/></div><h3>Nenhuma carta encontrada</h3><p>Tente mudar a busca ou os filtros para encontrar suas cartas.</p><button className="secondary-btn" onClick={()=>{setQuery('');setSetFilter('Todos');setInkFilter('Todas');setRarityFilter('Todas');setView('all');}}>Limpar busca</button></div>}
        {!loading && visible.length < filtered.length && <button className="load-more" onClick={()=>setPage(p=>p+1)}>Carregar mais cartas <span>({visible.length} de {filtered.length})</span></button>}
        {!loading && <div className="catalog-footer"><span>{source==='live'?'Catálogo atualizado online':'Modo demonstração'}</span><button onClick={loadCards}><RefreshCw size={14}/> Atualizar catálogo</button></div>}
      </section>

      {selectedCard && <div className="modal-backdrop" onClick={()=>setSelectedCard(null)}><section className="card-detail-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelectedCard(null)} aria-label="Fechar"><X size={20}/></button><div className={'detail-art ink-'+String(selectedCard.ink).toLowerCase()}>{selectedCard.image ? <img src={selectedCard.image} alt={selectedCard.fullName} onError={e=>{e.currentTarget.style.display='none';}}/> : <div className="card-placeholder"><Sparkles size={34}/><span>{selectedCard.fullName}</span></div>}</div><div className="detail-copy"><div className="eyebrow">{selectedCard.setName} · Nº {selectedCard.collectorNumber}</div><h2>{selectedCard.fullName}</h2><div className="detail-chips"><span>{selectedCard.ink}</span><span>{selectedCard.rarity}</span><span>Custo {selectedCard.cost}</span><span>{selectedCard.inkable === true ? 'Inkable' : selectedCard.inkable === false ? 'Não inkable' : 'Tinta não informada'}</span></div><h3>Texto e habilidades</h3><p>{selectedCard.text || 'O texto de regras desta carta não está disponível na fonte de dados atual.'}</p><div className="detail-stats">{selectedCard.strength != null && <span>Força / Resistência: {String(selectedCard.strength)}</span>}{selectedCard.lore != null && <span>Lore: {String(selectedCard.lore)}</span>}</div><button className="primary-btn" onClick={()=>{changeOwned(selectedCard,1);}}>＋ Adicionar à coleção</button><a className="official-card-link" href={'https://cards.disneylorcana.com/en-US/'} target="_blank" rel="noreferrer">Consultar galeria oficial <ExternalLink size={14}/></a></div></section></div>}

      <section className="backup-banner"><div className="backup-icon"><Download size={22}/></div><div><h3>Sua coleção é sua história.</h3><p>Faça backup dos seus dados ou restaure sua coleção em outro dispositivo.</p></div><div className="backup-actions"><button onClick={exportData}><Download size={16}/> Exportar</button><label className="import-btn"><Upload size={16}/> Importar<input type="file" accept="application/json,.json" onChange={importData} hidden/></label></div></section>
      <footer><div className="footer-brand"><Sparkles size={16}/> LORCANA COLLECTION</div><p>Feito para quem coleciona magia.</p><small>Projeto independente, sem afiliação com Disney ou Ravensburger. Todas as marcas e imagens pertencem aos seus respectivos proprietários.</small></footer>
    </main>
  </div>;
}