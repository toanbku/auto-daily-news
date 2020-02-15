const Parser = require('rss-parser');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const fs = require('fs');

const parser = new Parser();
const rssURL = 'https://vnexpress.net/rss/tin-moi-nhat.rss';
let browser;

const convertHtml2Img = (async () => {
  const feed = await parser.parseURL(rssURL);
  fs.writeFileSync('./feeds.json', JSON.stringify(feed.items));
  const promises = feed.items.map((item, index) => async () => {
    const regex = /src="(.*?)"/g;
    const imgUrlArr = regex.exec(item.content);
    if (imgUrlArr) {
      item.imgUrl = imgUrlArr[1].replace('180x108', '680x408');
    } else {
      item.imgUrl = 'https://i.imgur.com/1mkFvRl.jpg';
    }
    const contents = fs.readFileSync('./template/news.hbs', 'utf8');
    const template = Handlebars.compile(contents);
    let result = template(item);
    result = encodeURIComponent(result);
    const page = await browser.newPage();
    await page.goto(`data:text/html, ${result}`, { waitUntil: 'networkidle0' });
    await page.screenshot({path: `result/example${index}.png`});
  });
  await Promise.all(promises.map(p => p()))
});

const fn = async() => {
  browser = await puppeteer.launch({
    width: 680,
    height: 680,
    deviceScaleFactor: 1,
  });
  await convertHtml2Img();
  await browser.close();
}

fn();