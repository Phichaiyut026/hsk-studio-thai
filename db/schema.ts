import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    userId: text("user_id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_users_role").on(table.role)],
);

export const vocabulary = sqliteTable(
  "vocabulary",
  {
    id: text("id").primaryKey(),
    levelId: text("level_id").notNull(),
    hanzi: text("hanzi").notNull(),
    pinyin: text("pinyin").notNull(),
    thai: text("thai").notNull(),
    example: text("example").notNull(),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_vocabulary_level_position").on(table.levelId, table.position)],
);

export const quizQuestions = sqliteTable(
  "quiz_questions",
  {
    id: text("id").primaryKey(),
    levelId: text("level_id").notNull(),
    prompt: text("prompt").notNull(),
    answer: text("answer").notNull(),
    choicesJson: text("choices_json").notNull(),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_quiz_questions_level_position").on(table.levelId, table.position)],
);

export const quizAttempts = sqliteTable(
  "quiz_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    sessionId: text("session_id").notNull(),
    levelId: text("level_id").notNull(),
    questionId: text("question_id").notNull(),
    selectedAnswer: text("selected_answer").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_quiz_attempts_user_created").on(table.userId, table.createdAt),
    index("idx_quiz_attempts_session_created").on(table.sessionId, table.createdAt),
    index("idx_quiz_attempts_question").on(table.questionId),
  ],
);
