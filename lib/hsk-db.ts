import { count, eq, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../db";
import { quizAttempts, quizQuestions, users, vocabulary } from "../db/schema";
import { hskLevels, type Level } from "./hsk-data";

export type AppRole = "user" | "admin";

export type AuthProfile = {
  userId: string;
  email: string;
  displayName: string;
  role: AppRole;
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

  const questionRows = hskLevels.map((level, index) => ({
    id: level.quiz.id,
    levelId: level.id,
    prompt: level.quiz.prompt,
    answer: level.quiz.answer,
    choicesJson: JSON.stringify(level.quiz.choices),
    position: index,
  }));

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
          (id, level_id, prompt, answer, choices_json, position)
          VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          question.id,
          question.levelId,
          question.prompt,
          question.answer,
          question.choicesJson,
          question.position,
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
    await d1.prepare("ALTER TABLE quiz_attempts ADD COLUMN user_id text").run();
  } catch {
    // Existing local databases may already have this column.
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
  const localAdmin = input.userId === "local-dev-user";
  const initialRole: AppRole = input.userId === adminUserId || localAdmin ? "admin" : "user";
  const d1 = env.DB;

  await d1.prepare(
    `INSERT INTO users (user_id, email, display_name, role)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       email = excluded.email,
       display_name = excluded.display_name,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(input.userId, input.email, input.displayName, initialRole).run();

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

export async function updateUserRole(userId: string, role: AppRole) {
  await ensureHskSchema();
  const db = getDb();
  await db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.userId, userId));
}

export async function getStudyData(sessionId: string) {
  const db = getDb();
  const words = await db.select().from(vocabulary).orderBy(vocabulary.levelId, vocabulary.position);
  const questions = await db.select().from(quizQuestions).orderBy(quizQuestions.levelId, quizQuestions.position);
  const stats = await getQuizStats(sessionId);

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
    const question = questions.find((item) => item.levelId === level.id);

    return {
      ...level,
      vocabulary: levelWords.length ? levelWords : level.vocabulary,
      quiz: question
        ? {
            id: question.id,
            prompt: question.prompt,
            answer: question.answer,
            choices: parseChoices(question.choicesJson, level.quiz.choices),
          }
        : level.quiz,
    };
  });

  return { levels, stats };
}

export async function getStudyDataForUser(userId: string) {
  const data = await getStudyData(userId);
  return {
    ...data,
    stats: await getQuizStatsForUser(userId),
  };
}

export async function saveQuizAttempt(input: {
  userId: string;
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
    userId: input.userId,
    sessionId: input.sessionId,
    levelId: input.levelId,
    questionId: input.questionId,
    selectedAnswer: input.selectedAnswer,
    isCorrect,
  });

  return {
    isCorrect,
    stats: await getQuizStatsForUser(input.userId),
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
