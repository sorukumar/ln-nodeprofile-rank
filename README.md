# LN Node Profile Rank

A comprehensive Lightning Network node analysis platform that provides rankings and detailed profiles of Lightning Network nodes, built as part of the Bitcoin Data Labs ecosystem.

## Features

- **Node Rankings**: Interactive data table with sorting, filtering, and pagination
- **Node Profiles**: Detailed analysis of individual nodes (coming soon)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fast Data Loading**: Efficient parquet file parsing using hyparquet
- **Bitcoin Data Labs Integration**: Consistent header/footer across the ecosystem

## Project Structure

```
ln-nodeprofile-rank/
├── index.html              # Landing page with navigation cards
├── prank.html              # Node rankings page with data table
├── styles/
│   ├── main.css            # Main styling and layout
│   └── table.css           # Data table specific styles
├── scripts/
│   └── table.js            # Data table functionality
├── data/
│   └── node_rank.parquet   # Node ranking data
└── README.md
```

## Setup

1. Clone the repository
2. Place your parquet data file in the `data/` folder as `node_rank.parquet`
3. Serve the files using a local web server or VS Code extension

### Local Development

Use any of these methods to serve the files locally:

**VS Code Extensions (Recommended):**
- Install "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

**Alternative methods:**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## Data Format

The application expects a parquet file named `node_rank.parquet` in the `data/` folder. The table will automatically display all columns present in the parquet file with the following features:

- **Automatic column detection**: Displays all columns from the parquet file
- **Smart formatting**: Numbers are formatted with locale-specific separators
- **Sorting**: Click any column header to sort (ascending/descending)
- **Search**: Real-time filtering across all columns
- **Pagination**: Navigate through large datasets efficiently

## Dependencies

- **Bitcoin Data Labs Components**: For consistent header/footer across Bitcoin Data Labs applications
- **Hyparquet**: Efficient client-side parquet file parsing
- **Font Awesome**: Icons for UI elements
- Modern browser with ES6+ support

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Contributing

Please follow the existing code style and patterns established in the ln-graph-viz project for consistency across Bitcoin Data Labs applications.

## License

This project follows the same license as other Bitcoin Data Labs projects.