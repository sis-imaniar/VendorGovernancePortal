# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **always running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Key Files

- `src/App.tsx` - Main application component
- `src/main.tsx` - React entry point
- `src/index.css` - Global styles and Tailwind CSS import
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `.mise.toml` - Toolchain versions (Node.js, pnpm)

## Styling

This project uses **Tailwind CSS v4** for styling. Use Tailwind utility classes directly in JSX. Tailwind is loaded via the Vite plugin — no PostCSS config needed.


# 🚨 ATURAN UTAMA DATABASE (MCP):
1. **Dilarang Keras Membuat Script Query Kustom:**
   JANGAN PERNAH membuat, menulis, atau menjalankan script NodeJS, Python, PHP, atau file kustom lainnya untuk mengakses/mengquery database.
   
2. **Gunakan MCP Tools:**
   Gunakan SELALU tools yang disediakan oleh `internal-db-mcp` (`query_data`, `list_tables`, `describe_table`, `get_schema`, `search_data`, `get_sample_data`, `get_table_stats`) untuk mengambil informasi dari database.

3. **Membaca Database Lain (Multitenant/Multi-schema):**
   Meskipun file `.env` menuliskan default database tertentu, server database ini dapat mengakses database/schema lain di instance yang sama.
   * Untuk melihat tabel di database lain, gunakan tool `list_tables` atau `get_schema` dengan mengisi parameter `schema` dengan nama database tersebut.
   * Untuk mengquery data dari database lain, gunakan query SELECT dengan format nama database lengkap (contoh: `SELECT * FROM nama_database_lain.nama_tabel`).
   * Jangan berasumsi bahwa MCP hanya bisa membaca database default di `.env`.

4. **Kepatuhan Read-Only:**
   Semua query harus berupa SELECT. Jangan mencoba mengupdate, insert, atau mengubah skema.
