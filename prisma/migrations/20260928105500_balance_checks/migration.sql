ALTER TABLE "User"
  ADD CONSTRAINT "User_cashBalance_nonnegative" CHECK ("cashBalance" >= 0),
  ADD CONSTRAINT "User_silverBalance_nonnegative" CHECK ("silverBalance" >= 0);

ALTER TABLE "Market"
  ADD CONSTRAINT "Market_silverInventory_nonnegative" CHECK ("silverInventory" >= 0);
