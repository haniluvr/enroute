SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_user_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    nickname,
    phone,
    persona,
    career_interest,
    current_level,
    avatar_url
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'persona',
    new.raw_user_meta_data->>'career_interest',
    new.raw_user_meta_data->>'current_level',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    nickname = EXCLUDED.nickname,
    phone = EXCLUDED.phone,
    persona = EXCLUDED.persona,
    career_interest = EXCLUDED.career_interest,
    current_level = EXCLUDED.current_level,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_user_sync"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."application" (
    "id" integer NOT NULL,
    "student_id" integer NOT NULL,
    "job_id" integer NOT NULL,
    "date_applied" "date" DEFAULT CURRENT_DATE,
    "status" character varying(50)
);


ALTER TABLE "public"."application" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."application_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."application_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."application_id_seq" OWNED BY "public"."application"."id";



CREATE TABLE IF NOT EXISTS "public"."counselor" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL
);


ALTER TABLE "public"."counselor" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."counselor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."counselor_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."counselor_id_seq" OWNED BY "public"."counselor"."id";



CREATE TABLE IF NOT EXISTS "public"."employer" (
    "id" integer NOT NULL,
    "company_name" character varying(255) NOT NULL,
    "industry" character varying(255),
    "company_email" character varying(255) NOT NULL,
    "status" character varying(50),
    "counselor_id" integer
);


ALTER TABLE "public"."employer" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."employer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."employer_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."employer_id_seq" OWNED BY "public"."employer"."id";



CREATE TABLE IF NOT EXISTS "public"."job" (
    "id" integer NOT NULL,
    "employer_id" integer NOT NULL,
    "title" character varying(255) NOT NULL,
    "salary_min" numeric,
    "salary_max" numeric,
    "location" character varying(255),
    "description" "text",
    "requirements" "text"
);


ALTER TABLE "public"."job" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."job_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."job_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."job_id_seq" OWNED BY "public"."job"."id";



CREATE TABLE IF NOT EXISTS "public"."profile" (
    "id" integer NOT NULL,
    "student_id" integer NOT NULL,
    "education" "text",
    "skills" "text",
    "experience" "text",
    "preferred_salary" numeric
);


ALTER TABLE "public"."profile" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."profile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."profile_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."profile_id_seq" OWNED BY "public"."profile"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "nickname" "text",
    "phone" "text",
    "persona" "text",
    "career_interest" "text",
    "current_level" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_job" (
    "id" integer NOT NULL,
    "student_id" integer NOT NULL,
    "job_id" integer NOT NULL,
    "date_saved" "date" DEFAULT CURRENT_DATE
);


ALTER TABLE "public"."saved_job" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."saved_job_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."saved_job_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."saved_job_id_seq" OWNED BY "public"."saved_job"."id";



CREATE TABLE IF NOT EXISTS "public"."student" (
    "id" integer NOT NULL,
    "first_name" character varying(255) NOT NULL,
    "last_name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "password" "text" NOT NULL,
    "contact_no" character varying(50),
    "location" character varying(255)
);


ALTER TABLE "public"."student" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."student_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."student_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."student_id_seq" OWNED BY "public"."student"."id";



CREATE TABLE IF NOT EXISTS "public"."swipe" (
    "id" integer NOT NULL,
    "student_id" integer NOT NULL,
    "job_id" integer NOT NULL,
    "swipe_type" character varying(50),
    "swipe_date" "date" DEFAULT CURRENT_DATE
);


ALTER TABLE "public"."swipe" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."swipe_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."swipe_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."swipe_id_seq" OWNED BY "public"."swipe"."id";



ALTER TABLE ONLY "public"."application" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."application_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."counselor" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."counselor_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."employer" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."employer_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."job" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."job_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."profile" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."profile_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."saved_job" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."saved_job_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."student" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."student_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."swipe" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."swipe_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counselor"
    ADD CONSTRAINT "counselor_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."counselor"
    ADD CONSTRAINT "counselor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employer"
    ADD CONSTRAINT "employer_company_email_key" UNIQUE ("company_email");



ALTER TABLE ONLY "public"."employer"
    ADD CONSTRAINT "employer_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job"
    ADD CONSTRAINT "job_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_student_id_key" UNIQUE ("student_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_job"
    ADD CONSTRAINT "saved_job_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student"
    ADD CONSTRAINT "student_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."student"
    ADD CONSTRAINT "student_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."swipe"
    ADD CONSTRAINT "swipe_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employer"
    ADD CONSTRAINT "employer_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "public"."counselor"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job"
    ADD CONSTRAINT "job_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."employer"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_job"
    ADD CONSTRAINT "saved_job_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_job"
    ADD CONSTRAINT "saved_job_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."swipe"
    ADD CONSTRAINT "swipe_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."swipe"
    ADD CONSTRAINT "swipe_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE CASCADE;



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_user_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_sync"() TO "service_role";


















GRANT ALL ON TABLE "public"."application" TO "anon";
GRANT ALL ON TABLE "public"."application" TO "authenticated";
GRANT ALL ON TABLE "public"."application" TO "service_role";



GRANT ALL ON SEQUENCE "public"."application_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."application_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."application_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."counselor" TO "anon";
GRANT ALL ON TABLE "public"."counselor" TO "authenticated";
GRANT ALL ON TABLE "public"."counselor" TO "service_role";



GRANT ALL ON SEQUENCE "public"."counselor_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."counselor_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."counselor_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."employer" TO "anon";
GRANT ALL ON TABLE "public"."employer" TO "authenticated";
GRANT ALL ON TABLE "public"."employer" TO "service_role";



GRANT ALL ON SEQUENCE "public"."employer_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."employer_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."employer_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."job" TO "anon";
GRANT ALL ON TABLE "public"."job" TO "authenticated";
GRANT ALL ON TABLE "public"."job" TO "service_role";



GRANT ALL ON SEQUENCE "public"."job_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."job_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."job_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."saved_job" TO "anon";
GRANT ALL ON TABLE "public"."saved_job" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_job" TO "service_role";



GRANT ALL ON SEQUENCE "public"."saved_job_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."saved_job_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."saved_job_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."student" TO "anon";
GRANT ALL ON TABLE "public"."student" TO "authenticated";
GRANT ALL ON TABLE "public"."student" TO "service_role";



GRANT ALL ON SEQUENCE "public"."student_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."student_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."student_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."swipe" TO "anon";
GRANT ALL ON TABLE "public"."swipe" TO "authenticated";
GRANT ALL ON TABLE "public"."swipe" TO "service_role";



GRANT ALL ON SEQUENCE "public"."swipe_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."swipe_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."swipe_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";