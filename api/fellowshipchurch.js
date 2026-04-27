const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB = '34edc244-8617-81b8-ada6-dc6062b273a0';
const { getBook } = require('./book-utils');

function txt(p, key) {
  return (p[key] && p[key].rich_text ? p[key].rich_text.map(t => t.plain_text).join('') : '') || '';
}

function normalize(page) {
  const p = page.properties;
  return {
    id: page.id,
    title: p['Title'] && p['Title'].title ? p['Title'].title.map(t => t.plain_text).join('') : '',
    date: p['Date'] && p['Date'].date ? p['Date'].date.start : '',
    speaker: txt(p, 'Speaker'),
    series: txt(p, 'Series'),
    scripture: txt(p, 'Scripture'),
    topics: p['Topics'] && p['Topics'].multi_select ? p['Topics'].multi_select.map(s => s.name) : [],
    officialSummary: txt(p, 'Official Summary'),
    youtubeUrl: p['YouTube URL'] ? p['YouTube URL'].url || '' : '',
    youtubeDescription: txt(p, 'YouTube Description'),
    studyGuideUrl: p['Study Guide URL'] ? p['Study Guide URL'].url || '' : '',
    studyGuideText: txt(p, 'Study Guide Text'),
  };
}

function matchesSearch(s, q) {
  const hay = (s.title + ' ' + s.speaker + ' ' + s.scripture + ' ' + s.series + ' ' + (s.topics || []).join(' ')).toLowerCase();
  return hay.includes(q);
}

function matchesScripture(s, filterFullName) {
  // filterFullName is a full book name like "Romans" (lowercased)
  const book = getBook(s.scripture);
  if (book && book.toLowerCase() === filterFullName) return true;
  // Fallback: raw includes (handles already-full names stored directly)
  return s.scripture.toLowerCase().includes(filterFullName);
}

module.exports = async function handler(req, res) {
  try {
    let results = [];
    let cursor = undefined;
    do {
      const body = { page_size: 100, sorts: [{ property: 'Date', direction: 'descending' }] };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch('https://api.notion.com/v1/databases/' + NOTION_DB + '/query', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + NOTION_TOKEN,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.results) results = results.concat(data.results);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    let sermons = results.map(normalize).filter(s => s.date);

    const q = (req.query.search || '').toLowerCase().trim();
    const speakerFilter = (req.query.speaker || '').toLowerCase().trim();
    const topicFilter = (req.query.topic || '').toLowerCase().trim();
    const scriptureFilter = (req.query.scripture || '').toLowerCase().trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = 20;

    if (q) sermons = sermons.filter(s => matchesSearch(s, q));
    if (speakerFilter) sermons = sermons.filter(s => s.speaker.toLowerCase().includes(speakerFilter));
    if (topicFilter) sermons = sermons.filter(s => (s.topics || []).some(t => t.toLowerCase().includes(topicFilter)));
    if (scriptureFilter) sermons = sermons.filter(s => matchesScripture(s, scriptureFilter));

    const total = sermons.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = sermons.slice((page - 1) * pageSize, page * pageSize);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json({ sermons: paginated, total, page, totalPages, lastSync: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
