export type VocabWord = {
  id: string;
  hanzi: string;
  pinyin: string;
  thai: string;
  example: string;
  examplePinyin?: string;
  exampleThai?: string;
  category?: "คำนาม" | "คำกริยา" | "คำคุณศัพท์" | "คำเชื่อม" | "คำบอกเวลา" | "คำสรรพนาม" | "คำทักทาย" | "คำวิเศษณ์";
};

export type QuizItem = {
  id: string;
  prompt: string;
  answer: string;
  choices: string[];
  explanation?: string;
};

export type LessonData = {
  title: string;
  grammar: string;
  grammarDetail?: string;
  dialog: string;
  dialogLines?: Array<{ speaker: string; hanzi: string; pinyin: string; thai: string }>;
  keyPhrases?: Array<{ hanzi: string; pinyin: string; thai: string }>;
};

export type Level = {
  id: string;
  title: string;
  words: number;
  target: string;
  color: string;
  focus: string;
  vocabulary: VocabWord[];
  lesson: LessonData;
  quiz: QuizItem;
  quizzes?: QuizItem[];
};

export const hskLevels: Level[] = [
  {
    id: "hsk1",
    title: "HSK 1",
    words: 150,
    target: "เริ่มพูดประโยคสั้นและสื่อสารในชีวิตประจำวัน",
    color: "#dd4b39",
    focus: "ทักทาย ตัวเลข เวลา ครอบครัว การซื้อของ และคำถามพื้นฐาน",
    vocabulary: [
      {
        id: "hsk1-nihao",
        hanzi: "你好",
        pinyin: "nǐ hǎo",
        thai: "สวัสดี",
        example: "你好，我叫明。",
        examplePinyin: "Nǐ hǎo, wǒ jiào Míng.",
        exampleThai: "สวัสดี ฉันชื่อหมิง",
        category: "คำทักทาย",
      },
      {
        id: "hsk1-xiexie",
        hanzi: "谢谢",
        pinyin: "xiè xie",
        thai: "ขอบคุณ",
        example: "谢谢你帮我。",
        examplePinyin: "Xièxie nǐ bāng wǒ.",
        exampleThai: "ขอบคุณที่คุณช่วยฉัน",
        category: "คำกริยา",
      },
      {
        id: "hsk1-xuexi",
        hanzi: "学习",
        pinyin: "xué xí",
        thai: "เรียน / การศึกษา",
        example: "我学习汉语。",
        examplePinyin: "Wǒ xuéxí Hànyǔ.",
        exampleThai: "ฉันเรียนภาษาจีน",
        category: "คำกริยา",
      },
      {
        id: "hsk1-pengyou",
        hanzi: "朋友",
        pinyin: "péng you",
        thai: "เพื่อน",
        example: "她是我的朋友。",
        examplePinyin: "Tā shì wǒ de péngyou.",
        exampleThai: "เธอเป็นเพื่อนของฉัน",
        category: "คำนาม",
      },
      {
        id: "hsk1-laoshi",
        hanzi: "老师",
        pinyin: "lǎo shī",
        thai: "คุณครู / อาจารย์",
        example: "王老师好！",
        examplePinyin: "Wáng lǎoshī hǎo!",
        exampleThai: "สวัสดีครับ/ค่ะ อาจารย์หวัง",
        category: "คำนาม",
      },
      {
        id: "hsk1-chifan",
        hanzi: "吃饭",
        pinyin: "chī fàn",
        thai: "กินข้าว / รับประทานอาหาร",
        example: "你吃饭了吗？",
        examplePinyin: "Nǐ chī fàn le ma?",
        exampleThai: "คุณกินข้าวหรือยัง?",
        category: "คำกริยา",
      },
      {
        id: "hsk1-heshui",
        hanzi: "喝水",
        pinyin: "hē shuǐ",
        thai: "ดื่มน้ำ",
        example: "我想喝水。",
        examplePinyin: "Wǒ xiǎng hē shuǐ.",
        exampleThai: "ฉันอยากดื่มน้ำ",
        category: "คำกริยา",
      },
      {
        id: "hsk1-gaoxing",
        hanzi: "高兴",
        pinyin: "gāo xìng",
        thai: "ดีใจ / มีความสุข",
        example: "认识你很高兴。",
        examplePinyin: "Rènshi nǐ hěn gāoxìng.",
        exampleThai: "ยินดีที่ได้รู้จักคุณ",
        category: "คำคุณศัพท์",
      },
      {
        id: "hsk1-duoshao",
        hanzi: "多少",
        pinyin: "duō shao",
        thai: "เท่าไหร่",
        example: "这个多少钱？",
        examplePinyin: "Zhège duōshao qián?",
        exampleThai: "อันนี้ราคาเท่าไหร่?",
        category: "คำสรรพนาม",
      },
      {
        id: "hsk1-mingtian",
        hanzi: "明天",
        pinyin: "míng tiān",
        thai: "พรุ่งนี้",
        example: "明天见！",
        examplePinyin: "Míngtiān jiàn!",
        exampleThai: "เจอกันพรุ่งนี้!",
        category: "คำบอกเวลา",
      },
    ],
    lesson: {
      title: "บทสนทนาพบกันครั้งแรก & การแนะนำตัว",
      grammar: "ใช้ 是 (shì) เพื่อบอกว่าใครเป็นใคร และ 是...吗 เพื่อถามคำถามใช่หรือไม่",
      grammarDetail: "โครงสร้าง: [ประธาน] + 是 + [คำนาม] (เช่น 我是学生 = ฉันเป็นนักเรียน) และถ้าเติม 吗 ท้ายประโยคจะกลายเป็นคำถาม (เช่น 你是老师吗？ = คุณเป็นคุณครูใช่ไหม?)",
      dialog: "A: 你好！你叫什么名字？\nB: 你好！我叫安娜，我是泰国人。你呢？\nA: 我叫王明，很高兴认识你！\nB: 认识你我也很高兴！",
      dialogLines: [
        { speaker: "A", hanzi: "你好！你叫什么名字？", pinyin: "Nǐ hǎo! Nǐ jiào shénme míngzi?", thai: "สวัสดี! คุณชื่ออะไร?" },
        { speaker: "B", hanzi: "你好！我叫安娜，我是泰国人。你呢？", pinyin: "Nǐ hǎo! Wǒ jiào Ānnà, wǒ shì Tàiguórén. Nǐ ne?", thai: "สวัสดี! ฉันชื่อแอนนา ฉันเป็นคนไทย แล้วคุณล่ะ?" },
        { speaker: "A", hanzi: "我叫王明，很高兴认识你！", pinyin: "Wǒ jiào Wáng Míng, hěn gāoxìng rènshi nǐ!", thai: "ฉันชื่อหวังหมิง ยินดีที่ได้รู้จักนะ!" },
        { speaker: "B", hanzi: "认识你我也很高兴！", pinyin: "Rènshi nǐ wǒ yě hěn gāoxìng!", thai: "ยินดีที่ได้รู้จักเช่นกันนะ!" },
      ],
      keyPhrases: [
        { hanzi: "很高兴认识你", pinyin: "Hěn gāoxìng rènshi nǐ", thai: "ยินดีที่ได้รู้จักคุณ" },
        { hanzi: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzi?", thai: "คุณชื่ออะไร?" },
        { hanzi: "谢谢你", pinyin: "Xièxie nǐ", thai: "ขอบคุณคุณนะ" },
      ],
    },
    quiz: {
      id: "quiz-hsk1-friend",
      prompt: "คำว่า 朋友 หมายถึงอะไร",
      answer: "เพื่อน",
      choices: ["เพื่อน", "หนังสือ", "ร้านอาหาร", "วันพรุ่งนี้"],
      explanation: "朋友 (péngyou) แปลว่า เพื่อน เช่น 她是我的好朋友 (เธอคือเพื่อนสนิทของฉัน)",
    },
    quizzes: [
      {
        id: "quiz-hsk1-friend",
        prompt: "คำว่า 朋友 หมายถึงอะไร",
        answer: "เพื่อน",
        choices: ["เพื่อน", "หนังสือ", "ร้านอาหาร", "วันพรุ่งนี้"],
        explanation: "朋友 (péngyou) แปลว่า เพื่อน เช่น 她是我的好朋友",
      },
      {
        id: "quiz-hsk1-pinyin-xiexie",
        prompt: "คำว่า '谢谢' (ขอบคุณ) มีพินอินตรงกับข้อใด",
        answer: "xiè xie",
        choices: ["xiè xie", "zài jiàn", "nǐ hǎo", "duì bu qǐ"],
        explanation: "谢谢 อ่านว่า xiè xie แปลว่า ขอบคุณ",
      },
      {
        id: "quiz-hsk1-sentence-eat",
        prompt: "ประโยค '你吃饭了吗？' แปลว่าอะไร",
        answer: "คุณกินข้าวหรือยัง?",
        choices: ["คุณกินข้าวหรือยัง?", "คุณชอบกินอะไร?", "คุณไปไหนมา?", "คุณสบายดีไหม?"],
        explanation: "吃饭 (chī fàn) แปลว่า กินข้าว, 吗 (ma) เป็นคำลงท้ายประโยคคำถาม",
      },
      {
        id: "quiz-hsk1-number-price",
        prompt: "ถ้าต้องการถามราคาสินค้า ควรถามด้วยประโยคใด",
        answer: "这个多少钱？",
        choices: ["这个多少钱？", "你在哪里？", "你是谁？", "今天几号？"],
        explanation: "多少钱 (duōshao qián) แปลว่า ราคาเท่าไหร่",
      },
    ],
  },
  {
    id: "hsk2",
    title: "HSK 2",
    words: 300,
    target: "คุยเรื่องงานอดิเรก การเดินทาง และแผนการง่าย ๆ",
    color: "#f29f05",
    focus: "คำกริยาถี่ขึ้น ประโยคเปรียบเทียบ และคำบอกเหตุผลเวลา",
    vocabulary: [
      {
        id: "hsk2-yinwei",
        hanzi: "因为",
        pinyin: "yīn wèi",
        thai: "เพราะว่า / เนื่องจาก",
        example: "因为下雨，我不去。",
        examplePinyin: "Yīnwèi xiàyǔ, wǒ bú qù.",
        exampleThai: "เพราะว่าฝนตก ฉันเลยไม่ไป",
        category: "คำเชื่อม",
      },
      {
        id: "hsk2-juede",
        hanzi: "觉得",
        pinyin: "jué de",
        thai: "รู้สึกว่า / คิดว่า",
        example: "我觉得中文很有意思。",
        examplePinyin: "Wǒ juéde Zhōngwén hěn yǒu yìsi.",
        exampleThai: "ฉันรู้สึกว่าภาษาจีนน่าสนใจมาก",
        category: "คำกริยา",
      },
      {
        id: "hsk2-yundong",
        hanzi: "运动",
        pinyin: "yùn dòng",
        thai: "ออกกำลังกาย / กีฬา",
        example: "你喜欢什么运动？",
        examplePinyin: "Nǐ xǐhuan shénme yùndòng?",
        exampleThai: "คุณชอบกีฬาอะไร?",
        category: "คำนาม",
      },
      {
        id: "hsk2-luyou",
        hanzi: "旅游",
        pinyin: "lǚ yóu",
        thai: "ท่องเที่ยว / เดินทาง",
        example: "我们明年去旅游。",
        examplePinyin: "Wǒmen míngnián qù lǚyóu.",
        exampleThai: "ปีหน้าพวกเราจะไปเที่ยว",
        category: "คำกริยา",
      },
      {
        id: "hsk2-bangmang",
        hanzi: "帮忙",
        pinyin: "bāng máng",
        thai: "ช่วยเหลือ",
        example: "你能帮我的忙吗？",
        examplePinyin: "Nǐ néng bāng wǒ de máng ma?",
        exampleThai: "คุณช่วยฉันหน่อยได้ไหม?",
        category: "คำกริยา",
      },
      {
        id: "hsk2-kuai",
        hanzi: "快",
        pinyin: "kuài",
        thai: "เร็ว / ใกล้จะ",
        example: "火车快来了。",
        examplePinyin: "Huǒchē kuài lái le.",
        exampleThai: "รถไฟใกล้จะมาแล้ว",
        category: "คำคุณศัพท์",
      },
      {
        id: "hsk2-shijian",
        hanzi: "时间",
        pinyin: "shí jiān",
        thai: "เวลา",
        example: "你现在有时间吗？",
        examplePinyin: "Nǐ xiànzài yǒu shíjiān ma?",
        exampleThai: "ตอนนี้คุณมีเวลาไหม?",
        category: "คำนาม",
      },
      {
        id: "hsk2-shenti",
        hanzi: "身体",
        pinyin: "shēn tǐ",
        thai: "สุขภาพ / ร่างกาย",
        example: "祝你身体健康！",
        examplePinyin: "Zhù nǐ shēntǐ jiànkāng!",
        exampleThai: "ขอให้คุณสุขภาพแข็งแรง!",
        category: "คำนาม",
      },
    ],
    lesson: {
      title: "การบอกเหตุผล ความคิดเห็น และการเปรียบเทียบ",
      grammar: "ใช้ 因为...所以... เพื่อเชื่อมเหตุและผล, และใช้ 比 ในการเปรียบเทียบ",
      grammarDetail: "โครงสร้างเหตุผล: 因为 + [เหตุผล], 所以 + [ผลลัพธ์] เช่น 因为天气好，所以我们去公园 (เพราะอากาศดี พวกเราจึงไปสวนสาธารณะ) / โครงสร้างเปรียบเทียบ: A + 比 + B + [คำคุณศัพท์] เช่น 哥哥比我高 (พี่ชายสูงกว่าฉัน)",
      dialog: "A: 你为什么学习汉语？\nB: 因为我想去中国旅游，我觉得中国文化很有意思。\nA: 你觉得汉语难吗？\nB: 汉字有点难，但是说汉语很有趣！",
      dialogLines: [
        { speaker: "A", hanzi: "你为什么学习汉语？", pinyin: "Nǐ wèishénme xuéxí Hànyǔ?", thai: "ทำไมคุณถึงเรียนภาษาจีน?" },
        { speaker: "B", hanzi: "因为我想去中国旅游，我觉得中国文化很有意思。", pinyin: "Yīnwèi wǒ xiǎng qù Zhōngguó lǚyóu, wǒ juéde Zhōngguó wénhuà hěn yǒu yìsi.", thai: "เพราะว่าฉันอยากไปเที่ยวเมืองจีน และฉันคิดว่าวัฒนธรรมจีนน่าสนใจมาก" },
        { speaker: "A", hanzi: "你觉得汉语难吗？", pinyin: "Nǐ juéde Hànyǔ nán ma?", thai: "คุณคิดว่าภาษาจีนยากไหม?" },
        { speaker: "B", hanzi: "汉字有点难，但是说汉语很有趣！", pinyin: "Hànzì yǒudiǎn nán, dànshì shuō Hànyǔ hěn yǒuqù!", thai: "ตัวอักษรจีนยากนิดหน่อย แต่การพูดภาษาจีนสนุกมาก!" },
      ],
      keyPhrases: [
        { hanzi: "因为...所以...", pinyin: "yīnwèi... suǒyǐ...", thai: "เพราะว่า...จึง..." },
        { hanzi: "我觉得...", pinyin: "wǒ juéde...", thai: "ฉันรู้สึกว่า / ฉันคิดว่า..." },
        { hanzi: "有点儿", pinyin: "yǒudiǎnr", thai: "นิดหน่อย / เล็กน้อย" },
      ],
    },
    quiz: {
      id: "quiz-hsk2-yinwei",
      prompt: "ประโยคใดใช้ 因为 ได้เหมาะสม",
      answer: "因为我累，所以想休息。",
      choices: ["因为我累，所以想休息。", "因为你好。", "因为三本书。", "因为在桌子。"],
      explanation: "因为 (เพราะว่า) ใช้ขึ้นต้นประโยคเหตุผล และคู่กับ 所以 (จึง/ดังนั้น)",
    },
    quizzes: [
      {
        id: "quiz-hsk2-yinwei",
        prompt: "ประโยคใดใช้ 因为 ได้เหมาะสม",
        answer: "因为我累，所以想休息。",
        choices: ["因为我累，所以想休息。", "因为你好。", "因为三本书。", "因为在桌子。"],
        explanation: "因为 (เพราะว่า) ใช้ขึ้นต้นประโยคเหตุผล และคู่กับ 所以 (ดังนั้น)",
      },
      {
        id: "quiz-hsk2-meaning-juede",
        prompt: "คำว่า '觉得' (juéde) แปลว่าอะไร",
        answer: "รู้สึกว่า / คิดว่า",
        choices: ["รู้สึกว่า / คิดว่า", "วิ่งออกกำลังกาย", "ซื้อของขวัญ", "ทำความสะอาด"],
        explanation: "觉得 แปลว่า รู้สึกว่า เช่น 我觉得很好 (ฉันรู้สึกว่าดีมาก)",
      },
      {
        id: "quiz-hsk2-comparison",
        prompt: "ประโยคเปรียบเทียบข้อใดถูกต้องตามหลักไวยากรณ์ (พี่ชายสูงกว่าฉัน)",
        answer: "哥哥比我高",
        choices: ["哥哥比我高", "哥哥高比我", "哥哥和我高比", "哥哥很比我高"],
        explanation: "ไวยากรณ์การเปรียบเทียบในภาษาจีนคือ A + 比 + B + คำคุณศัพท์",
      },
      {
        id: "quiz-hsk2-travel",
        prompt: "คำว่า '旅游' (lǚyóu) หมายถึงกิจกรรมใด",
        answer: "ท่องเที่ยว",
        choices: ["ท่องเที่ยว", "ทำกับข้าว", "นอนหลับ", "อ่านหนังสือ"],
        explanation: "旅游 (lǚyóu) แปลว่า การท่องเที่ยวหรือการเดินทางพักผ่อน",
      },
    ],
  },
  {
    id: "hsk3",
    title: "HSK 3",
    words: 600,
    target: "เล่าเหตุการณ์ อภิปราย และรับมือสถานการณ์ทั่วไปได้อย่างคล่องแคล่ว",
    color: "#22806b",
    focus: "คำเชื่อม ลำดับเหตุการณ์ ประสบการณ์ที่ผ่านมา และคำขยายกริยา",
    vocabulary: [
      {
        id: "hsk3-turan",
        hanzi: "突然",
        pinyin: "tū rán",
        thai: "ทันใดนั้น / กะทันหัน",
        example: "他突然给我打电话。",
        examplePinyin: "Tā tūrán gěi wǒ dǎ diànhuà.",
        exampleThai: "ทันใดนั้นเขาก็โทรหาฉัน",
        category: "คำคุณศัพท์",
      },
      {
        id: "hsk3-renzhen",
        hanzi: "认真",
        pinyin: "rèn zhēn",
        thai: "จริงจัง / ตั้งใจ",
        example: "她学习很认真。",
        examplePinyin: "Tā xuéxí hěn rènzhēn.",
        exampleThai: "เธอตั้งใจเรียนมาก",
        category: "คำคุณศัพท์",
      },
      {
        id: "hsk3-jihui",
        hanzi: "机会",
        pinyin: "jī huì",
        thai: "โอกาส",
        example: "这是一个好机会。",
        examplePinyin: "Zhè shì yí gè hǎo jīhuì.",
        exampleThai: "นี่คือโอกาสที่ดี",
        category: "คำนาม",
      },
      {
        id: "hsk3-wancheng",
        hanzi: "完成",
        pinyin: "wán chéng",
        thai: "ทำเสร็จ / สำเร็จ",
        example: "我已经完成作业了。",
        examplePinyin: "Wǒ yǐjīng wánchéng zuòyè le.",
        exampleThai: "ฉันทำการบ้านเสร็จเรียบร้อยแล้ว",
        category: "คำกริยา",
      },
      {
        id: "hsk3-xiguan",
        hanzi: "习惯",
        pinyin: "xí guàn",
        thai: "ความเคยชิน / เคยชิน",
        example: "我已经习惯早起了。",
        examplePinyin: "Wǒ yǐjīng xíguàn zǎoqǐ le.",
        exampleThai: "ฉันชินกับการตื่นเช้าแล้ว",
        category: "คำนาม",
      },
      {
        id: "hsk3-jieguo",
        hanzi: "结果",
        pinyin: "jié guǒ",
        thai: "ผลลัพธ์",
        example: "考试结果出来了。",
        examplePinyin: "Kǎoshì jiéguǒ chūlái le.",
        exampleThai: "ผลสอบออกมาแล้ว",
        category: "คำนาม",
      },
      {
        id: "hsk3-fuxi",
        hanzi: "复习",
        pinyin: "fù xí",
        thai: "ทบทวน (บทเรียน)",
        example: "今天我们要复习第三课。",
        examplePinyin: "Jīntiān wǒmen yào fùxí dì sān kè.",
        exampleThai: "วันนี้พวกเราต้องทบทวนบทที่ 3",
        category: "คำกริยา",
      },
    ],
    lesson: {
      title: "การเล่าประสบการณ์ด้วย 过 และการบอกผลลัพธ์ด้วย 了",
      grammar: "ใช้ 过 เพื่อบอกประสบการณ์ 'เคยทำ' และใช้ 了 เพื่อบอกการเสร็จสิ้นหรือการเปลี่ยนแปลง",
      grammarDetail: "โครงสร้าง 'เคยทำ': [ประธาน] + [กริยา] + 过 (เช่น 我去过北京 = ฉันเคยไปปักกิ่ง / ถ้าปฏิเสธใช้ 没...过 เช่น 我没吃过 = ฉันไม่เคยกิน) และใช้ 把 เพื่อเน้นการกระทำต่อกรรม (เช่น 把书放在桌子上 = เอาหนังสือวางบนโต๊ะ)",
      dialog: "A: 你去过北京吗？\nB: 去过，我去年夏天去了一次北京。\nA: 听说北京的烤鸭很好吃，你尝了吗？\nB: 尝过了，味道非常好！如果有机会我还想再去一次。",
      dialogLines: [
        { speaker: "A", hanzi: "你去过北京吗？", pinyin: "Nǐ qù guo Běijīng ma?", thai: "คุณเคยไปปักกิ่งไหม?" },
        { speaker: "B", hanzi: "去过，我去年夏天去了一次北京。", pinyin: "Qù guo, wǒ qùnián xiàtiān qù le yí cì Běijīng.", thai: "เคยไปครับ เมื่อหน้าร้อนปีที่แล้วฉันไปมาครั้งหนึ่ง" },
        { speaker: "A", hanzi: "听说北京的烤鸭很好吃，你尝了吗？", pinyin: "Tīngshuō Běijīng de kǎoyā hěn hǎochī, nǐ cháng le ma?", thai: "ได้ยินว่าเป็ดย่างปักกิ่งอร่อยมาก คุณได้ลองชิมหรือยัง?" },
        { speaker: "B", hanzi: "尝过了，味道非常好！如果有机会我还想再去一次。", pinyin: "Cháng guo le, wèidào fēicháng hǎo! Rúguǒ yǒu jīhuì wǒ hái xiǎng zài qù yí cì.", thai: "ลองชิมแล้ว รสชาติดีมากๆ! ถ้ามีโอกาสฉันยังอยากไปอีกครั้ง" },
      ],
      keyPhrases: [
        { hanzi: "去过 / 没去过", pinyin: "qù guo / méi qù guo", thai: "เคยไป / ไม่เคยไป" },
        { hanzi: "如果有机会", pinyin: "rúguǒ yǒu jīhuì", thai: "ถ้าหากมีโอกาส" },
        { hanzi: "听说...", pinyin: "tīngshuō...", thai: "ได้ยินมาว่า..." },
      ],
    },
    quiz: {
      id: "quiz-hsk3-complete",
      prompt: "我已经完成作业了 สื่อความหมายใกล้เคียงข้อใด",
      answer: "ฉันทำการบ้านเสร็จแล้ว",
      choices: ["ฉันทำการบ้านเสร็จแล้ว", "ฉันยังไม่เริ่ม", "ฉันจะซื้อการบ้าน", "ฉันไม่รู้จักการบ้าน"],
      explanation: "已经 (เรียบร้อยแล้ว) + 完成 (ทำเสร็จ) แปลว่า ทำเสร็จเรียบร้อยแล้ว",
    },
    quizzes: [
      {
        id: "quiz-hsk3-complete",
        prompt: "我已经完成作业了 สื่อความหมายใกล้เคียงข้อใด",
        answer: "ฉันทำการบ้านเสร็จแล้ว",
        choices: ["ฉันทำการบ้านเสร็จแล้ว", "ฉันยังไม่เริ่ม", "ฉันจะซื้อการบ้าน", "ฉันไม่รู้จักการบ้าน"],
        explanation: "已经 (เรียบร้อยแล้ว) + 完成 (ทำเสร็จ) แปลว่า ทำเสร็จเรียบร้อยแล้ว",
      },
      {
        id: "quiz-hsk3-guo",
        prompt: "ถ้าจะพูดว่า 'ฉันไม่เคยไปเมืองจีน' ควรพูดว่าอย่างไร",
        answer: "我没去过中国",
        choices: ["我没去过中国", "我不去过中国", "我去了中国", "我没有去中国了"],
        explanation: "การปฏิเสธรูปประโยค 'เคยทำ (过)' ให้ใช้ 没 / 没有 วางหน้ากริยาเสมอ ห้ามใช้ 不",
      },
      {
        id: "quiz-hsk3-renzhen",
        prompt: "คำว่า '认真' (rènzhēn) มีความหมายตรงกับข้อใด",
        answer: "ตั้งใจ / จริงจัง",
        choices: ["ตั้งใจ / จริงจัง", "รวดเร็ว", "โกรธเคือง", "ขี้เกียจ"],
        explanation: "认真 (rènzhēn) แปลว่า ตั้งใจ จริงจัง ละเอียดรอบคอบ",
      },
      {
        id: "quiz-hsk3-turan",
        prompt: "คำว่า '突然' (tūrán) ทำหน้าที่ขยายความหมายแบบใด",
        answer: "เกิดขึ้นอย่างกะทันหัน / ทันใดนั้น",
        choices: ["เกิดขึ้นอย่างกะทันหัน / ทันใดนั้น", "เกิดขึ้นเป็นประจำ", "ไม่เคยเกิดขึ้นเลย", "เกิดขึ้นอย่างช้าๆ"],
        explanation: "突然 หมายถึง สิ่งที่เกิดขึ้นกะทันหันไม่ได้คาดคิด",
      },
    ],
  },
  {
    id: "hsk4",
    title: "HSK 4",
    words: 1200,
    target: "อภิปรายเรื่องเรียน การทำงาน สังคม และแสดงทัศนะได้รอบด้าน",
    color: "#2f6db5",
    focus: "คำศัพท์นามธรรม โครงสร้างประโยคซับซ้อน และการแสดงมุมมองอย่างเป็นทางการ",
    vocabulary: [
      {
        id: "hsk4-shiying",
        hanzi: "适应",
        pinyin: "shì yìng",
        thai: "ปรับตัว / เข้ากับ",
        example: "我需要时间适应新环境。",
        examplePinyin: "Wǒ xūyào shíjiān shìyìng xīn huánjìng.",
        exampleThai: "ฉันต้องการเวลาปรับตัวเข้ากับสภาพแวดล้อมใหม่",
        category: "คำกริยา",
      },
      {
        id: "hsk4-yali",
        hanzi: "压力",
        pinyin: "yā lì",
        thai: "ความกดดัน / ความเครียด",
        example: "考试前压力很大。",
        examplePinyin: "Kǎoshì qián yālì hěn dà.",
        exampleThai: "ก่อนสอบมีความกดดันมาก",
        category: "คำนาม",
      },
      {
        id: "hsk4-jingyan",
        hanzi: "经验",
        pinyin: "jīng yàn",
        thai: "ประสบการณ์",
        example: "这份工作需要经验。",
        examplePinyin: "Zhè fèn gōngzuò xūyào jīngyàn.",
        exampleThai: "งานนี้จำเป็นต้องมีประสบการณ์",
        category: "คำนาม",
      },
      {
        id: "hsk4-tigao",
        hanzi: "提高",
        pinyin: "tí gāo",
        thai: "ยกระดับ / พัฒนาขึ้น",
        example: "阅读可以提高词汇量。",
        examplePinyin: "Yuèdú kěyǐ tígāo cíhuìliàng.",
        exampleThai: "การอ่านสามารถช่วยเพิ่มพูนคลังคำศัพท์ได้",
        category: "คำกริยา",
      },
      {
        id: "hsk4-chenggong",
        hanzi: "成功",
        pinyin: "chéng gōng",
        thai: "ประสบความสำเร็จ",
        example: "坚持就是成功的关键。",
        examplePinyin: "Jiānchí jiù shì chénggōng de guānjiàn.",
        exampleThai: "ความอดทนไม่ย่อท้อคือกุญแจสู่ความสำเร็จ",
        category: "คำนาม",
      },
      {
        id: "hsk4-huxiang",
        hanzi: "互相",
        pinyin: "hù xiāng",
        thai: "ซึ่งกันและกัน",
        example: "我们应该互相帮助。",
        examplePinyin: "Wǒmen yīnggāi hùxiāng bāngzhù.",
        exampleThai: "พวกเราควรช่วยเหลือซึ่งกันและกัน",
        category: "คำวิเศษณ์",
      },
    ],
    lesson: {
      title: "การแสดงความคิดเห็นอย่างเป็นทางการ และการให้เหตุผลเชิงลึก",
      grammar: "ใช้ 对...来说 เพื่อบอกมุมมองของคนหรือกลุ่มหนึ่ง และ 不仅...而且... (ไม่เพียงแต่...แต่ยัง...)",
      grammarDetail: "โครงสร้างบอกมุมมอง: 对 + [บุคคล/กลุ่ม] + 来说, [ความคิดเห็น] เช่น 对我来说，学中文最重要的是多练习 (สำหรับฉัน สิ่งที่สำคัญที่สุดในการเรียนจีนคือการฝึกฝนบ่อยๆ) / โครงสร้าง 不仅...而且... (ไม่เพียงแต่...แต่ยัง...) เช่น 他不仅聪明，而且很努力 (เขาไม่เพียงฉลาด แต่ยังขยันมาก)",
      dialog: "A: 对你来说，学中文最难的是什么？\nB: 我觉得是听力和写作，因为日常生活中很少有机会练习。\nA: 那你打算怎么提高呢？\nB: 我打算每天看半小时中文新闻，并且多写短文，慢慢适应。",
      dialogLines: [
        { speaker: "A", hanzi: "对你来说，学中文最难的是什么？", pinyin: "Duì nǐ lái shuō, xué Zhōngwén zuì nán de shì shénme?", thai: "สำหรับคุณ สิ่งที่ยากที่สุดในการเรียนภาษาจีนคืออะไร?" },
        { speaker: "B", hanzi: "我觉得是听力和写作，因为日常生活中很少有机会练习。", pinyin: "Wǒ juéde shì tīnglì hé xiězuò, yīnwèi rìcháng shēnghuó zhōng hěn shǎo yǒu jīhuì liànxí.", thai: "ฉันคิดว่าคือการฟังและการเขียน เพราะในชีวิตประจำวันไม่ค่อยมีโอกาสฝึกฝน" },
        { speaker: "A", hanzi: "那你打算怎么提高呢？", pinyin: "Nà nǐ dǎsuàn zěnme tígāo ne?", thai: "แล้วคุณวางแผนจะพัฒนามันอย่างไรล่ะ?" },
        { speaker: "B", hanzi: "我打算每天看半小时中文新闻，并且多写短文，慢慢适应。", pinyin: "Wǒ dǎsuàn měitiān kàn bàn xiǎoshí Zhōngwén xīnwén, bìngqiě duō xiě duǎnwén, mànmàn shìyìng.", thai: "ฉันตั้งใจว่าจะดูข่าวจีนวันละ 30 นาที และเขียนบทความสั้นๆ ให้บ่อยขึ้น ค่อยๆ ปรับตัวไป" },
      ],
      keyPhrases: [
        { hanzi: "对...来说", pinyin: "duì... lái shuō", thai: "สำหรับ...แล้ว" },
        { hanzi: "不仅...而且...", pinyin: "bùjǐn... érqiě...", thai: "ไม่เพียงแต่...แต่ยัง..." },
        { hanzi: "提高水平", pinyin: "tígāo shuǐpíng", thai: "ยกระดับความสามารถ" },
      ],
    },
    quiz: {
      id: "quiz-hsk4-tigao",
      prompt: "คำว่า 提高 ใช้กับอะไรได้เหมาะที่สุด",
      answer: "提高听力水平",
      choices: ["提高听力水平", "提高一杯水", "提高桌子下面", "提高昨天"],
      explanation: "提高 (tígāo) นิยมใช้กับ 水平 (ระดับ/ทักษะ) เช่น 提高汉语水平",
    },
    quizzes: [
      {
        id: "quiz-hsk4-tigao",
        prompt: "คำว่า 提高 ใช้กับอะไรได้เหมาะที่สุด",
        answer: "提高听力水平",
        choices: ["提高听力水平", "提高一杯水", "提高桌子下面", "提高昨天"],
        explanation: "提高 (tígāo) นิยมใช้กับ 水平 (ระดับ/ทักษะ) เช่น 提高汉语水平",
      },
      {
        id: "quiz-hsk4-duilaishuo",
        prompt: "เติมคำในช่องว่าง: '______ 我来说，每天阅读很有帮助。'",
        answer: "对",
        choices: ["对", "给", "在", "向"],
        explanation: "โครงสร้างไวยากรณ์คือ 对...来说 (สำหรับ...แล้ว)",
      },
      {
        id: "quiz-hsk4-yali",
        prompt: "คำว่า '压力' (yālì) หมายถึงข้อใด",
        answer: "ความกดดัน / ความเครียด",
        choices: ["ความกดดัน / ความเครียด", "ความสบายใจ", "ความโชคดี", "ความเงียบสงบ"],
        explanation: "压力 แปลว่า ความกดดัน หรือ ความเครียดจากการทำงาน/สอบ",
      },
      {
        id: "quiz-hsk4-shiying",
        prompt: "ประโยค '适应新环境' สื่อถึงการทำสิ่งใด",
        answer: "ปรับตัวเข้ากับสิ่งแวดล้อมใหม่",
        choices: ["ปรับตัวเข้ากับสิ่งแวดล้อมใหม่", "ทำลายสิ่งแวดล้อมใหม่", "หนีออกจากที่เดิม", "ซื้อบ้านใหม่"],
        explanation: "适应 (shìyìng) แปลว่า ปรับตัว, 新环境 คือ สิ่งแวดล้อมใหม่",
      },
    ],
  },
];

export const dailyTasks = [
  "อ่านออกเสียง 10 นาที",
  "ทบทวนบัตรคำ 12 ใบ",
  "ฝึกฟังบทสนทนา 1 บท",
  "ทำแบบทดสอบ 5 ข้อ",
  "เขียนประโยคใหม่ 3 ประโยค",
];

export const studyTips = [
  {
    title: "1. จำอักษรจีนจากหมวดนำ (Radicals 部首)",
    desc: "อักษรจีนกว่า 80% เป็นอักษรผสม เช่น 氵 (น้ำ) มักอยู่ในคำเกี่ยวกับน้ำ เช่น 河 (แม่น้ำ), 洗 (ล้าง), 渴 (กระหายน้ำ)",
  },
  {
    title: "2. จำเสียงวรรณยุกต์เป็นทำนองเพลง",
    desc: "เสียง 1 ราบสูง (ā), เสียง 2 ไต่ขึ้นเหมือนถาม (á), เสียง 3 ลงแล้วขึ้น (ǎ), เสียง 4 กดหนักสะบัด (à)",
  },
  {
    title: "3. ฝึกเป็นประโยค ดีกว่าจำคำเดี่ยว",
    desc: "การจำว่า '因为...所以...' ในประโยคจริง จะทำให้เรานำไปแต่งประโยคและพูดออกมาได้อัตโนมัติ",
  },
  {
    title: "4. เทคนิค Spaced Repetition (25 นาทีต่อวัน)",
    desc: "ทบทวนสม่ำเสมอทุกวันวันละ 25 นาที ได้ผลดีกว่าการอ่านอัด 5 ชั่วโมงก่อนสอบ",
  },
];
