const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB = "34edc244-8617-81b8-ada6-dc6062b273a0";
const { getBook, ALL_BOOKS_FULL } = require('../lib/book-utils');

const OT_BOOKS=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"];
const NT_BOOKS=["Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

function txt(p,key){return(p[key]&&p[key].rich_text?p[key].rich_text.map(t=>t.plain_text).join(""):"")||"";}

module.exports=async function handler(req,res){
  try{
    let results=[];
    let cursor=undefined;
    do{
      const body={page_size:100,sorts:[{property:"Date",direction:"descending"}]};
      if(cursor)body.start_cursor=cursor;
      const r=await fetch("https://api.notion.com/v1/databases/"+NOTION_DB+"/query",{
        method:"POST",
        headers:{"Authorization":"Bearer "+NOTION_TOKEN,"Notion-Version":"2022-06-28","Content-Type":"application/json"},
        body:JSON.stringify(body),
      });
      const data=await r.json();
      if(data.results)results=results.concat(data.results);
      cursor=data.has_more?data.next_cursor:undefined;
    }while(cursor);

    const speakerCounts={};
    const bookCounts={};
    const topicCounts={};
    const unmatchedScriptures=[];

    for(const page of results){
      const p=page.properties;
      const date=p["Date"]&&p["Date"].date?p["Date"].date.start:"";
      if(!date)continue;
      const speaker=txt(p,"Speaker");
      if(speaker)speakerCounts[speaker]=(speakerCounts[speaker]||0)+1;
      const scripture=txt(p,"Scripture");
      const book=getBook(scripture);
      if(book){
        bookCounts[book]=(bookCounts[book]||0)+1;
      } else if(scripture){
        unmatchedScriptures.push(scripture);
      }
      const topics=p["Topics"]&&p["Topics"].multi_select?p["Topics"].multi_select.map(s=>s.name):[];
      topics.forEach(t=>{topicCounts[t]=(topicCounts[t]||0)+1;});
    }

    const speakers=Object.entries(speakerCounts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));
    const books={};
    [...OT_BOOKS,...NT_BOOKS].forEach(b=>{books[b]=bookCounts[b]||0;});
    const topics=Object.entries(topicCounts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));
    const total=results.filter(p=>p.properties["Date"]&&p.properties["Date"].date).length;

    res.setHeader("Cache-Control","s-maxage=600,stale-while-revalidate=1200");
    const resp={speakers,books,topics,total};
    // debug: include unmatched samples when ?debug=1
    if(req.query&&req.query.debug){
      resp.unmatched_count=unmatchedScriptures.length;
      resp.unmatched_sample=unmatchedScriptures.slice(0,60);
    }
    res.json(resp);
  }catch(err){
    res.status(500).json({error:err.message});
  }
};
