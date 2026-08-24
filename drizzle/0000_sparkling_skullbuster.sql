CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`level_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_answer` text NOT NULL,
	`is_correct` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_session_created` ON `quiz_attempts` (`session_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_question` ON `quiz_attempts` (`question_id`);--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`level_id` text NOT NULL,
	`prompt` text NOT NULL,
	`answer` text NOT NULL,
	`choices_json` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_questions_level_position` ON `quiz_questions` (`level_id`,`position`);--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`id` text PRIMARY KEY NOT NULL,
	`level_id` text NOT NULL,
	`hanzi` text NOT NULL,
	`pinyin` text NOT NULL,
	`thai` text NOT NULL,
	`example` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_vocabulary_level_position` ON `vocabulary` (`level_id`,`position`);