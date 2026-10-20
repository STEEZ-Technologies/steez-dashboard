-- Per-workspace recipients for new-enquiry emails. Additive, nullable.
ALTER TABLE "Tenant" ADD COLUMN "leadAlertEmails" TEXT;
