# Metadata Matching and Retrieval Workflow

## 2.2 Metadata Matching and Retrieval Workflow

The Audiobook Tagger implements a structured workflow for matching, retrieving, and applying metadata to audiobook files.

### Matching Process

#### Automatic Processing Flow

1. **Check for ASIN**
   - Examine file metadata for existing ASIN tag
   - Scan filename for ASIN pattern (B0XXXXXXXX format)
   - If found: Automatically apply metadata without user intervention

2. **Attempt metadata retrieval using existing file information**
   - Extract and analyze existing metadata tags
   - Use title + author combination for API search
   - Apply confidence scoring to potential matches

3. **If automatic matching fails:**
   - Trigger manual review mode
   - Present matching candidates in descending order of confidence
   - Require user approval before metadata application

### Manual Intervention Features

#### Comprehensive Metadata Preview

- **Full proposed metadata display**
  - Complete view of all metadata fields to be applied
  - Visual indication of fields that will change
  - Highlighting of missing or potentially incorrect data

- **Editable fields for each metadata element**
  - Inline editing capabilities for all metadata fields
  - Auto-completion suggestions for common values
  - Field validation with immediate feedback

- **Side-by-side comparison of original and proposed metadata**
  - Clear visual differentiation between current and new data
  - Color-coded change highlighting
  - Option to selectively apply changes per field

- **Per-file confirmation process**
  - **Confirm all changes**: Apply all proposed metadata
  - **Reject and skip**: Maintain current metadata and move to next file
  - **Partially edit metadata**: Apply only selected field changes
  - **Apply to single or multiple files**: Batch application option for common changes

### Search Term Preparation

#### Preprocessing Steps

1. **Remove file extensions**
   - Strip .mp3, .m4b, .aac, and other audio file extensions
   - Handle multiple extensions (e.g., .part1.mp3)

2. **Strip unnecessary symbols**
   - Remove brackets, parentheses, and special characters
   - Preserve meaningful punctuation in titles

3. **Remove extraneous numbers**
   - Filter out track numbers and sequence identifiers
   - Preserve numbers that are part of the title

4. **Normalize whitespace**
   - Standardize spacing between words
   - Remove leading/trailing whitespace
   - Convert alternative whitespace characters

5. **Handle series identifiers**
   - Identify and extract series information
   - Parse book numbers and sequence indicators
   - Format series data for optimal searching

### Matching Algorithm

#### Default: Basic String Matching

- **Direct substring matching**
  - Exact substring identification
  - Word-by-word matching
  - Leading substring prioritization

- **Case-insensitive comparisons**
  - Standardize case for matching
  - Preserve case in results
  - Handle ALL CAPS and camelCase variations

- **Whitespace normalization**
  - Treat multiple spaces as single space
  - Handle hyphenation and word breaks
  - Ignore whitespace in scoring

- **Symbol and number handling**
  - Compare with and without symbols
  - Preserve meaningful numbers
  - Handle numeric vs. written number variations (e.g., "5" vs. "five")

### Future Matching Improvements

#### Potential Advanced Features

1. **Fuzzy matching option**
   - Levenshtein distance calculations
   - Phonetic matching (Soundex, Metaphone)
   - N-gram similarity scoring

2. **Machine learning-based matching**
   - Training from user corrections
   - Pattern recognition from successful matches
   - Confidence scoring refinement

3. **User-configurable matching parameters**
   - Confidence threshold adjustments
   - Field weighting customization
   - Match scoring algorithm selection

4. **Community-contributed matching improvements**
   - Shared regex patterns
   - Common title format variations
   - Publisher-specific naming conventions