import { count, eq, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../db";
import { quizAttempts, quizQuestions, users, vocabulary } from "../db/schema";
import { hskLevels, type Level } from "./hsk-data";
import { hashPassword, verifyPassword } from "./password";

export type AppRole = "user" | "admin";

export type AuthProfile = {
  userId: string;
  email: string;
  displayName: string;
  role: AppRole;
};

export type SystemOverview = {
  users: {
    total: number;
    admins: number;
    regular: number;
  };
  content: {
    vocabulary: number;
    quizQuestions: number;
    quizAttempts: number;
  };
  database: {
    binding: string;
    status: "ready";
  };
};

export async function ensureHskSeedData() {
  await ensureHskSchema();

  const d1 = env.DB;
  const vocabRows = hskLevels.flatMap((level) =>
    level.vocabulary.map((word, index) => ({
      id: word.id,
      levelId: level.id,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      thai: word.thai,
      example: word.example,
      position: index,
    })),
  );

  const questionRows = hskLevels.flatMap((level) =>
    (level.quizzes && level.quizzes.length > 0 ? level.quizzes : [level.quiz]).map((question, index) => ({
      id: question.id,
      levelId: level.id,
      prompt: question.prompt,
      answer: question.answer,
      choicesJson: JSON.stringify(question.choices),
      position: index,
      documentId: question.documentId ?? "H11329",
      part: question.part ?? "reading",
      section: question.section ?? "1",
      format: question.format ?? "choice",
      questionNumber: question.questionNumber ?? index + 1,
      mediaUrl: question.mediaUrl ?? null,
    })),
  );

  await d1.batch([
    ...vocabRows.map((word) =>
      d1
        .prepare(
          `INSERT OR IGNORE INTO vocabulary
          (id, level_id, hanzi, pinyin, thai, example, position)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(word.id, word.levelId, word.hanzi, word.pinyin, word.thai, word.example, word.position),
    ),
    ...questionRows.map((question) =>
      d1
        .prepare(
          `INSERT OR IGNORE INTO quiz_questions
          (id, level_id, prompt, answer, choices_json, position, document_id, part, section, format, question_number, media_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          question.id,
          question.levelId,
          question.prompt,
          question.answer,
          question.choicesJson,
          question.position,
          question.documentId,
          question.part,
          question.section,
          question.format,
          question.questionNumber,
          question.mediaUrl,
        ),
    ),
    ...questionRows.map((question) =>
      d1.prepare(
        `UPDATE quiz_questions
         SET document_id = ?, part = ?, section = ?, format = ?, question_number = ?, media_url = ?
         WHERE id = ?`,
      ).bind(
        question.documentId, question.part, question.section, question.format,
        question.questionNumber, question.mediaUrl, question.id,
      ),
    ),
  ]);
}

async function ensureHskSchema() {
  const d1 = env.DB;
  if (!d1) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  await d1.batch([
    d1.prepare(
      `CREATE TABLE IF NOT EXISTS users (
        user_id text PRIMARY KEY NOT NULL,
        email text NOT NULL,
        display_name text NOT NULL,
        password_hash text,
        role text DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`,
    ),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)"),
    d1.prepare(
      `CREATE TABLE IF NOT EXISTS vocabulary (
        id text PRIMARY KEY NOT NULL,
        level_id text NOT NULL,
        hanzi text NOT NULL,
        pinyin text NOT NULL,
        thai text NOT NULL,
        example text NOT NULL,
        english text NOT NULL DEFAULT '',
        part_of_speech text,
        tts_url text,
        source text NOT NULL DEFAULT 'local',
        position integer NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`,
    ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS idx_vocabulary_level_position ON vocabulary (level_id, position)",
    ),
    d1.prepare(
      `CREATE TABLE IF NOT EXISTS quiz_questions (
        id text PRIMARY KEY NOT NULL,
        level_id text NOT NULL,
        prompt text NOT NULL,
        answer text NOT NULL,
        choices_json text NOT NULL,
        position integer NOT NULL,
        document_id text NOT NULL DEFAULT 'H11329',
        part text NOT NULL DEFAULT 'reading',
        section text NOT NULL DEFAULT '1',
        format text NOT NULL DEFAULT 'choice',
        question_number integer NOT NULL DEFAULT 1,
        media_url text,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`,
    ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS idx_quiz_questions_level_position ON quiz_questions (level_id, position)",
    ),
    d1.prepare(
      `CREATE TABLE IF NOT EXISTS quiz_attempts (
        id text PRIMARY KEY NOT NULL,
        user_id text,
        session_id text NOT NULL,
        level_id text NOT NULL,
        question_id text NOT NULL,
        selected_answer text NOT NULL,
        is_correct integer NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`,
    ),
  ]);

  try {
    await d1.prepare("ALTER TABLE users ADD COLUMN password_hash text").run();
  } catch {
    // Existing databases may already have this column.
  }

  try {
    await d1.prepare("ALTER TABLE quiz_attempts ADD COLUMN user_id text").run();
  } catch {
    // Existing local databases may already have this column.
  }

  for (const statement of [
    "ALTER TABLE vocabulary ADD COLUMN english text NOT NULL DEFAULT ''",
    "ALTER TABLE vocabulary ADD COLUMN part_of_speech text",
    "ALTER TABLE vocabulary ADD COLUMN tts_url text",
    "ALTER TABLE vocabulary ADD COLUMN source text NOT NULL DEFAULT 'local'",
    "ALTER TABLE quiz_questions ADD COLUMN document_id text NOT NULL DEFAULT 'H11329'",
    "ALTER TABLE quiz_questions ADD COLUMN part text NOT NULL DEFAULT 'reading'",
    "ALTER TABLE quiz_questions ADD COLUMN section text NOT NULL DEFAULT '1'",
    "ALTER TABLE quiz_questions ADD COLUMN format text NOT NULL DEFAULT 'choice'",
    "ALTER TABLE quiz_questions ADD COLUMN question_number integer NOT NULL DEFAULT 1",
    "ALTER TABLE quiz_questions ADD COLUMN media_url text",
  ]) {
    try { await d1.prepare(statement).run(); } catch { /* Existing databases may already have this column. */ }
  }

  await d1.batch([
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_created ON quiz_attempts (user_id, created_at)",
    ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_created ON quiz_attempts (session_id, created_at)",
    ),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question ON quiz_attempts (question_id)"),
    d1.prepare("PRAGMA optimize"),
  ]);
}

export async function ensureUserProfile(input: {
  userId: string;
  email: string;
  displayName: string;
}): Promise<AuthProfile> {
  await ensureHskSchema();
  const adminUserId = ((env as unknown as { ADMIN_USER_ID?: string }).ADMIN_USER_ID ?? "").trim();
  const adminEmail = ((env as unknown as { ADMIN_EMAIL?: string }).ADMIN_EMAIL ?? "").trim().toLowerCase();
  const localAdmin = input.userId === "local-dev-user";
  const d1 = env.DB;
  const userCount = await d1.prepare("SELECT COUNT(*) as total FROM users").first<{ total: number }>();
  const configuredAdmin =
    input.userId === adminUserId || input.email.toLowerCase() === adminEmail || localAdmin;
  const initialRole: AppRole = configuredAdmin || Number(userCount?.total ?? 0) === 0 ? "admin" : "user";

  await d1.prepare(
    `INSERT INTO users (user_id, email, display_name, role)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       email = excluded.email,
       display_name = excluded.display_name,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(input.userId, input.email, input.displayName, initialRole).run();

  if (configuredAdmin) {
    await d1.prepare(
      "UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
    ).bind(input.userId).run();
  }

  const profile = await d1.prepare(
    "SELECT user_id, email, display_name, role FROM users WHERE user_id = ? LIMIT 1",
  ).bind(input.userId).first<{ user_id: string; email: string; display_name: string; role: AppRole }>();

  if (!profile || (profile.role !== "user" && profile.role !== "admin")) {
    throw new Error("User profile could not be loaded");
  }

  return {
    userId: profile.user_id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
  };
}

export async function registerUser(input: { email: string; displayName: string; password: string; role?: AppRole }) {
  await ensureHskSchema();
  const d1 = env.DB;
  const email = input.email.trim().toLowerCase();
  const existing = await d1.prepare("SELECT user_id, password_hash, role FROM users WHERE lower(email) = ? OR lower(display_name) = ? LIMIT 1").bind(email, input.displayName.trim().toLowerCase()).first<{ user_id: string; password_hash: string | null; role: AppRole }>();
  if (existing?.password_hash) throw new Error("อีเมลนี้มีบัญชีอยู่แล้ว");

  const countRow = await d1.prepare("SELECT COUNT(*) as total FROM users").first<{ total: number }>();
  const adminEmail = ((env as unknown as { ADMIN_EMAIL?: string }).ADMIN_EMAIL ?? "").trim().toLowerCase();
  const role = input.role ?? (Number(countRow?.total ?? 0) === 0 || email === adminEmail ? "admin" : "user");
  const userId = existing?.user_id ?? `email:${email}`;
  const passwordHash = await hashPassword(input.password);
  if (existing) {
    await d1.prepare("UPDATE users SET display_name = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
      .bind(input.displayName.trim() || email.split("@")[0], passwordHash, userId).run();
  } else {
    await d1.prepare(
      `INSERT INTO users (user_id, email, display_name, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(userId, email, input.displayName.trim() || email.split("@")[0], passwordHash, role).run();
  }
  return { userId, email, displayName: input.displayName.trim() || email.split("@")[0], role: existing?.role ?? role };
}

export async function authenticateUser(identifierInput: string, password: string) {
  await ensureHskSchema();
  const d1 = env.DB;
  const identifier = identifierInput.trim().toLowerCase();
  const row = await d1.prepare(
    "SELECT user_id, email, display_name, role, password_hash FROM users WHERE lower(display_name) = ? OR lower(email) = ? LIMIT 1",
  ).bind(identifier, identifier).first<{ user_id: string; email: string; display_name: string; role: AppRole; password_hash: string | null }>();
  if (!row) return null;

  if (row.password_hash) {
    if (!(await verifyPassword(password, row.password_hash))) return null;
  } else return null;

  return { userId: row.user_id, email: row.email, displayName: row.display_name, role: row.role };
}

export async function listUsers() {
  await ensureHskSchema();
  const db = getDb();
  return db.select({
    userId: users.userId,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
}

export async function addVocabularyWord(input: {
  levelId: string;
  hanzi: string;
  pinyin: string;
  thai: string;
  example: string;
}) {
  await ensureHskSchema();
  const d1 = env.DB;
  const positionRow = await d1
    .prepare("SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM vocabulary WHERE level_id = ?")
    .bind(input.levelId)
    .first<{ next_position: number }>();
  const id = `admin-${input.levelId}-${crypto.randomUUID()}`;

  await d1
    .prepare(
      `INSERT INTO vocabulary (id, level_id, hanzi, pinyin, thai, example, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.levelId,
      input.hanzi,
      input.pinyin,
      input.thai,
      input.example,
      Number(positionRow?.next_position ?? 0),
    )
    .run();

  return { id };
}

export async function listVocabulary() {
  await ensureHskSchema();
  const d1 = env.DB;
  const result = await d1
    .prepare(
      `SELECT id, level_id, hanzi, pinyin, thai, example, position, created_at
       FROM vocabulary ORDER BY level_id, position, created_at DESC`,
    )
    .all<{
      id: string;
      level_id: string;
      hanzi: string;
      pinyin: string;
      thai: string;
      example: string;
      position: number;
      created_at: string;
    }>();

  return result.results.map((word) => ({
    id: word.id,
    levelId: word.level_id,
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    thai: word.thai,
    example: word.example,
    position: word.position,
    createdAt: word.created_at,
  }));
}

export async function updateVocabularyWord(id: string, input: {
  levelId: string;
  hanzi: string;
  pinyin: string;
  thai: string;
  example: string;
}) {
  await ensureHskSchema();
  const d1 = env.DB;
  await d1.prepare(
    `UPDATE vocabulary SET level_id = ?, hanzi = ?, pinyin = ?, thai = ?, example = ? WHERE id = ?`,
  ).bind(input.levelId, input.hanzi, input.pinyin, input.thai, input.example, id).run();
}

export async function deleteVocabularyWord(id: string) {
  await ensureHskSchema();
  await env.DB.prepare("DELETE FROM vocabulary WHERE id = ?").bind(id).run();
}

export async function updateUserRole(userId: string, role: AppRole) {
  await ensureHskSchema();
  const db = getDb();
  await db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.userId, userId));
}

export async function getSystemOverview(): Promise<SystemOverview> {
  await ensureHskSchema();
  const db = getDb();

  const [userStats] = await db.select({
    total: count(),
    admins: sql<number>`coalesce(sum(case when ${users.role} = 'admin' then 1 else 0 end), 0)`,
  }).from(users);
  const [vocabStats] = await db.select({ total: count() }).from(vocabulary);
  const [questionStats] = await db.select({ total: count() }).from(quizQuestions);
  const [attemptStats] = await db.select({ total: count() }).from(quizAttempts);

  const totalUsers = Number(userStats?.total ?? 0);
  const admins = Number(userStats?.admins ?? 0);

  return {
    users: {
      total: totalUsers,
      admins,
      regular: Math.max(totalUsers - admins, 0),
    },
    content: {
      vocabulary: Number(vocabStats?.total ?? 0),
      quizQuestions: Number(questionStats?.total ?? 0),
      quizAttempts: Number(attemptStats?.total ?? 0),
    },
    database: {
      binding: "DB",
      status: "ready",
    },
  };
}

export async function listQuizQuestions() {
  await ensureHskSchema();
  const result = await env.DB.prepare(
    `SELECT id, level_id, prompt, answer, choices_json, position, document_id, part, section, format, question_number, media_url, created_at
     FROM quiz_questions ORDER BY level_id, document_id, part, section, question_number, position`,
  ).all<{
    id: string; level_id: string; prompt: string; answer: string; choices_json: string; position: number;
    document_id: string; part: string; section: string; format: string; question_number: number; media_url: string | null; created_at: string;
  }>();

  return result.results.map((question) => ({
    id: question.id,
    levelId: question.level_id,
    prompt: question.prompt,
    answer: question.answer,
    choices: parseChoices(question.choices_json, []),
    position: question.position,
    documentId: question.document_id,
    part: question.part,
    section: question.section,
    format: question.format,
    questionNumber: question.question_number,
    mediaUrl: question.media_url ?? "",
    createdAt: question.created_at,
  }));
}

export async function addQuizQuestion(input: {
  levelId: string;
  documentId: string;
  part: string;
  section: string;
  format: string;
  questionNumber: number;
  prompt: string;
  choices: string[];
  answer: string;
  mediaUrl?: string;
}) {
  await ensureHskSchema();
  const positionRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM quiz_questions WHERE level_id = ? AND document_id = ?",
  ).bind(input.levelId, input.documentId).first<{ next_position: number }>();
  const id = `admin-quiz-${input.levelId}-${crypto.randomUUID()}`;
  await env.DB.prepare(
    `INSERT INTO quiz_questions
      (id, level_id, prompt, answer, choices_json, position, document_id, part, section, format, question_number, media_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, input.levelId, input.prompt, input.answer, JSON.stringify(input.choices),
    Number(positionRow?.next_position ?? 0), input.documentId, input.part, input.section,
    input.format, input.questionNumber, input.mediaUrl?.trim() || null,
  ).run();
  return { id };
}

type HuggingFaceHskRow = {
  level?: number;
  hanzi?: string;
  pinyin?: string;
  pinyin_tone?: string;
  english?: string;
  pos?: string | null;
  tts_url?: string | null;
};

export async function syncHuggingFaceHskVocabulary() {
  await ensureHskSchema();
  const endpoint = "https://datasets-server.huggingface.co/rows?dataset=willfliaw%2Fhsk-dataset&config=default&split=train";
  const importedRows: HuggingFaceHskRow[] = [];
  const pageSize = 100;

  for (let offset = 0; offset < 10000; offset += pageSize) {
    const response = await fetch(`${endpoint}&offset=${offset}&length=${pageSize}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Hugging Face API returned ${response.status}`);
    const payload = (await response.json()) as { rows?: Array<{ row?: HuggingFaceHskRow } | HuggingFaceHskRow> };
    const rows = (payload.rows ?? []).map((item) => ("row" in item && item.row ? item.row : item as HuggingFaceHskRow));
    if (!rows.length) break;
    importedRows.push(...rows);
    if (rows.length < pageSize) break;
  }

  const validRows = importedRows.filter((row) => Number(row.level) >= 1 && Number(row.level) <= 6 && row.hanzi?.trim());
  const d1 = env.DB;
  for (let index = 0; index < validRows.length; index += 50) {
    const batch = validRows.slice(index, index + 50).map((row) => {
      const level = Number(row.level);
      const hanzi = row.hanzi!.trim();
      const english = row.english?.trim() ?? "";
      return d1.prepare(
        `INSERT INTO vocabulary
          (id, level_id, hanzi, pinyin, thai, example, english, part_of_speech, tts_url, source, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           pinyin = excluded.pinyin,
           english = excluded.english,
           part_of_speech = excluded.part_of_speech,
           tts_url = excluded.tts_url`,
      ).bind(
        `hf-hsk-${level}-${hanzi}`,
        `hsk${level}`,
        hanzi,
        row.pinyin_tone?.trim() || row.pinyin?.trim() || "",
        english,
        "",
        english,
        row.pos?.trim() || null,
        row.tts_url?.trim() || null,
        "huggingface:willfliaw/hsk-dataset",
        index + validRows.indexOf(row),
      );
    });
    await d1.batch(batch);
  }

  return { imported: validRows.length, source: "willfliaw/hsk-dataset", license: "CC BY 4.0" };
}

export async function getStudyData(sessionId: string) {
  const db = getDb();
  const words = await db.select().from(vocabulary).orderBy(vocabulary.levelId, vocabulary.position);
  const questions = await db.select().from(quizQuestions).orderBy(quizQuestions.levelId, quizQuestions.position);
  const stats = await getQuizStats(sessionId);
  const progress = await getProgressStats({ sessionId });

  const levels: Level[] = hskLevels.map((level) => {
    const levelWords = words
      .filter((word) => word.levelId === level.id)
      .map((word) => ({
        id: word.id,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        thai: word.thai,
        example: word.example,
      }));
    const levelQuestions = questions
      .filter((item) => item.levelId === level.id)
      .sort((left, right) =>
        `${left.documentId}:${left.part}:${left.section}`.localeCompare(`${right.documentId}:${right.part}:${right.section}`) ||
        left.questionNumber - right.questionNumber ||
        left.position - right.position,
      );
    const quizzes = levelQuestions.length
      ? levelQuestions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          answer: question.answer,
          choices: parseChoices(question.choicesJson, level.quiz.choices),
          documentId: question.documentId,
          part: question.part as "listening" | "reading" | "writing",
          section: question.section,
          format: question.format as "choice" | "true-false" | "image-choice" | "matching" | "fill-blank",
          questionNumber: question.questionNumber,
          mediaUrl: question.mediaUrl ?? undefined,
        }))
      : level.quizzes ?? [level.quiz];

    return {
      ...level,
      vocabulary: levelWords.length ? levelWords : level.vocabulary,
      quiz: quizzes[0] ?? level.quiz,
      quizzes,
    };
  });

  return { levels, stats, progress };
}

export async function getStudyDataForUser(userId: string) {
  const data = await getStudyData(userId);
  return {
    ...data,
    stats: await getQuizStatsForUser(userId),
    progress: await getProgressStats({ userId }),
  };
}

export async function saveQuizAttempt(input: {
  userId?: string;
  sessionId: string;
  levelId: string;
  questionId: string;
  selectedAnswer: string;
}) {
  const db = getDb();
  const [question] = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.id, input.questionId))
    .limit(1);

  if (!question) {
    throw new Error("Quiz question not found");
  }

  const isCorrect = question.answer === input.selectedAnswer;
  await db.insert(quizAttempts).values({
    id: crypto.randomUUID(),
    userId: input.userId || null,
    sessionId: input.sessionId,
    levelId: input.levelId,
    questionId: input.questionId,
    selectedAnswer: input.selectedAnswer,
    isCorrect,
  });

  return {
    isCorrect,
    stats: input.userId ? await getQuizStatsForUser(input.userId) : await getQuizStats(input.sessionId),
    progress: await getProgressStats(input.userId ? { userId: input.userId } : { sessionId: input.sessionId }),
  };
}

type ProgressScope = { userId?: string; sessionId?: string };

async function getProgressStats(scope: ProgressScope) {
  const d1 = env.DB;
  const whereColumn = scope.userId ? "user_id" : "session_id";
  const whereValue = scope.userId ?? scope.sessionId ?? "anonymous";

  const levelRows = await d1
    .prepare(
      `SELECT
        level_id,
        COUNT(*) as total_attempts,
        COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END), 0) as correct_attempts,
        MAX(created_at) as last_attempt_at
       FROM quiz_attempts
       WHERE ${whereColumn} = ?
       GROUP BY level_id`,
    )
    .bind(whereValue)
    .all<{
      level_id: string;
      total_attempts: number;
      correct_attempts: number;
      last_attempt_at: string | null;
    }>();

  const recentRows = await d1
    .prepare(
      `SELECT
        a.id,
        a.level_id,
        a.question_id,
        a.selected_answer,
        a.is_correct,
        a.created_at,
        q.prompt,
        q.answer
       FROM quiz_attempts a
       LEFT JOIN quiz_questions q ON q.id = a.question_id
       WHERE a.${whereColumn} = ?
       ORDER BY a.created_at DESC
       LIMIT 8`,
    )
    .bind(whereValue)
    .all<{
      id: string;
      level_id: string;
      question_id: string;
      selected_answer: string;
      is_correct: number;
      created_at: string;
      prompt: string | null;
      answer: string | null;
    }>();

  const questionRows = await d1
    .prepare("SELECT level_id, COUNT(*) as total_questions FROM quiz_questions GROUP BY level_id")
    .all<{ level_id: string; total_questions: number }>();

  const vocabularyRows = await d1
    .prepare("SELECT level_id, COUNT(*) as total_words FROM vocabulary GROUP BY level_id")
    .all<{ level_id: string; total_words: number }>();

  return {
    levels: hskLevels.map((level) => {
      const attempts = levelRows.results.find((row) => row.level_id === level.id);
      const questionCount = questionRows.results.find((row) => row.level_id === level.id)?.total_questions ?? 0;
      const wordCount = vocabularyRows.results.find((row) => row.level_id === level.id)?.total_words ?? level.vocabulary.length;
      const totalAttempts = Number(attempts?.total_attempts ?? 0);
      const correctAttempts = Number(attempts?.correct_attempts ?? 0);
      return {
        levelId: level.id,
        title: level.title,
        color: level.color,
        totalWords: Number(wordCount),
        totalQuestions: Number(questionCount),
        totalAttempts,
        correctAttempts,
        accuracyPercent: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        lastAttemptAt: attempts?.last_attempt_at ?? null,
      };
    }),
    recentAttempts: recentRows.results.map((row) => ({
      id: row.id,
      levelId: row.level_id,
      questionId: row.question_id,
      prompt: row.prompt ?? "คำถามนี้ถูกลบหรือยังไม่มีข้อมูล",
      selectedAnswer: row.selected_answer,
      correctAnswer: row.answer ?? "",
      isCorrect: Boolean(row.is_correct),
      createdAt: row.created_at,
    })),
  };
}

async function getQuizStatsForUser(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      totalAttempts: count(),
      correctAttempts: sql<number>`coalesce(sum(case when ${quizAttempts.isCorrect} = 1 then 1 else 0 end), 0)`,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));

  return {
    totalAttempts: Number(row?.totalAttempts ?? 0),
    correctAttempts: Number(row?.correctAttempts ?? 0),
  };
}

async function getQuizStats(sessionId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      totalAttempts: count(),
      correctAttempts: sql<number>`coalesce(sum(case when ${quizAttempts.isCorrect} = 1 then 1 else 0 end), 0)`,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.sessionId, sessionId));

  return {
    totalAttempts: Number(row?.totalAttempts ?? 0),
    correctAttempts: Number(row?.correctAttempts ?? 0),
  };
}

function parseChoices(value: string, fallback: string[]) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}
