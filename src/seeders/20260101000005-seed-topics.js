'use strict';

const { v4: uuidv4 } = require('uuid');

// Seeds practice topics for a pharmaceutical MR (medical representative)
// detailing well-known SQUARE Pharmaceuticals PLC brands to a doctor, so
// admins have real, on-brand content to edit immediately.
const TOPICS = [
  {
    name: 'Ace (Paracetamol)',
    passage:
      'আপনার রোগীদের জ্বর ও ব্যথা দ্রুত উপশমের জন্য আমরা নিয়ে এসেছি Ace, যার উপাদান Paracetamol। এটি নিরাপদ, কার্যকর এবং সব বয়সের রোগীর জন্য উপযোগী। জ্বর, মাথাব্যথা কিংবা সাধারণ ব্যথায় Ace দ্রুত স্বস্তি দেয়। আপনার প্রেসক্রিপশনে Ace রাখার অনুরোধ করছি।',
  },
  {
    name: 'Seclo (Omeprazole)',
    passage:
      'গ্যাস্ট্রিক ও অ্যাসিডিটির সমস্যায় ভোগা রোগীদের জন্য Seclo একটি কার্যকর সমাধান, যার জেনেরিক Omeprazole। এটি পাকস্থলীর অতিরিক্ত অ্যাসিড উৎপাদন নিয়ন্ত্রণ করে দ্রুত স্বস্তি দেয়। দীর্ঘমেয়াদী গ্যাস্ট্রিক সমস্যায়ও Seclo নিরাপদে ব্যবহার করা যায়। আপনার গ্যাস্ট্রিক রোগীদের জন্য Seclo সুপারিশ করার অনুরোধ করছি।',
  },
  {
    name: 'Nexum (Esomeprazole)',
    passage:
      'GERD এবং তীব্র অ্যাসিডিটির রোগীদের জন্য Nexum একটি উন্নত মানের প্রোটন পাম্প ইনহিবিটর, যার জেনেরিক Esomeprazole। এটি দ্রুত ও দীর্ঘস্থায়ী অ্যাসিড নিয়ন্ত্রণ নিশ্চিত করে। বুক জ্বালাপোড়া ও রিফ্লাক্সের লক্ষণ কমাতে Nexum বিশেষভাবে কার্যকর। GERD আক্রান্ত রোগীদের জন্য Nexum প্রেসক্রাইব করার অনুরোধ করছি।',
  },
  {
    name: 'Fexo (Fexofenadine)',
    passage:
      'অ্যালার্জির রোগীদের জন্য Fexo একটি নন-সিডেটিভ অ্যান্টিহিস্টামিন, যার জেনেরিক Fexofenadine। এটি ঘুম ঘুম ভাব না তৈরি করেই অ্যালার্জির উপসর্গ যেমন হাঁচি, নাক দিয়ে পানি পড়া ও চুলকানি কমায়। দিনে একবার সেবনেই দীর্ঘ সময় স্বস্তি পাওয়া যায়। আপনার অ্যালার্জি রোগীদের জন্য Fexo সুপারিশ করার অনুরোধ করছি।',
  },
  {
    name: 'Alatrol (Cetirizine)',
    passage:
      'সিজনাল অ্যালার্জি ও ত্বকের অ্যালার্জিক সমস্যায় Alatrol একটি সুপরিচিত সমাধান, যার জেনেরিক Cetirizine। এটি দ্রুত কাজ শুরু করে এবং দিনে একবার সেবনে সারাদিন অ্যালার্জি নিয়ন্ত্রণে রাখে। ছোট থেকে বড় সবার জন্য Alatrol নিরাপদ ও কার্যকর। আপনার রোগীদের অ্যালার্জি ব্যবস্থাপনায় Alatrol রাখার অনুরোধ করছি।',
  },
  {
    name: 'Calbo-D (Calcium + Vitamin D)',
    passage:
      'হাড়ের স্বাস্থ্য রক্ষায় ও ক্যালসিয়াম-ভিটামিন ডি স্বল্পতা পূরণে Calbo-D একটি সুপরিচিত সাপ্লিমেন্ট, যাতে রয়েছে Calcium এবং Vitamin D। এটি হাড় ও দাঁতের গঠন মজবুত করতে সাহায্য করে এবং ক্যালসিয়াম শোষণ বাড়ায়। গর্ভবতী মা, বয়স্ক রোগী ও অস্টিওপোরোসিস প্রতিরোধে Calbo-D বিশেষভাবে উপযোগী। আপনার রোগীদের জন্য Calbo-D সুপারিশ করার অনুরোধ করছি।',
  },
  {
    name: 'Ace Plus (Paracetamol + Caffeine)',
    passage:
      'তীব্র মাথাব্যথা ও ব্যথায় দ্রুত উপশমের জন্য Ace Plus একটি কার্যকর কম্বিনেশন, যাতে রয়েছে Paracetamol ও Caffeine। ক্যাফেইন প্যারাসিটামলের ব্যথানাশক কার্যকারিতা বাড়িয়ে দ্রুত স্বস্তি দিতে সহায়তা করে। মাইগ্রেন ও টেনশন হেডেকের রোগীদের জন্য Ace Plus বিশেষভাবে কার্যকর। আপনার প্রেসক্রিপশনে Ace Plus রাখার অনুরোধ করছি।',
  },
  {
    name: 'Almex (Albendazole)',
    passage:
      'কৃমি সংক্রমণ প্রতিরোধ ও চিকিৎসায় Almex একটি বিশ্বাসযোগ্য নাম, যার জেনেরিক Albendazole। এটি বিভিন্ন প্রকার পরজীবী কৃমি দূর করতে কার্যকর এবং সহজ ডোজিং শিডিউল অনুসরণ করা যায়। পরিবারের সবার জন্য নিয়মিত কৃমিনাশক হিসেবে Almex সুপারিশ করা হয়। আপনার রোগীদের জন্য Almex প্রেসক্রাইব করার অনুরোধ করছি।',
  },
  {
    name: 'Comet (Metformin)',
    passage:
      'টাইপ ২ ডায়াবেটিস নিয়ন্ত্রণে Comet একটি সুপ্রতিষ্ঠিত ওষুধ, যার জেনেরিক Metformin। এটি রক্তে গ্লুকোজের মাত্রা নিয়ন্ত্রণে রেখে ইনসুলিন সংবেদনশীলতা বাড়াতে সাহায্য করে। দীর্ঘমেয়াদী ব্যবহারে Comet নিরাপদ এবং সহনীয়। আপনার ডায়াবেটিক রোগীদের জন্য Comet প্রেসক্রাইব করার অনুরোধ করছি।',
  },
  {
    name: 'Anzitor (Atorvastatin)',
    passage:
      'উচ্চ কোলেস্টেরল নিয়ন্ত্রণে Anzitor একটি কার্যকর স্ট্যাটিন, যার জেনেরিক Atorvastatin। এটি এলডিএল কোলেস্টেরল কমিয়ে হৃদরোগের ঝুঁকি কমাতে সহায়তা করে। নিয়মিত সেবনে Anzitor কোলেস্টেরলের মাত্রা কার্যকরভাবে নিয়ন্ত্রণে রাখে। আপনার উচ্চ কোলেস্টেরলের রোগীদের জন্য Anzitor সুপারিশ করার অনুরোধ করছি।',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query('SELECT id FROM topics LIMIT 1');
    if (existing.length > 0) {
      console.log('Topic seed skipped: topics already exist.');
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert(
      'topics',
      TOPICS.map((t) => ({
        id: uuidv4(),
        name: t.name,
        passage: t.passage,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }))
    );

    console.log(`Seeded ${TOPICS.length} topics.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('topics', { name: TOPICS.map((t) => t.name) });
  },
};
