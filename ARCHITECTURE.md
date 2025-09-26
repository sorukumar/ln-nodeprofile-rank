# Lightning Network Node Analytics – Architecture Overview

## Directory & File Structure

```
ln-nodeprofile-rank/
│
├── index.html
├── prank.html
├── profile.html
├── trending.html
├── README.md
│
├── data/
│   ├── node_feature.parquet
│   ├── node_profile.parquet
│   ├── node_rank.parquet
│   └── featured_node.json
│
├── scripts/
│   ├── homepage.js
│   ├── profile.js
│   ├── profile-channels.js
│   ├── profile-channels-table.js
│   ├── table.js
│   └── trending.js
│
└── styles/
    ├── main.css
    ├── profile.css
    ├── table.css
    └── trending.css
```

---

## Directory & File Purposes

### Root HTML Files

- **index.html**  
  Homepage: search bar (alias/pubkey), trending nodes, navigation cards (Rankings, Graph Viz, Explorer), featured nodes (from JSON), all dynamic via homepage.js.
- **prank.html**  
  Rankings table: search, sort, filter, paginate. Table updates live. All logic in table.js.
- **profile.html**  
  Node profile: stats, rankings, metrics, tabs (Overview, Rankings, Channels, Channel Details), copy pubkey, all dynamic. Uses profile.js, profile-channels.js, profile-channels-table.js.
- **trending.html**  
  Node Explorer: advanced search, filter, sort, grid/list view, pagination. All logic in trending.js.
- **README.md**  
  Project setup, usage, docs.

---

### data/

- **node_feature.parquet**  
  Parquet file containing node features.  
  _Columns (typical):_  
  - pub_key, alias, node_type, total_capacity, num_channels, last_seen, ... (plus various feature columns)

- **node_profile.parquet**  
  Parquet file with detailed node profiles.  
  _Columns:_  
  - pub_key, alias, node_type, total_capacity, num_channels, last_seen, pleb_rank, capacity_rank, channels_rank, weighted_degree_rank, betweenness_rank, eigenvector_rank, pagerank

- **node_rank.parquet**  
  Parquet file with node rankings and summary stats.  
  _Columns:_  
  - pleb_rank, channels_rank, capacity_rank, weighted_degree_rank, betweenness_rank, eigenvector_rank, pagerank, alias, node_type, total_capacity, num_channels, last_seen, pub_key

- **featured_node.json**  
  JSON file containing featured node(s) for homepage highlights or special display.

---

### scripts/

- **homepage.js**  
  Homepage: load node/featured data, build search index, search/suggestions, trending/featured nodes, nav to profile.
- **profile.js**  
  Profile: get pubkey from URL, load node data, fill tabs, handle tab switch, copy pubkey, error states, coordinate channel data.
- **profile-channels.js**  
  Load/process channel data for node, prep for tabs/visuals.
- **profile-channels-table.js**  
  Render channel table: sort, filter, paginate, format (fees, HTLC, status), table events.
- **table.js**  
  Rankings table: load data, render, sort, filter, paginate, search, loading/error UI.
- **trending.js**  
  Node Explorer: load/filter/sort nodes, advanced filters, search, grid/list, pagination, render node cards, all UI events.

---

### styles/

- **main.css**  
  General styles for homepage and shared components.

- **profile.css**  
  Styles for the node profile page.

- **table.css**  
  Styles for the rankings table.

- **trending.css**  
  Styles for the trending nodes page.

components.css → Reusable UI components
main.css → Homepage & hero styles
table.css → Data table styles
profile.css → Profile page styles
trending.css → Node explorer styles
---

## Program Call Graph

- **index.html**  
  → `homepage.js`  
    - Loads node data  
    - Handles search, trending, navigation

- **profile.html**  
  → `profile.js`  
    - Loads node profile  
    - Handles tab navigation, copy, error states

- **prank.html**  
  → `table.js`  
    - Loads and displays node rankings table

- **trending.html**  
  → `trending.js`  
    - Loads trending nodes  
    - Handles filtering, sorting, pagination

---

## Data File Columns

- **node_feature.parquet**  
  - pub_key, alias, node_type, total_capacity, num_channels, last_seen, ... (plus feature columns)

- **node_profile.parquet**  
  - pub_key, alias, node_type, total_capacity, num_channels, last_seen, pleb_rank, capacity_rank, channels_rank, weighted_degree_rank, betweenness_rank, eigenvector_rank, pagerank

- **node_rank.parquet**  
  - pleb_rank, channels_rank, capacity_rank, weighted_degree_rank, betweenness_rank, eigenvector_rank, pagerank, alias, node_type, total_capacity, num_channels, last_seen, pub_key

---

## Architecture Flow Diagram (Textual)

```
[User] 
  ↓
[index.html] --(search, trending)--> [homepage.js] --(fetch)--> [node_rank.parquet]
  ↓
[profile.html?node=...] --(profile view)--> [profile.js] --(fetch)--> [node_profile.parquet] (fallback: node_rank.parquet)
  ↓
[prank.html] --(table view)--> [table.js] --(fetch)--> [node_rank.parquet]
  ↓
[trending.html] --(trending view)--> [trending.js] --(fetch)--> [node_rank.parquet]
```

- All JS files fetch data from the `/data/` directory.
- Data is parsed and rendered into the DOM.
- Navigation between pages is via links or search.

---

## Summary

- **HTML files**: Entry points for each major UI section.
- **JS files**: Handle data loading, UI logic, and DOM updates for their respective pages.
- **Data files**: Parquet files with node features, profiles, and rankings.
- **CSS files**: Page-specific and shared styles.
- **Flow**: User interacts with HTML → JS loads data → UI updates → navigation as needed.

---

# Data Dictionary

## node_rank.parquet

| Column Name                   | Data Type | Description                                                        |
|------------------------------|-----------|--------------------------------------------------------------------|
| pleb_rank                    | int32     | Composite rank for node (lower is better)                          |
| total_channels_rank           | int32     | Rank of node by total channels (lower is better)                   |
| total_capacity_rank           | int32     | Rank of node by total capacity (lower is better)                   |
| capacity_weighted_degree_rank | int32     | Rank by capacity-weighted degree (lower is better)                 |
| betweenness_centrality_rank   | int32     | Rank by betweenness centrality (lower is better)                   |
| eigenvector_centrality_rank   | int32     | Rank by eigenvector centrality (lower is better)                   |
| custom_pagerank_rank          | int32     | Rank by custom PageRank (lower is better)                          |
| alias                        | object    | Node alias (display name)                                          |
| node_type                    | object    | Node type (e.g., routing, merchant, etc.)                          |
| total_capacity               | object    | Total channel capacity (satoshis, as string or int)                |
| total_channels               | int64     | Total number of channels                                           |
| last_seen                    | object    | Last seen date/time (string or timestamp)                          |
| pub_key                      | object    | Node public key (unique identifier)                                |
| alias/pubkey                 | object    | Alias or pubkey (for search/fallback)                              |

---

## prank.parquet


| Column Name           | Data Type | Description                                 |
|----------------------|-----------|---------------------------------------------|
| pleb_rank            | int32     | Composite rank for node (lower is better)   |
| total_channels_rank  | int32     | Rank by total channels                      |
| total_capacity_rank  | int32     | Rank by total capacity                      |
| alias/pubkey         | object    | Alias or pubkey (for search/fallback)       |

---

## node_profile.parquet

| Column Name                      | Data Type | Description                                      |
|----------------------------------|-----------|--------------------------------------------------|
| pub_key                         | object    | Node public key (unique identifier)              |
| alias                           | object    | Node alias (display name)                        |
| address_1                       | object    | Node address (part 1)                            |
| address_2                       | object    | Node address (part 2)                            |
| last_seen                       | object    | Last seen date (YYYY-MM or string)               |
| source                          | uint64    | Data source identifier                           |
| update_dt                       | object    | Last update datetime (string)                    |
| snapshot_date                   | object    | Date of data snapshot                            |
| first_seen_week                 | object    | First seen week (string)                         |
| closed_channels_count           | int64     | Number of closed channels                        |
| node_type                       | object    | Node type (e.g., routing, merchant, etc.)        |
| birth_tx                        | object    | Birth tx (first time node was seen)                   |
| birth_chan                      | object    | Chan id of node's birth (txid)                      |
| birth_tx_active                 | object    | Birthtx (1sttime node was seen-active chnl)          |
| birth_chan_active               | object    | Channel ID of node's active birth                |
| total_channels                  | int64     | Total number of channels                         |
| channel_segment                 | object    | Channel segment (categorical bin)                |
| category_counts                 | object    | Category counts (JSON or stringified dict)       |
| total_capacity                  | int64     | Total channel capacity (satoshis)                |
| node_cap_tier                   | object    | Node capacity tier (categorical bin)             |
| capacity_segment                | object    | Capacity segment (categorical bin)               |
| avg_chnl_size                   | float64   | Average channel size (satoshis)                  |
| med_chnl_size                   | float64   | Median channel size (satoshis)                   |
| mode_chnl_size                  | int64     | Mode channel size (satoshis)                     |
| min_chnl_size                   | float64   | Minimum channel size (satoshis)                  |
| max_chnl_size                   | float64   | Maximum channel size (satoshis)                  |
| betweenness_centrality_rank     | int32     | Rank by betweenness centrality                   |
| eigenvector_centrality_rank     | int32     | Rank by eigenvector centrality                   |
| custom_pagerank_rank            | int32     | Rank by custom PageRank                          |
| capacity_weighted_degree_rank   | int32     | Rank by capacity-weighted degree                 |
| total_channels_rank             | int32     | Rank by total channels                           |
| total_capacity_rank             | int32     | Rank by total capacity                           |
| pleb_rank                       | int32     | Composite rank for node                          |
| ftotal_capacity                 | object    | Formatted total capacity (e.g., '90m sats')      |
| avg_base_fee                    | float64   | Average base fee (msat)                          |
| med_base_fee                    | float64   | Median base fee (msat)                           |
| max_base_fee                    | float64   | Maximum base fee (msat)                          |
| min_base_fee                    | float64   | Minimum base fee (msat)                          |
| avg_fee_rate                    | float64   | Average fee rate (ppm)                           |
| med_fee_rate                    | float64   | Median fee rate (ppm)                            |
| max_fee_rate                    | float64   | Maximum fee rate (ppm)                           |
| min_fee_rate                    | float64   | Minimum fee rate (ppm)                           |

---

## node_feature.parquet

- **Total rows:** 12,135

| Column Name    | Data Type | Description                                      |
|---------------|-----------|--------------------------------------------------|
| pub_key       | object    | Node public key (unique identifier)              |
| alias         | object    | Node alias (display name)                        |
| source        | uint64    | Data source identifier                           |
| features_dict | object    | Dictionary of node features (JSON or stringified) |
