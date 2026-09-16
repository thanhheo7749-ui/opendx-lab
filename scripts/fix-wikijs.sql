UPDATE pages SET "publishStartDate" = '', "publishEndDate" = '', toc = '[]' WHERE id > 1;
UPDATE pages SET "publishStartDate" = '', "publishEndDate" = '' WHERE id = 1 AND ("publishStartDate" IS NULL OR "publishEndDate" IS NULL);
