# Metadata Tagging

## 2.1 Metadata Retrieval Strategy

The Audiobook Tagger will implement a comprehensive strategy for retrieving and applying accurate metadata to audiobook files.

### Primary Source

- **Audnexus API**
  - Core metadata source providing standardized, high-quality information
  - Utilizes aggregated data from multiple underlying sources
  - Provides consistent formatting and field structure

### Metadata Source Flexibility

The system is designed to support audiobooks from multiple sources:

- **Independent publishers**
  - Small press audiobooks often lacking comprehensive metadata
  - Self-published content with varying metadata quality

- **Direct purchases**
  - DRM-free downloads from various platforms
  - Directly purchased content from author websites

- **Various online platforms**
  - Content from specialized audiobook retailers
  - Non-Audible subscription service downloads

- **Personal collections**
  - Personally narrated or created content
  - Legacy audiobook formats converted from physical media

## Metadata Matching Priority Hierarchy

The system will follow a strict hierarchy when attempting to match and apply metadata:

### 1. ASIN (Highest Priority)
- **Direct, exact match**
  - Uses Audible Standard Identification Number when available
  - Guarantees exact match with authoritative source
- **Automatic metadata application**
  - No user confirmation required for complete ASIN matches
  - All available fields updated automatically
- **No manual intervention required**
  - Process runs in background without user input
  - Batch processing enabled for ASIN-identified content

### 2. Existing Metadata
- **Scan existing file metadata**
  - Extract ID3 tags, Vorbis comments, or other embedded metadata
  - Identify partial identifiers that may aid in matching
- **Extract available information**
  - Use existing title, author, narrator information when present
  - Leverage publisher info and copyright data if available

### 3. Title and Author Matching
- **Intelligent search using combined metadata**
  - Combines available fields for more accurate search
  - Weighted matching algorithms for partial information
- **Clean and prepare search terms**
  - Remove file extensions (.mp3, .m4b, etc.)
  - Strip unnecessary numbers or symbols
  - Normalize search strings (case, spacing, punctuation)

### 4. Filename-Based Matching
- **Use filename as fallback search method**
  - Attempt to parse structured information from filename
  - Apply pattern matching to extract title/author
- **User-configurable search term extraction**
  - Custom regex patterns for filename parsing
  - Templates for common naming conventions
- **Manual refinement option**
  - User interface for correcting extracted search terms
  - Search term suggestions based on partial matches

## Prioritized Metadata Fields

The system will prioritize the following metadata fields (in order of importance):

1. **Title**
   - Primary book title
   - Consistent formatting and capitalization

2. **Author**
   - Author name(s) with proper formatting
   - Multiple author support with role distinction

3. **Narrator**
   - Narrator name(s) with proper formatting
   - Multiple narrator support

4. **Series Information**
   - Series name
   - Book position in series
   - Total books in series (when available)

5. **Publication Year**
   - Original publication date
   - Audio publication date when different

6. **Description**
   - Full book description/summary
   - Content warnings and annotations

7. **Cover Art**
   - High-resolution cover images
   - Consistent aspect ratio and formatting

8. **Runtime Length**
   - Total duration
   - Chapter information when available

9. **Publisher**
   - Publisher name
   - Imprint information when applicable

10. **Genres**
    - Primary and secondary genres
    - Subgenre classifications