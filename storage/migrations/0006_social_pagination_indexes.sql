ALTER TABLE friendships
  ADD KEY idx_friendships_low_updated (user_id_low, updated_at, friendship_id),
  ADD KEY idx_friendships_high_updated (user_id_high, updated_at, friendship_id);

ALTER TABLE trades
  ADD KEY idx_trades_proposed_updated (user_id_proposed, last_update, trade_id),
  ADD KEY idx_trades_accepting_updated (user_id_accepting, last_update, trade_id);
