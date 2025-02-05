# Prismic Backup

A Node.js utility class for creating full backups of Prismic repositories including content, metadata, and media assets. Manages concurrent exports of documents, tags, custom types, shared slices, and assets with error logging. Automatically organizes outputs into structured directories and tracks failed asset downloads.

## How to Use

To run the backup process, follow the below steps:

1. Install dependencies with `npm install`
2. Fill in all properties of `config.js`
3. Run `node index.js` in terminal

The backup process creates the following directory structure:

```bash
repository-name/
├── repository.json       # Metadata such as refs, languages etc.
├── documents.json        # Complete list of documents
├── documents/            # Documents grouped by type
│   ├── page.json
│   ├── blog_post.json
│   └── ...
├── assets.json           # Complete media assets list
├── assets/               # Downloaded media files
│   ├── image1.jpg
│   ├── file1.pdf
│   └── ...
├── failed-assets.json    # Record of failed downloads (if any)
├── custom-types.json     # List of custom types
├── shared-slices.json    # List of shared slices
└── tags.txt              # List of all available tags (if any)
```

## Features

- Exports repository metadata such as refs, languages, releases etc.
- Exports all repository documents to a single JSON file
- Exports documents by their custom type to separate JSON files
- Exports the complete list of tags in a text file
- Exports a list of all media library assets to a JSON file
- Downloads all assets from media library with batch processing
- Logs any failed asset to a separate JSON file
- Exports all custom types and shared slices of the repository

## License

MIT License - see [LICENSE](./LICENSE) file for details.
