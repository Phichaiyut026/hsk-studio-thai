ALTER TABLE `quiz_attempts` ADD `user_id` text;--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_user_created` ON `quiz_attempts` (`user_id`,`created_at`);