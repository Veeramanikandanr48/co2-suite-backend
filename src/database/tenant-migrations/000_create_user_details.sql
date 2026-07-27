-- Migration 000: Create Tenant user_details Table

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."user_details" (
  "id" SERIAL PRIMARY KEY,
  "userName" varchar(255),
  "email" varchar(255) UNIQUE,
  "password" varchar(255),
  "googleSubId" varchar(255),
  "isActive" boolean DEFAULT true,
  "isVerified" boolean DEFAULT false,
  "isTwoFactorAuthenticationEnabled" boolean DEFAULT false,
  "twoFactorAuthenticationSecret" varchar(255),
  "organizationId" varchar(255),
  "profileImageKey" varchar(255),
  "createdBy" integer,
  "updatedBy" integer,
  "deletedBy" integer,
  "createdOn" timestamp with time zone DEFAULT now(),
  "updatedOn" timestamp with time zone DEFAULT now(),
  "deletedOn" timestamp with time zone
);
