const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

const CONTEXT = `FELLOWSHIP CHURCH KNOXVILLE — CORE BELIEFS & TEACHINGS

GOD THE FATHER: Orders and directs all things according to His own purpose, pleasure and grace. Created the universe by His own pure power. Graciously involves Himself in the affairs of men, hears and answers prayer, and saves from sin and death all who come to Him through Jesus Christ (Matt. 6:9; John 5:19-24; Eph. 1:3-6).

GOD THE SON: Jesus Christ is the eternally co-existing Son of God who became fully man without ceasing to be fully God. God's only begotten Son (Jn. 3:16) and our sole Mediator (I Tim. 2:5). Preexistence (Jn. 1:1), substitutionary atonement (Rom. 3:23-25), bodily resurrection (Acts 2:24-27), and bodily return from heaven (Tit. 2:13). Now in heaven exalted at the right hand of the Father, where as High Priest He fulfills the ministry of intercession and advocacy (Heb. 12:3).

GOD THE SPIRIT: Restrains evil, convicts men of sin, righteousness, and judgment. Regenerates those who receive Christ, baptizes them into the Church, indwells permanently, intercedes in prayer, seals unto the day of redemption, bestows spiritual gifts, and empowers those yielded to Him (Matt. 28:19, Jn. 3:3-7, 16:8-11).

THE BIBLE: The Word of God; verbally inspired, inerrant in the original writings, the supreme, final, and infallible authority in doctrine and practice. One method of interpretation — the literal/historical-grammatical method (Matt. 5:16-18; II Tim. 3:16-17; II Pet. 1:20-21).

MAN: Created innocent and in the image of God, but sinned bringing physical and spiritual death to himself and his posterity. Man is now a sinner both by nature and by choice, alienated from God, and apart from salvation through Jesus Christ is eternally separated from God (Gen. 1:26-27; Rom. 3:10-18, 5:12-21; Eph. 2:1-3).

SALVATION: A gift of God received only through personal faith in Jesus Christ as Lord and Savior. Man is justified by grace through faith, apart from human merit, works, or ceremonies. All true believers, born again by the Spirit, are kept secure in Christ forever and will exhibit evidence of a transformed life (Eph. 2:8-10; Jn. 10:27-30; Rom. 8:33-39).

ORDINANCES: Two ordinances — baptism by immersion (public identification with Christ) and the Lord's Supper (memorial of the atoning death of Christ until He comes) (Matt. 28:19; I Cor. 11:23-24).

THE CHURCH: The Universal Church is a spiritual organism comprised of all who have expressed saving faith in Jesus Christ. Began at Pentecost. The local church is an assembly of professed believers voluntarily joined for worship, study of the Word, observance of the ordinances, fellowship, and equipping for service. Governed by a plurality of elders (Acts 2:41-47; I Cor. 12:12-13; I Pet. 5:1-2).

SPIRITUAL GIFTS: The Holy Spirit gives gifts to every believer for building up the body of Christ, exercised according to biblical guidelines (Rom. 12:3-8; 1 Cor. 12, 14). The Spirit is sovereign and may give any gifts at any time (1 Cor. 12:11).

FUTURE THINGS: Belief in the personal, bodily and visible return of Jesus Christ to establish His Kingdom, over which He will reign in righteousness and peace (Is. 9:6-7; 11:2-5).

DENOMINATIONAL AFFILIATION: Member of the Evangelical Free Church of America (EFCA).

BIBLICAL TRANSLATION: ESV (English Standard Version) used in teaching unless otherwise stated.

POSITION PAPERS: Fellowship has published position papers on topics including spiritual gifts (A Vision for Unity), marriage and sexuality, roles of men and women, baptism, alcohol, and other cultural topics. Full papers at fellowshipknox.org/positionpapers.`;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { question } = req.body || {};
  if (!question || !question.trim()) return res.status(400).json({ error: 'Missing question' });

  if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'AI key not configured' });

  const prompt = `You are a theological assistant for Fellowship Church Knoxville. Answer the question using Fellowship's stated beliefs below.

Rules:
- Keep your answer to 3-5 sentences
- Quote specific Bible passages when relevant
- Format Bible verse links as markdown: [Book Chapter:Verse](https://www.biblegateway.com/passage/?search=Book+Chapter%3AVerse&version=ESV)
- If a question is outside Fellowship's stated beliefs, say so honestly
- Reference position papers at fellowshipknox.org/positionpapers when relevant

${CONTEXT}

Question: ${question}`;

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GOOGLE_AI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
      }),
    });
    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content || 'Could not generate an answer.';
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
