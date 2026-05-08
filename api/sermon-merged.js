// Merged sermon endpoint — returns both Fellowship's official record (Subsplash)
// and the Forage AI analysis record (YouTube/Gemini), joined by date.
//
// Inputs (any one):
//   ?id=<fellowship-DB-page-id>   (default — what /fellowship/sermon links use)
//   ?oid=<official-DB-page-id>    (used by legacy /fellowshipchurch/sermon links)
//   ?date=YYYY-MM-DD              (direct date lookup)
//
// Output:
//   { date, fellowship: {...}|null, official: {...}|null }

const NOTION_TOKEN  = process.env.NOTION_TOKEN;
const FELLOWSHIP_DB = '348dc244-8617-8116-a22d-e6c70a3dbad3';  // YouTube/Gemini analysis
const OFFICIAL_DB   = '34edc244-8617-81b8-ada6-dc6062b273a0';  // Subsplash official

const NOTION_HEADERS = {
  'Authorization': 'Bearer ' + NOTION_TOKEN,
  'Notion-Version': '2022-06-28',
  'Content-Type':   'application/json',
};

function txt(p, key) {
  return (p[key] && p[key].rich_text ? p[key].rich_text.map(t => t.plain_text).join('') : '') || '';
}

function pickTitle(p) {
  return p['Title'] && p['Title'].title ? p['Title'].title.map(t => t.plain_text).join('') : '';
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

function normFellowship(page) {
  if (!page || page.object === 'error') return null;
  const p = page.properties || {};
  return {
    id: page.id,
    title: pickTitle(p),
    date: p['Date'] && p['Date'].date ? p['Date'].date.start : '',
    preacher: normPreacher(txt(p, 'Preacher')),
    series: txt(p, 'Series'),
    passage: txt(p, 'Passage'),
    youtubeUrl: p['YouTube URL'] ? p['YouTube URL'].url || '' : '',
    youtubeDescription: txt(p, 'YouTube Description'),
    coreProblem: txt(p, 'Core Problem'),
    coreSolution: txt(p, 'Core Solution'),
    coreTension: txt(p, 'Core Tension'),
    natureOfGod: txt(p, 'Nature of God'),
    keyQuote: txt(p, 'Key Quote'),
    greekHebrew: txt(p, 'Greek/Hebrew Words'),
    callToAction: txt(p, 'Call to Action'),
    promise: txt(p, 'Promise from God'),
    sinFearFalseBelief: txt(p, 'Sin/Fear/False Belief'),
    seriesConnection: txt(p, 'Series Connection'),
    crossReferenceThemes: txt(p, 'Cross-Reference Themes'),
    summary: txt(p, 'Summary'),
    booksOfBible: txt(p, 'Books of Bible'),
    topics: p['Topics'] && p['Topics'].multi_select ? p['Topics'].multi_select.map(s => s.name) : [],
  };
}

function normOfficial(page) {
  if (!page || page.object === 'error') return null;
  const p = page.properties || {};
  return {
    id: page.id,
    title: pickTitle(p),
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

async function getPage(id) {
  const r = await fetch('https://api.notion.com/v1/pages/' + id, { headers: NOTION_HEADERS });
  return r.json();
}

async function queryByDate(dbId, date) {
  const r = await fetch('https://api.notion.com/v1/databases/' + dbId + '/query', {
    method: 'POST',
    headers: NOTION_HEADERS,
    body: JSON.stringify({
      filter: { property: 'Date', date: { equals: date } },
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 5,
    }),
  });
  const d = await r.json();
  return (d.results || [])[0] || null;
}

module.exports = async function handler(req, res) {
  try {
    const { id, oid, date } = req.query;
    let fellowshipPage = null;
    let officialPage = null;
    let lookupDate = date;

    if (id) {
      fellowshipPage = await getPage(id);
      lookupDate = fellowshipPage && fellowshipPage.properties && fellowshipPage.properties['Date']
        && fellowshipPage.properties['Date'].date ? fellowshipPage.properties['Date'].date.start : null;
    } else if (oid) {
      officialPage = await getPage(oid);
      lookupDate = officialPage && officialPage.properties && officialPage.properties['Date']
        && officialPage.properties['Date'].date ? officialPage.properties['Date'].date.start : null;
    }

    if (lookupDate) {
      const dateOnly = lookupDate.slice(0, 10);
      if (!fellowshipPage) fellowshipPage = await queryByDate(FELLOWSHIP_DB, dateOnly);
      if (!officialPage)   officialPage   = await queryByDate(OFFICIAL_DB, dateOnly);
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json({
      date: lookupDate ? lookupDate.slice(0, 10) : null,
      fellowship: normFellowship(fellowshipPage),
      official:   normOfficial(officialPage),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
