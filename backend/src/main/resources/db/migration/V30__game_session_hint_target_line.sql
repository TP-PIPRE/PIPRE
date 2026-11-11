ALTER TABLE game_session_hints ADD COLUMN target_axis VARCHAR(6);
ALTER TABLE game_session_hints ADD COLUMN target_line INTEGER;
ALTER TABLE game_session_hints ADD CONSTRAINT ck_game_session_hint_target_line CHECK (
    (target_axis IS NULL AND target_line IS NULL)
    OR (target_axis IS NOT NULL AND target_axis IN ('row', 'column') AND target_line IS NOT NULL
        AND target_line >= 0 AND target_x IS NULL AND target_y IS NULL)
);
