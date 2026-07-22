// const express = require('express');
// const { SitemapStream, streamToPromise } = require('sitemap');
// const { Readable } = require('stream');
// const Product = require('../models/Product');

// const router = express.Router();

// router.get('/sitemap.xml', async (req, res) => {
//   try {
//     const products = await Product.find({ isActive: true })
//       .select('slug updatedAt createdAt')
//       .lean();

//    const baseUrl = 'https://frontend-one-wheat-45.vercel.app';

//     const pages = [
//       { url: '/', changefreq: 'daily', priority: 1.0 },
//       { url: '/about', changefreq: 'daily', priority: 0.8 },
//       { url: '/contact', changefreq: 'daily', priority: 0.8 },
//       { url: '/faq', changefreq: 'daily', priority: 0.8 },
//       { url: '/shop', changefreq: 'daily', priority: 0.9 },
//       { url: '/termsconditions', changefreq: 'daily', priority: 0.7 },
//       { url: '/privacy-policy', changefreq: 'daily', priority: 0.7 },
//     ];

//     const productUrls = products
//       .filter((product) => product.slug)
//       .map((product) => ({
//         url: `/productdetails/${product.slug}`,
//         changefreq: 'daily',
//         priority: 0.9,
//         lastmod: product.updatedAt || product.createdAt,
//       }));

//     const sitemapLinks = [...pages, ...productUrls];

//     const stream = new SitemapStream({ hostname: baseUrl });
//     const xml = await streamToPromise(Readable.from(sitemapLinks).pipe(stream));

//    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
// res.setHeader('Cache-Control', 'no-cache');

// res.send(
//   '<?xml version="1.0" encoding="UTF-8"?>' + xml.toString()
// );
//   } catch (error) {
//     console.error('Sitemap generation failed:', error);
//     res.status(500).send('Could not generate sitemap');
//   }
// });

// module.exports = router;

















const express = require('express');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const Product = require('../models/Product');

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('slug updatedAt createdAt')
      .lean();

    const baseUrl = 'https://frontend-one-wheat-45.vercel.app';

    const pages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/about', changefreq: 'daily', priority: 0.8 },
      { url: '/contact', changefreq: 'daily', priority: 0.8 },
      { url: '/faq', changefreq: 'daily', priority: 0.8 },
      { url: '/shop', changefreq: 'daily', priority: 0.9 },
      { url: '/termsconditions', changefreq: 'daily', priority: 0.7 },
      { url: '/privacypolicy', changefreq: 'daily', priority: 0.7 },
    ];

    const productUrls = products
      .filter(product => product.slug)
      .map(product => ({
        url: `/productdetails/${product.slug}`,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: product.updatedAt || product.createdAt,
      }));

    const stream = new SitemapStream({
      hostname: baseUrl,
    });

    const xml = await streamToPromise(
      Readable.from([...pages, ...productUrls]).pipe(stream)
    );

    res.status(200);
    res.type('application/xml');
    res.send(xml.toString());

  } catch (error) {
    console.error(error);
    res.status(500).send('Sitemap Error');
  }
});

module.exports = router;