# Supabase setup

This directory belongs to the generic billing template. Use a fresh Supabase project for each business.

Apply `migrations/0001_initial_schema.sql` once to a new project. It includes the normalized billing schema, invoice-number allocation, order and advance-order RPCs, invoice storage setup, indexes, and RLS policies.

Create the first user in Supabase Authentication, then set the matching `profiles.role` to `admin`. Staff users should use `staff`; normal customer accounts use `customer`.

The browser must receive only the project URL and publishable/anonymous key. Keep service-role keys and administrative credentials outside the repository.
