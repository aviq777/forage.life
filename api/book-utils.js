// Shared abbreviation → full name map (SBL style + common variants)
const BOOK_ABBREVS = {
  // OT
  "Gen":"Genesis","Exod":"Exodus","Ex":"Exodus","Lev":"Leviticus","Num":"Numbers","Deut":"Deuteronomy",
  "Josh":"Joshua","Judg":"Judges",
  "1Sam":"1 Samuel","2Sam":"2 Samuel","1Kgs":"1 Kings","2Kgs":"2 Kings",
  "1Chr":"1 Chronicles","2Chr":"2 Chronicles",
  "Neh":"Nehemiah","Esth":"Esther",
  "Ps":"Psalms","Pss":"Psalms","Psa":"Psalms",
  "Prov":"Proverbs","Eccl":"Ecclesiastes","Song":"Song of Solomon",
  "Isa":"Isaiah","Jer":"Jeremiah","Lam":"Lamentations","Ezek":"Ezekiel","Dan":"Daniel",
  "Hos":"Hosea","Obad":"Obadiah","Mic":"Micah","Nah":"Nahum","Hab":"Habakkuk",
  "Zeph":"Zephaniah","Hag":"Haggai","Zech":"Zechariah","Mal":"Malachi",
  // NT
  "Matt":"Matthew",
  "Rom":"Romans","1Cor":"1 Corinthians","2Cor":"2 Corinthians",
  "Gal":"Galatians","Eph":"Ephesians","Phil":"Philippians","Col":"Colossians",
  "1Thess":"1 Thessalonians","2Thess":"2 Thessalonians",
  "1Tim":"1 Timothy","2Tim":"2 Timothy",
  "Tit":"Titus","Phlm":"Philemon","Heb":"Hebrews","Jas":"James",
  "1Pet":"1 Peter","2Pet":"2 Peter","1John":"1 John","2John":"2 John","3John":"3 John",
  "Rev":"Revelation",
};

const ALL_BOOKS_FULL = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

function getBook(scripture) {
  if (!scripture) return null;
  const m = scripture.match(/^(\d+[A-Za-z]+|[A-Za-z]+)/);
  if (!m) return null;
  const token = m[1];
  if (BOOK_ABBREVS[token]) return BOOK_ABBREVS[token];
  const tokenLower = token.toLowerCase();
  const abbrevKey = Object.keys(BOOK_ABBREVS).find(k => k.toLowerCase() === tokenLower);
  if (abbrevKey) return BOOK_ABBREVS[abbrevKey];
  const full = ALL_BOOKS_FULL.find(b => b.toLowerCase().startsWith(tokenLower));
  return full || null;
}

module.exports = { BOOK_ABBREVS, ALL_BOOKS_FULL, getBook };
