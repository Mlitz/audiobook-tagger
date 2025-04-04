# Audiobook Tagger - Testing Guide

## Prerequisites

Before running tests, ensure you have:
- Node.js (version 16+ recommended)
- npm or Yarn installed
- Project dependencies installed (`npm install`)

## Running Tests

### Automated Tests

Run all tests using:
```bash
npm test
```

### Specific Filesystem Module Tests

To run only filesystem-related tests:
```bash
npm test test/unit/filesystem/
```

## Test Scenarios 

### FileSystemService Tests
- Audio format detection
- Directory scanning
- File information extraction
- Symlink handling
- Error scenario testing

### FileScanner Tests
- Mixed file type directory scanning
- Multi-file audiobook grouping
- Complex file naming pattern handling

### FileOrganizer Tests
- Metadata-based path generation
- Metadata scenario handling
- Path sanitization

## Manual Testing Steps

1. **Filesystem Scanning**
   - Open application
   - Browse and select audiobook directory
   - Verify:
     * Progress bar updates
     * Correct file detection
     * File list accuracy

2. **File Processing**
   - Scan directory
   - Click "Process Files"
   - Check:
     * Progress tracking
     * Status messages
     * Processing summary

3. **Metadata Search**
   - Use metadata search input
   - Search variations:
     * Full book titles
     * Partial titles
     * Author names
   - Validate:
     * Search progress
     * Result display
     * Error handling

## Test Data Setup

Create a test directory with:
- Single audiobook files
- Multi-file audiobook sets
- Various naming conventions
- Mixed file types

### Test Directory Example
```
test-audiobooks/
├── single-book.mp3
├── series-book1.mp3
├── series-book2.mp3
├── complex-book-part1.m4b
├── complex-book-part2.m4b
└── non-audio/
    ├── document.txt
    └── image.jpg
```

## Troubleshooting

### Common Issues
- Verify dependency installation
- Check console logs
- Confirm test directory permissions

### Logging
- Logs stored in `<user-data-directory>/logs/`
- Enable development mode for verbose logging

## Contributing Tests

1. Create test file in `test/unit/filesystem/`
2. Follow existing test structure
3. Add new scenarios
4. Validate with tests

## Performance Notes

- Large libraries may process slowly
- Monitor memory usage during scanning

## Issue Reporting

Include:
- Reproduction steps
- Log files
- System details:
  * OS
  * Node.js version
  * App version

## Development Best Practices

- Use mock data
- Implement robust error handling
- Address edge cases