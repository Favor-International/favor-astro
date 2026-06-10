// Program sub-pages under each impact pillar. Content is VERBATIM from the live
// site's What We Do sub-pages (fetched 2026-06-10 via raw HTML, /tmp/favor-live).
// Only edit: spaced hyphens (" - ") converted to commas/periods per the brand
// no-dash rule; no words added or removed. Do NOT paraphrase or expand without
// a live source.
//
// Pillar taglines are REAL live content: they appear in favorintl.org's nav
// dropdown under What We Do (captured 2026-06-10).

export const PILLAR_TAGLINES: Record<string, string> = {
  'evangelism-discipleship': "Mobilization of heaven's agenda",
  'education': 'Next generation leadership',
  'community-development': 'Holistic transformation by the Word',
  'economic-empowerment': 'Independence built on freedom in Christ',
};

export type ProgramBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; intro?: string; items: string[] };

export type Program = {
  pillar: string;        // pillar slug
  slug: string;          // program slug under /impact/<pillar>/<slug>/
  name: string;          // verbatim live page H1
  heroImage: string;
  heroAlt: string;
  promise: string;       // short line for the hero, drawn from the page content
  blocks: ProgramBlock[];
  scripture?: { text: string; attribution: string };
  pullQuote?: { text: string; attribution: string };
  bodyImage: string;
  bodyAlt: string;
};

export const PROGRAMS: Program[] = [
  // ───────────────────────── Evangelism & Discipleship ─────────────────────────
  {
    pillar: 'evangelism-discipleship',
    slug: 'portable-bible-schools',
    name: 'Portable Bible Schools',
    heroImage: '/images/field-2026/pbs-11.webp',
    heroAlt: 'A Portable Bible School gathering in the field',
    promise: 'Two-month discipleship training that Favor brings to rural villages, always moving further outward into the unreached tribes.',
    blocks: [
      { type: 'p', text: 'Favor’s Portable Bible Schools (PBSs) mobilize new disciple-makers into physical and spiritual war zones. Whether a life-time believer or brand-new convert, all come hungry for the Word and for training. These emerging leaders come from hidden corners, of nations restrictive of and hostile to the Gospel, for the two-month discipleship training that Favor brings to rural villages, always moving further outward into the unreached tribes. This ministry helps tens of thousands overcome barriers to study through literacy training and to spiritual maturity through the Holy Spirit and the Word, empowering them to live boldly in their contexts, persecuted or free.' },
      { type: 'p', text: 'Each boot camp trains participants to live Biblically in Jesus’s Kingdom and multiply disciples in their context. Taught by national leaders to multiply and accelerate new leaders, each PBS rejuvenates lifestyles around the Word and instills a love for the One behind the words.' },
      { type: 'p', text: 'Most importantly, each of the tens of thousands of African emerging leaders we graduate through PBSs graduate with a certificate, a physical Bible in their own language, and the training to make disciples and start (or rejuvenate) healthy congregations of people following Jesus together.' },
    ],
    scripture: {
      text: '“Then Philip ran up to the chariot and heard the man reading Isaiah the prophet. ‘Do you understand what you are reading?’ Philip asked. ‘How can I,’ he said, ‘unless someone explains it to me?’ So he invited Philip to come up and sit with him”',
      attribution: 'Acts 8:30-31',
    },
    bodyImage: '/images/field-2026/pbs-12.webp',
    bodyAlt: 'Portable Bible School participants gathered for training',
  },
  {
    pillar: 'evangelism-discipleship',
    slug: 'gift-institute',
    name: 'God’s Institute for Transformation (GIFT)',
    heroImage: '/images/field-2026/gift-5.webp',
    heroAlt: 'Youth at a GIFT home',
    promise: 'A home and family for youth who need Jesus with skin on.',
    blocks: [
      { type: 'p', text: 'Past wars and poverty have left thousands orphaned and/or living on the streets throughout Uganda and South Sudan. Child-headed homes are common as older siblings are forced to care for the younger, often living on the streets and struggling to secure a single meal in a day. Sometimes left neglected in prison for the crimes they committed in order to survive, sometimes picked up by traffickers who make promises they have no intention to keep.' },
      { type: 'p', text: 'God’s Institute for Transformation (GIFT) is a home and family for youth who need Jesus with skin on. GIFT is a 24/7 family and a holistic solution to a total need: mentoring, food, shelter, medical, clothing, education, vocational skills and opportunities, salvation and discipleship, and starting a new life with Jesus in real community.' },
      { type: 'p', text: 'These precious children have horrific stories of being "wasted" physically, mentally, emotionally, and in every other way by sex-trafficking, exploitation, abuse, and more. They are broken in their minds and hearts, malnourished, full of diseases, suspicious, and untrusting. Love wins them over. They are placed in families of 8-10 with trained mothers & fathers who pour out affection and affirmation, love and prayer, until the walls of suspicion are broken down and the process of transformation begins.' },
      { type: 'p', text: 'Once these youth are in our GIFT homes, it’s only a matter of weeks and they accept Jesus, learn scripture, learn how to forgive and trust, become worshippers and intercessors. Jesus turns their sorrow into joy, their ashes into beauty, their broken bodies are healed and HE gives them a HOPE and a FUTURE!' },
    ],
    bodyImage: '/images/field-2026/gift-6.webp',
    bodyAlt: 'GIFT youth at the compound',
  },
  {
    pillar: 'evangelism-discipleship',
    slug: 'radio',
    name: 'Christian Radio',
    heroImage: '/images/field-2026/radio-2.webp',
    heroAlt: 'A Favor radio broadcaster on air',
    promise: 'The power of God is moving through the airwaves, touching hearts and transforming lives.',
    blocks: [
      { type: 'p', text: 'Radio is the most accessible form of media in these regions to spread the Gospel to large audiences. It’s the greatest vehicle for reaching urban areas, danger zones, peaceful districts, business offices, homes, and the most remote villages disconnected from development. People from all walks of life listen to radios while in their homes, working, or even while riding bicycles. Even Muslims are able to listen to the Gospel and its teachings without repercussions.' },
      { type: 'p', text: 'Favor operates two radio stations that cover Gulu, Uganda, and Juba, South Sudan, reaching people in the right place at the right time. Our programming is a mix of teaching, music, news, testimonies, prayer, preaching, education, and more. All means available are used to touch hungry hearts.' },
      { type: 'p', text: 'We have become one of the HIGHEST preferred radio stations in the regions of both nations, with a high level of daily community involvement and call-ins. These daily calls are for prayer, testimonies, discussion, or question-and-answer sessions with local leaders. Lives are being changed, people are accepting Jesus Christ as their Savior, the sick are getting healed right away, the lame are walking, blind are seeing… all during our daily prayer session over the radio! They call in and come in. Also, our Favor radio team visits them in their villages and communities after their testimonies, to give them Bibles and validate their recorded testimonies.' },
      { type: 'p', text: 'Excitement is in the air, and the power of God is moving through the airwaves, touching hearts and transforming lives, all for His glory!!' },
    ],
    bodyImage: '/images/field-2026/radio-3.webp',
    bodyAlt: 'Inside a Favor radio studio',
  },

  // ───────────────────────────────── Education ─────────────────────────────────
  {
    pillar: 'education',
    slug: 'centers',
    name: 'Village Learning Centers',
    heroImage: '/images/field-2026/vlc-1.webp',
    heroAlt: 'Children at a Village Learning Center',
    promise: 'Every child should have the opportunity to survive and thrive in education.',
    blocks: [
      { type: 'p', text: 'The children in Uganda and South Sudan face tremendous barriers to education that include extreme poverty, limited resources, no schools in rural areas, and lack of transportation. Even those children fortunate enough to attend school face a 100:1 student-teacher ratio. Additionally, the prevalence of early marriage causes many females to have less opportunity and access to education from their mid-teen years going forward.' },
      { type: 'p', text: 'Favor strongly believes that every child should have the opportunity to survive and thrive in education. Our approach is to increase access to quality education by implementing village learning centers, in church buildings, that younger students in a village locale can reach on foot.' },
      { type: 'p', text: 'Education is a key factor in alleviating poverty. We use the Roots to Fruit curriculum, which is a Bible-based, Christian approach to education approved by the Ugandan government, for primary school. Within the community, we find teachers that speak the language and we provide training and put curriculum in their hands enabling them to teach the children a variety of educational classes. Favor also provides school supplies for the children and we sponsor the village learning school for 2-3 years until it becomes self sustainable. Village Learning Centers are a by-product of Women’s Empowerment because the first thing mothers want to do when they become economically empowered is pay school fees for their children to get an education.' },
    ],
    scripture: {
      text: '“A wise man will listen and will add to his wisdom, and the intelligent will gain leadership.”',
      attribution: 'Proverbs 1:5',
    },
    bodyImage: '/images/field-2026/vlc-2.webp',
    bodyAlt: 'A Village Learning Center class in session',
  },
  {
    pillar: 'education',
    slug: 'leadership',
    name: 'Leadership Training Institute',
    heroImage: '/images/field-2026/education-9.webp',
    heroAlt: 'Leadership Training Institute students in session',
    promise: 'In-class and hands-on instruction tailored to produce powerful ministers of spiritual and cultural transformation.',
    blocks: [
      { type: 'p', text: 'Most educational options in northern Uganda lack training in character and spiritual development. Many religious alternatives address spiritual development but ignore the critical leadership skills needed for individuals to thrive. Favor’s Leadership Training Institute addresses both in a blend of in-class and hands-on instruction tailored to produce powerful ministers of spiritual and cultural transformation.' },
      { type: 'p', text: 'Favor operates a Leadership Training Institute in each nation, through our offices or rented facilities and dedicated trainers. The training meets relevant needs while adding holistic empowerment not found elsewhere in northern Uganda or South Sudan. All our indigenous staff participate in constant training including Bible training, prayer, marriage enrichment, household finances, small business entrepreneurship, and much much more!' },
      { type: 'p', text: 'As a chapter of our LTIs, our School of Ministry fully equips and enables graduates to preach and teach the Word of God, plant churches, pastor congregations, and train others to enter the mission field. This school is a 2-year Bible college/hands-on ministry program specifically for people wanting to go into ministry! Transformed Leaders to Transform Nations!!' },
      { type: 'p', text: 'At Favor, we believe community is very important. Through the LTI, we hold pastoral conferences, seminars, government breakfasts, and give discipleship to community groups and public schools. There is a large variety of programs we offer to see the community enhanced and grown with discipleship.' },
    ],
    scripture: {
      text: '“A wise man will listen and will add to his wisdom, and the intelligent will gain leadership.”',
      attribution: 'Proverbs 1:5',
    },
    bodyImage: '/images/field-2026/terry-2.webp',
    bodyAlt: 'Training session with Favor leaders',
  },
  {
    pillar: 'education',
    slug: 'primary',
    name: 'Favor Primary School',
    heroImage: '/images/field-2026/education-8.webp',
    heroAlt: 'Favor Primary School students',
    promise: 'Educating the next generation of Uganda’s and South Sudan’s leadership on the Word of God, prayer, and academic excellence.',
    blocks: [
      { type: 'p', text: 'The mission of Favor Primary Schools is to educate the next generation of Uganda’s and South Sudan’s leadership on the Word of God, prayer, and academic excellence. Our schools in both Gulu and Juba receive kids from all walks of life, religions, and income levels. We openly teach and practice the Word of God, and these amazing young boys and girls routinely come to know the love of Jesus as they pray and see God move.' },
      { type: 'p', text: 'Whole families have come to know Jesus through Favour Primary, but even more importantly, these young men and women are building a foundation for lives of fruitfulness for generations. They are the future Godly leaders we pray will rebuild and reform their cultures along God’s agenda.' },
      { type: 'p', text: 'We strive to maintain a 30:1 student-to-teacher ratio and the schools have gained a reputation of excellence with some of our students in Uganda scoring the highest in the Gulu district of 160 schools. Although we take great pride in what has been accomplished, it is only a dent and we are continually striving to expand our educational program based on the principles of the Word of God.' },
    ],
    scripture: {
      text: '“Train up a child in the way he should go; even when he is old he will not depart from it.”',
      attribution: 'Proverbs 22:6',
    },
    bodyImage: '/images/field-2026/secondary-3.webp',
    bodyAlt: 'Students at a Favor school',
  },
  {
    pillar: 'education',
    slug: 'secondary',
    name: 'Favor Secondary School',
    heroImage: '/images/field-2026/secondary-1.webp',
    heroAlt: 'Favor Secondary School students',
    promise: 'Christ-centered, quality education for secondary-age students who haven’t yet had the same opportunities afforded to them.',
    blocks: [
      { type: 'p', text: 'The mission of Favor Schools is to educate the next generation of Uganda and South Sudan’s leadership on the Word of God, prayer, and academic excellence. Favor has long seen the need to continue walking further with Favor Primary students through their foundational education years while also offering Christ-centered, quality educational opportunities to secondary-age students who haven’t yet had the same opportunities afforded to them.' },
      { type: 'p', text: 'Our Favor Secondary School opened to the public for the first time in February 2023. We have welcomed 135 registered students from all walks of life, religions, and income levels. We openly teach and practice the Word of God, and these amazing young men and women routinely come to know the love of Jesus as they pray and see God move.' },
      { type: 'p', text: 'If we had the space, we could have easily welcomed 500. The response has been overwhelming. Many different social agendas and parents are crying for Christian education. We are seeing them grow in the Lord and receive quality education they wouldn’t have had much opportunity to have beforehand. As God provides, we will be able to meet the desperate needs of those on our waiting list.' },
    ],
    scripture: {
      text: '“Train up a child in the way he should go; even when he is old he will not depart from it.”',
      attribution: 'Proverbs 22:6',
    },
    bodyImage: '/images/field-2026/secondary-2.webp',
    bodyAlt: 'Secondary students at Favor',
  },

  // ──────────────────────────── Community Development ──────────────────────────
  {
    pillar: 'community-development',
    slug: 'counseling',
    name: 'Trauma Counseling',
    heroImage: '/images/field-2026/trauma-1.webp',
    heroAlt: 'A trauma counseling group session',
    promise: 'Healing for nations that have experienced brutal oppression and injustice in generations of civil war.',
    blocks: [
      { type: 'p', text: 'Our trauma healing program has two parts. The first section focuses on developing emotional strength, and the second teaches about forgiveness. Throughout the program, the counselors teach people how to connect to one another and counter stress with positive activity. In addition, stories and sharing times help the participants understand pain and trauma from another perspective while giving them the opportunity to discuss the events they’ve experienced.' },
      { type: 'p', text: 'The original Trauma Counseling curriculum that we use 1) was written by Christ-believing psychologists from Australia, 2) was peer-reviewed through publications at Boston University, and 3) for many years has been adapted and contextualized for the many people groups we serve throughout South Sudan and Uganda. Though founded in Biblical curriculum and implementation, the services and healing we offer to traumatized communities are not always presented as a “religious” function, but as a two-week process that works. By the end of the first week, forgiveness is introduced. How can you forgive if you have never been forgiven, in other words how can you give away what you have never received? They are introduced to the Great Forgiver!' },
      { type: 'p', text: 'Favor has discovered an immense demand and need for trauma counseling as both nations from top to bottom have experienced brutal oppression and injustice in generations of civil war. We are working at great speed to bring trauma counseling to many contexts. We have hosted reconciliation meetings between tribes with continuous violent raids. In both countries, we are bringing counseling to the military generals, government offices, the police force, the radio, universities and many more throughout these post-war nations.' },
      { type: 'p', text: 'Once the people have completed the trauma counseling, they are often ready and eager to accept Jesus as their Lord and Savior. In most communities, this work precedes a 2-month long Portable Bible School to train and disciple.' },
    ],
    pullQuote: {
      text: '“Please bring your trauma counseling. We’re all traumatized in South Sudan… I’m traumatized.”',
      attribution: 'Minister of the Interior for South Sudan',
    },
    bodyImage: '/images/field-2026/trauma-2.webp',
    bodyAlt: 'Trauma counseling participants',
  },
  {
    pillar: 'community-development',
    slug: 'medical',
    name: 'Medical',
    heroImage: '/images/field-2026/medical-1.webp',
    heroAlt: 'Favor medical care in the field',
    promise: 'Basic medical care, health education, and mobile clinics in places with little or no medical services.',
    blocks: [
      { type: 'p', text: 'There is a tremendous need for reliable and applicable community health information in Uganda and South Sudan. Access to formal education is severely limited and illiteracy rates are extremely high. Therefore, what most Westerners would consider common knowledge about disease prevention, germ theory, and basic hygiene principles is widely unknown in the places we serve.' },
      { type: 'p', text: 'In both Uganda and South Sudan, we have Favor clinics that provide basic medical care to our staff and their families, and to our former street youth who are in residence. In Uganda, where 50% or more of the population lives in extreme poverty, our clinic just opened to the public providing low-cost medical assistance to the community.' },
      { type: 'p', text: 'Beyond Gulu, Uganda and Juba, South Sudan, community health education is a vital and integral part of the Rural Education and Empowerment Program (REEP). During the two-month Portable Bible Schools, daily classes are taught on recognizing certain disease symptoms, preventing illnesses, and treating common disorders. Common knowledge like boiling water, washing hands and general cleanliness is taught as disease prevention.' },
      { type: 'p', text: 'Mobile medical clinics are a practical extension of Favor Clinics where we go to rural areas where there is little or no medical services. Of course each patient is prayed for, given the Gospel message, and treated for their diseases. Mobile medical clinics often open the way for further penetration of the Gospel into remote areas.' },
    ],
    scripture: {
      text: '"He who has pity on the poor lends to the Lord, and He will pay back what he has given.... Whoever shuts his ears to the cry of the poor will also cry himself and not be heard."',
      attribution: 'Proverbs 19:17 & 21:13, NKJV',
    },
    bodyImage: '/images/field-2026/medical-3.webp',
    bodyAlt: 'Favor medical staff at work',
  },
  {
    pillar: 'community-development',
    slug: 'church-planting',
    name: 'Church Planting',
    heroImage: '/images/field-2026/church-5.webp',
    heroAlt: 'A church gathering in the field',
    promise: 'Thousands of churches have been planted across Uganda and South Sudan.',
    blocks: [
      { type: 'p', text: 'Church planting stands as a pivotal phase for a new believing community. In many rural communities there are no churches, so following a Portable Bible School small churches are planted, sometimes meeting in a hut or under a mango tree. Further discipleship, training, monitoring and evaluation by Favor help ensure these churches flourish and grow deeper in the Word of God.' },
      { type: 'p', text: 'Churches are also planted as a result of church construction. Once a church is constructed the mandate is for them to plant 3 more churches in 5 years. Thousands of churches have been planted across Uganda and South Sudan as a result of these efforts.' },
      { type: 'list', intro: 'As a result, Favor builds congregations that:', items: [
        'Prioritize the Word of God and prayer,',
        'Lift up the name of Jesus with and apply Biblical principles to every part of life,',
        'Seek denominational neutrality, or support other local denominations,',
        'Serve the whole community in compassion and humility,',
        'Multiply by making new disciples and teaching all they have received.',
      ] },
      { type: 'p', text: 'When we serve a community requesting the Word of God and training, we don’t just graduate leaders, but we ensure there are one or more healthy congregations. Like the Parable of the Sower (Mark 4:1-20), we want to be sure congregations are planted in good soil and can grow together.' },
    ],
    scripture: {
      text: '"So then neither he who plants is anything, nor he who waters, but God who gives the increase. Now he who plants and he who waters are one, and each one will receive his own reward according to his own labor. For we are God’s fellow workers; you are God’s field, you are God’s building."',
      attribution: 'The Apostle Paul, 1 Corinthians 3:7-9, NKJV',
    },
    bodyImage: '/images/field-2026/church-6.webp',
    bodyAlt: 'Believers gathered for worship',
  },
  {
    pillar: 'community-development',
    slug: 'construction',
    name: 'Church Construction',
    heroImage: '/images/field-2026/construction-1.webp',
    heroAlt: 'A church construction project underway',
    promise: 'One church planted in an unreached community can affect countless generations.',
    blocks: [
      { type: 'p', text: 'Favor’s church planting initiatives are an integral part of our Community Development program, because we want to rebuild each community’s physical and spiritual needs around a healthy church. We stress the importance of organization and the installation of good leadership before dreaming of construction, but with these critical elements in place, construction of a church building begins. Favor partners with International Cooperating Ministries (ICM) to fund the new church construction and ICM has helped Favor build many churches across Uganda and South Sudan.' },
      { type: 'p', text: 'Our intention is to simply be a resource behind the church allowing them to take the lead and be as independent as possible. When finished, our staff walks with the new faith community throughout the following year to guide and provide training, discipleship, and mini Bible school courses. These churches don’t belong to Favor but to the community of believers and their leadership from that local church.' },
      { type: 'p', text: 'The church building becomes a key gathering place for the communities and is one of the most effective means of reaching and transforming lives. Between life skills classes, Women Empowerment meetings, youth sports & activities, and schooling for all ages as a Village Learning Center, the church building becomes an anchor point in the community for both the young and the old. One church planted in an unreached community can affect countless generations.' },
    ],
    scripture: {
      text: '"So then neither he who plants is anything, nor he who waters, but God who gives the increase. Now he who plants and he who waters are one, and each one will receive his own reward according to his own labor. For we are God’s fellow workers; you are God’s field, you are God’s building."',
      attribution: 'The Apostle Paul, 1 Corinthians 3:7-9, NKJV',
    },
    bodyImage: '/images/field-2026/construction-2.webp',
    bodyAlt: 'Walls rising on a new church building',
  },

  // ───────────────────────────── Economic Empowerment ──────────────────────────
  {
    pillar: 'economic-empowerment',
    slug: 'sustainability',
    name: 'Sustainability Projects',
    heroImage: '/images/field-2026/agriculture-3.webp',
    heroAlt: 'Work on the Favor Farm',
    promise: 'Projects that help provide for our ministry teams and support our programs directly.',
    blocks: [
      { type: 'p', text: 'God has provided Favor with a 270 acre farm. And wanting to be good stewards of what we’ve been given to work with and lead by example, we have a few sustainability projects that help provide for our ministry teams and support our programs directly. The farm is located just outside of Gulu which includes vegetables and fruit trees, and then a poultry house and fisheries are within our Education compound.' },
      { type: 'p', text: 'These projects also provide training for our vocational students from God’s Institute For Transformation. Former street youth are learning skills and gaining hands-on experience. At the farm we grow vegetables to feed the ministry and are also able to use the products to grind our own fish feed and chicken feed. The fish farm breeds and sells fingerlings and grows table fish for market and for consumption.' },
      { type: 'p', text: 'The Apostle Paul earned the right to receive total financial support for his ministry, but he also chose to not be a financial burden to communities, in order to demonstrate the love of Christ that compelled him (1 Corinthian 9:9-12, Acts 18:1-4). Likewise, Favor always operates with a ministry-first mindset, but good business is a necessary and powerful ministry, one in which many people are called by God to serve exclusively.' },
    ],
    scripture: {
      text: '"And whatever you do, do it heartily, as to the Lord and not to men."',
      attribution: 'The Apostle Paul, Colossians 3:23, NKJV',
    },
    bodyImage: '/images/field-2026/agriculture-4.webp',
    bodyAlt: 'Harvest work on the Favor Farm',
  },
  {
    pillar: 'economic-empowerment',
    slug: 'vocation',
    name: 'Vocational Program',
    heroImage: '/images/field-2026/vocation-1.webp',
    heroAlt: 'Vocational Program students at work',
    promise: 'Equipping youth with the opportunity to choose and study a vocation of their choice.',
    blocks: [
      { type: 'p', text: 'Past wars have left thousands throughout Uganda and South Sudan displaced in the cycle of poverty with limited skills to be able to have work options available to them. Many of the younger generation, young women especially, become susceptible to exploitation, slavery, sex-trafficking, sold for organ transplants and body parts, and even worse.' },
      { type: 'p', text: 'Favor seeks to equip and empower youth in their late teens and early twenties with the opportunity to choose and study a vocation of their choice. Some of the offerings are mechanics, farming, fisheries, animal husbandry, landscaping, tailoring, hairdressing, bakery, and many more being introduced and yet to come.' },
      { type: 'p', text: 'Being part of a larger government program, we’re able to award our vocational graduates, who rank among the top graduates in the nation, government-recognized certificates that give them an edge in starting businesses of their own. At this point, these teens and young adults are fully equipped with the skills and knowledge needed to establish and operate profitable businesses of their own as they become missionaries in the marketplace.' },
      { type: 'p', text: 'Your donations of goods and funds are making these visions possible for many young people seeking to honor God with all of their hearts, souls, minds, and strengths.' },
    ],
    scripture: {
      text: '"And whatever you do, do it heartily, as to the Lord and not to men."',
      attribution: 'The Apostle Paul, Colossians 3:23, NKJV',
    },
    bodyImage: '/images/field-2026/vocation-2.webp',
    bodyAlt: 'Students learning hands-on skills',
  },
  {
    pillar: 'economic-empowerment',
    slug: 'women',
    name: 'Women Empowerment',
    heroImage: '/images/field-2026/women-2.webp',
    heroAlt: 'A Women Empowerment group meeting',
    promise: 'Equipping women to generate their own income. It’s a project that keeps giving!',
    blocks: [
      { type: 'p', text: 'A mother’s greatest desire is for her children to receive an education, but in rural Africa, many mothers struggle daily to make ends meet. This makes the children susceptible to traffickers’ false promises of well-paying jobs. Most women are the breadwinners and are fighting for survival and to feed their families. In many rural areas schools are very far away and education is not affordable.' },
      { type: 'p', text: 'Favor’s Women Empowerment ministry ends this cycle by equipping women to generate their own income through training in skills, trauma healing, entrepreneurship, parenting, and financial management. The women are empowered and given a project to begin. This income gains them a measure of respect from their husbands and funds the medical and educational needs of all their children.' },
      { type: 'p', text: 'Additionally, we incorporate classes of anti abortion, trafficking awareness, health, and discipleship. Women and girls are given Biblical training, which builds confidence to share their faith. After deciding a course of action, we aid them in forming their own structure and accountability system. We make sure to plan ongoing follow-up as they begin to implement their new strategy, so they feel capable and assisted from start to finish. When the corporate project generates income, then the women begin individual businesses, shops, farming, and home building, each one providing for their children to go to school. It’s a project that keeps giving!' },
    ],
    bodyImage: '/images/field-2026/women-3.webp',
    bodyAlt: 'Women Empowerment group members',
  },
];

export const programsByPillar = (pillar: string) => PROGRAMS.filter((p) => p.pillar === pillar);
