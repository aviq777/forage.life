const NOTION_TOKEN = process.env.NOTION_TOKEN; // required
const NOTION_DB = process.env.NOTION_DB || '348dc244-8617-8116-a22d-e6c70a3dbad3';

function txt(p, key) {
  return (p[key] && p[key].rich_text ? p[key].rich_text.map(t => t.plain_text).join('') : '') || '';
}

const PREACHER_MAP = {
  'RD McClenagan':'RD','Rd McClenagan':'RD','Rd':'RD',
  'Greg Pinkner':'Greg','Greg Fner':'Greg',
  'Greg Pinkner, Jesse Overbay (reader)':'Greg',
  'Devon Accardi':'Devon','Devin Accardi':'Devon','Devin':'Devon','Devin (Devon)':'Devon',
  'JC Neely':'JC','Rick Dunn':'Rick','Rick Nelson':'Rick',
  'Rick (likely Rick Nelson)':'Rick',
  'Not explicitly identified (colleague of Rick Dunn)':'Rick',
  'Zach Hume':'Zach','Brady Raby':'Brady',
  'Unknown':'','Not specified':'','Not mentioned':'',
};

function normPreacher(name) {
  if (!name) return '';
  if (PREACHER_MAP[name] !== undefined) return PREACHER_MAP[name];
  return name.split(' ')[0];
}

function normalize(page) {
  const p = page.properties;
  return {
    id: page.id,
    title: p['Title'] && p['Title'].title ? p['Title'].title.map(t => t.plain_text).join('') : '',
    date: p['Date'] && p['Date'].date ? p['Date'].date.start : '',
    preacher: normPreacher(txt(p, 'Preacher')),
    series: txt(p, 'Series'),
    passage: txt(p, 'Passage'),
    youtubeUrl: p['YouTube URL'] ? p['YouTube URL'].url || '' : '',
    coreProblem: txt(p, 'Core Problem'),
    coreSolution: txt(p, 'Core Solution'),
    natureOfGod: txt(p, 'Nature of God'),
    greekHebrew: txt(p, 'Greek/Hebrew Words'),
    callToAction: txt(p, 'Call to Action'),
    promise: txt(p, 'Promise from God'),
    coreTension: txt(p, 'Core Tension'),
    keyQuote: txt(p, 'Key Quote'),
    topics: p['Topics'] && p['Topics'].multi_select ? p['Topics'].multi_select.map(s => s.name) : [],
    booksOfBible: txt(p, 'Books of Bible'),
    summary: txt(p, 'Summary'),
    sinFearFalseBelief: txt(p, 'Sin/Fear/False Belief'),
    seriesConnection: txt(p, 'Series Connection'),
    crossReferenceThemes: txt(p, 'Cross-Reference Themes'),
  };
}

function richness(s) {
  return (s.summary ? 4 : 0) + (s.passage ? 3 : 0) + (s.keyQuote ? 3 : 0) +
    (s.preacher ? 1 : 0) + (s.topics.length ? 1 : 0) + (s.series ? 1 : 0);
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

    const all = results.map(normalize).filter(s => s.date);

    // Deduplicate by date — keep the richest page per date
    const byDate = {};
    all.forEach(s => {
      if (!byDate[s.date] || richness(s) > richness(byDate[s.date])) {
        byDate[s.date] = s;
      }
    });
    const sermons = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json({ sermons, count: sermons.length, lastSync: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

