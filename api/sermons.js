const NOTION_TOKEN = process.env.NOTION_TOKEN; // required
const NOTION_DB = process.env.NOTION_DB || '348dc244-8617-8116-a22d-e6c70a3dbad3';

function txt(p, key) {
  return (p[key] && p[key].rich_text ? p[key].rich_text.map(t => t.plain_text).join('') : '') || '';
}

function normalize(page) {
  const p = page.properties;
  return {
    id: page.id,
    title: p['Title'] && p['Title'].title ? p['Title'].title.map(t => t.plain_text).join('') : '',
    date: p['Date'] && p['Date'].date ? p['Date'].date.start : '',
    preacher: txt(p, 'Preacher'),
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

    const sermons = results.map(normalize).filter(s => s.date);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    res.json({ sermons, count: sermons.length, lastSync: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
