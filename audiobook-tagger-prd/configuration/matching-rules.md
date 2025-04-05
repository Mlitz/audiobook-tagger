# Metadata Matching Rules

## 6.1 Metadata Matching Rules

The Audiobook Tagger provides extensive configuration options for metadata matching to accommodate different naming conventions, file organizations, and personal preferences.

### 6.1.1 Custom Matching Logic

#### Rule-Based Matching System

- **Configurable matching criteria**
  - Field-specific match requirements
  - Boolean logic for combining criteria
  - Custom matching expressions
  - Template-based pattern matching

- **Priority weighting for different fields**
  - Relative importance settings for title vs. author
  - Primary/secondary field designation
  - Required vs. optional field handling
  - Weighted scoring algorithm

- **Threshold settings for match confidence**
  - Minimum confidence level for automatic matching
  - Tiered thresholds for different actions
  - Confidence level override options
  - Manual review threshold configuration

#### Field-Specific Rules

- **Title matching precision settings**
  - Exact/prefix/contains matching options
  - Case sensitivity toggles
  - Punctuation normalization
  - Common word exclusion (a, the, etc.)

- **Author name handling**
  - Last name first vs. first name first
  - Comma/period handling in names
  - Initial expansion/compression
  - Name part reordering for matching

- **Series detection patterns**
  - Book number extraction
  - Series title identification
  - Volume/part label recognition
  - Series in parentheses handling

#### Match Scoring Configuration

- **Customizable scoring algorithm parameters**
  - Field weight adjustment
  - String similarity method selection
  - Partial match scoring
  - Bonus points for exact matches

- **Minimum threshold settings**
  - Auto-accept confidence threshold
  - Review required threshold
  - Rejection threshold
  - Multiple match handling threshold

- **Field importance weighting**
  - Primary identifier emphasis
  - Configurable field priorities
  - Context-specific weighting
  - Dynamic adjustment based on available data

### 6.1.2 Regex-Based Filename Parsing

#### Pattern Definition

- **Custom regex pattern creation interface**
  - Pattern builder with live preview
  - Pattern library management
  - Test functionality with current files
  - Error checking and validation

- **Named capture groups for field extraction**
  - Standard field group names
  - Optional group handling
  - Alternative pattern support
  - Default value specification

- **Pattern testing and validation tools**
  - Sample-based testing
  - Batch validation against library
  - Success rate reporting
  - Troubleshooting assistance

#### Common Patterns Library

- **Pre-defined patterns for popular naming conventions**
  - Standard patterns for common formats
  - Platform-specific conventions
  - Publisher-specific patterns
  - Community-contributed patterns

- **Community-contributed pattern repository**
  - Pattern sharing mechanism
  - Rating and usage statistics
  - Categorized pattern browsing
  - Update notification for improved patterns

- **Template-based pattern generation**
  - Guided pattern creation
  - Common component assembly
  - Context-specific suggestions
  - Progressive pattern refinement

#### Advanced Extraction

- **Multi-stage parsing workflows**
  - Sequential pattern application
  - Field extraction dependency chains
  - Intermediate result processing
  - Hierarchical pattern structures

- **Conditional pattern application**
  - Context-sensitive pattern selection
  - Rule-based pattern switching
  - Format detection driven matching
  - Content-based pattern adaptation

- **Fallback pattern sequences**
  - Ordered pattern attempts
  - Confidence threshold for fallback
  - Combined result assembly
  - Best-match selection logic

### 6.1.3 Pattern Management

#### Organization and Reuse

- **Categorization of patterns**
  - Purpose-based grouping
  - Source-specific patterns
  - Genre-specific conventions
  - Personal vs. shared patterns

- **Pattern inheritance and extension**
  - Base pattern definitions
  - Specialized pattern variants
  - Override mechanics for customization
  - Composition from pattern fragments

- **Import/export capabilities**
  - Pattern sharing format
  - Bulk import/export
  - Selective pattern transfer
  - Version compatibility handling

#### Pattern Testing and Refinement

- **Batch testing against file sets**
  - Success rate analysis
  - Failure case identification
  - Performance metrics
  - Comparison between pattern versions

- **Interactive refinement tools**
  - Visual pattern builder
  - Match highlighting in filenames
  - Immediate feedback on changes
  - Suggestion system for improvements

- **Pattern versioning**
  - Historical pattern preservation
  - Change tracking
  - A/B testing capability
  - Rollback options for regressions