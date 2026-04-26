const NOTION_TOKEN = process.env.NOTION_TOKEN;

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
    youtubeDescription: txt(p, 'YouTube Description'),
  };
}

module.exports = async function handler(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    const r = await fetch('https://api.notion.com/v1/pages/' + id, {
      headers: {
        'Authorization': 'Bearer ' + NOTION_TOKEN,
        'Notion-Version': '2022-06-28',
      },
    });
    const page = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.json(normalize(page));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
