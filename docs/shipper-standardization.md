# Shipper and Buyer Name Standardization

This document explains the standardization process for shipper and buyer names in the system.

## Problem

The shipper and buyer tables contained duplicate entries with slight variations in names, such as:
- "ANAIS S.A.S" vs "ANAIS S.A.S." (with/without period)
- "ANAIS S.A.S (FRANCE)" (with country in parentheses)
- "DONG LUC JSC" appearing multiple times with different IDs

This caused confusion and made it difficult to maintain data integrity.

## Solution

We implemented a two-part solution:

1. **Database Migration**: A SQL migration script that standardizes existing data
2. **Frontend Validation**: Utility functions to standardize new entries

### Database Migration

The migration script (`supabase/migrations/20240801000001_standardize_shipper_names.sql`) performs the following steps:

1. Creates a temporary table with normalized shipper names
2. Identifies duplicates based on normalized names
3. Updates orders to point to the primary shipper record
4. Removes duplicate shipper records
5. Updates remaining shipper names to use standardized format

### Frontend Validation

We added a utility function (`frontend/src/utils/formatters/companyNameFormatter.ts`) that:

1. Standardizes company names when creating or updating shippers/buyers
2. Shows a preview of the standardized name in the UI
3. Provides functions to check if two company names are likely the same entity

## Running the Migration

To apply the standardization to your database:

```bash
# Run the migration
supabase db reset
# Or if you want to run just this migration
supabase db diff -f standardize_shipper_names
```

## Standardization Rules

The standardization process follows these rules:

1. **Consistent Spacing**: Remove extra spaces and normalize to single spaces
2. **Company Suffix Standardization**:
   - S.A.S → S.A.S (consistent periods)
   - S.A → S.A (consistent periods)
   - JSC → JSC (no periods)
   - LTD → LTD (no periods)
   - LLC → LLC (no periods)
   - CORP → CORP (no periods)
   - INC → INC (no periods)
   - PTE.LTD → PTE.LTD (consistent format)
   - GMBH → GMBH (no periods)
3. **Remove Trailing Periods**: "COMPANY NAME." → "COMPANY NAME"
4. **Preserve Country Information**: "COMPANY NAME (COUNTRY)" format is preserved

## Future Considerations

For future improvements, consider:

1. Adding a separate `country` field to the shipper and buyer tables
2. Implementing more sophisticated duplicate detection using fuzzy matching
3. Adding validation rules for address formatting
4. Creating a data cleanup tool in the admin interface
