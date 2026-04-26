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
    if (page.object === 'error') return res.status(404).json({ error: page.message });
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.json(normalize(page));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
