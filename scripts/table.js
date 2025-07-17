import { parquetRead } from 'https://cdn.jsdelivr.net/npm/hyparquet@1.17.1/+esm';

// Function to copy pub key to clipboard
function copyPubKey(pubKey, element) {
    navigator.clipboard.writeText(pubKey).then(() => {
        // Store original content
        const originalText = element.textContent;

        // Update to show success state
        element.textContent = 'Copied!';
        element.style.background = 'var(--primary)';
        element.style.color = 'white';

        // Revert back after 1.5 seconds
        setTimeout(() => {
            element.textContent = originalText;
            element.style.background = '';
            element.style.color = '';
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = pubKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show success state even with fallback
        element.textContent = 'Copied!';
        element.style.background = 'var(--primary)';
        element.style.color = 'white';
        
        setTimeout(() => {
            element.textContent = pubKey.substring(0, 8) + '...';
            element.style.background = '';
            element.style.color = '';
        }, 1500);
    });
}

window.copyPubKey = copyPubKey;

class DataTableManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        if (window.location.protocol === 'file:') {
            this.showError('Please use Live Server extension or local web server.');
            return;
        }
        
        this.initializeEventListeners();
        this.loadData();
    }
    initializeEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterData(e.target.value));
        }
        
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderTable();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderTable();
                }
            });
        }
    }
    
    async loadData() {
        try {
            const response = await fetch('data/node_rank.parquet');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            
            await parquetRead({
                file: arrayBuffer,
                onComplete: (result) => {
                    console.log('parquetRead result:', result);
                    console.log('Total rows:', result.length);
                    
                    // Manually define column names based on your Parquet schema
                    const columns = [
                        'Pleb_Rank',
                        'Betweenness_Rank', 
                        'Eigenvector_Rank',
                        'PageRank',
                        'Weighted_Degree_Rank',
                        'Channels_Rank',
                        'Capacity_Rank',
                        'alias',
                        'Node_Type',
                        'Total_Capacity',
                        'Num_Channels',
                        'Public_Key'
                    ];
                    
                    if (result.columns && result.data) {
                        // If result has columns and data properties (unlikely with hyparquet)
                        this.data = result.data.map(row =>
                            Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
                        );
                    } else if (Array.isArray(result) && result.length > 0) {
                        // Map each data row to an object using manual column names
                        this.data = result.map(row =>
                            Object.fromEntries(columns.map((col, i) => [col, row[i]]))
                        );
                    } else {
                        this.data = [];
                    }
                    
                    this.filteredData = [...this.data];
                    this.renderTable();
                    this.hideLoading();
                },
                onError: (error) => this.showError('Error parsing parquet file: ' + error.message)
            });
            
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                this.showError('Network Error: Please use Live Server extension.');
            } else if (error.message.includes('404')) {
                this.showError('File not found: Check if node_rank.parquet exists in data/ folder.');
            } else {
                this.showError('Error: ' + error.message);
            }
        }
    }
    
    filterData(searchTerm) {
        if (!searchTerm) {
            this.filteredData = [...this.data];
        } else {
            const searchLower = searchTerm.toLowerCase();
            this.filteredData = this.data.filter(row => 
                Object.values(row).some(value => {
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(searchLower);
                })
            );
        }
        this.currentPage = 1;
        this.renderTable();
    }
    
    sortData(column) {
        // Skip sorting for non-sortable columns
        const nonSortableColumns = ['alias', 'Public_Key'];
        if (nonSortableColumns.includes(column)) return;

        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        const multiplier = this.sortDirection === 'asc' ? 1 : -1;

        // Define numeric columns
        const numericColumns = [
            'Pleb_Rank',
            'Betweenness_Rank',
            'Eigenvector_Rank',
            'PageRank',
            'Weighted_Degree_Rank',
            'Channels_Rank',
            'Capacity_Rank',
            'Num_Channels'
        ];

        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            // Handle null/undefined values
            if (aVal === null || aVal === undefined) return 1 * multiplier;
            if (bVal === null || bVal === undefined) return -1 * multiplier;

            // Use Capacity_Rank for Total_Capacity sorting
            if (column === 'Total_Capacity') {
                return (Number(a['Capacity_Rank']) - Number(b['Capacity_Rank'])) * multiplier;
            }

            // Handle numeric columns
            if (numericColumns.includes(column)) {
                return (Number(aVal) - Number(bVal)) * multiplier;
            }

            // Handle Node_Type (string comparison)
            if (column === 'Node_Type') {
                return String(aVal).localeCompare(String(bVal)) * multiplier;
            }

            return 0;
        });

        this.currentPage = 1;
        this.renderTable();
        this.updateSortIndicators(column);
    }
    
    updateSortIndicators(column) {
        document.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        const th = document.querySelector(`th[data-column="${column}"]`);
        if (th) {
            th.classList.add(`sort-${this.sortDirection}`);
        }
    }
    renderTable() {
        if (this.data.length === 0) return;
        
        const table = document.getElementById('dataTable');
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');
        
        if (!table || !thead || !tbody) return;
        
        if (thead.children.length === 0) {
            const headerRow = document.createElement('tr');
            const columns = Object.keys(this.data[0]);
            
            columns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = this.formatColumnName(column);
                th.dataset.column = column;
                
                // Only add sorting for sortable columns
                const nonSortableColumns = ['alias', 'Public_Key'];
                if (!nonSortableColumns.includes(column)) {
                    th.classList.add('sortable');
                    th.addEventListener('click', () => this.sortData(column));
                }
                
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
        }
        
        tbody.innerHTML = '';
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Fixed: Use Object.entries to get both key and value
            Object.entries(row).forEach(([key, value]) => {
                const td = document.createElement('td');

                // Special handling for pubkey column
                if (key === 'Public_Key' || key.toLowerCase().includes('pubkey') || key.toLowerCase().includes('public_key')) {
                    td.classList.add('pubkey-cell');
                    td.innerHTML = `
                        <span class="pubkey-truncated" onclick="copyPubKey('${value}', this)" title="Click to copy: ${value}">
                            ${value.substring(0, 8)}...
                        </span>
                    `;
                } else {
                    td.textContent = this.formatCellValue(value);
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        table.style.display = 'table';
        this.updatePaginationControls();
    }
    
    formatColumnName(column) {
        return column
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ')
            .trim();
    }
    
    formatCellValue(value) {
        if (value === null || value === undefined) return '-';
        
        if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                return value.toLocaleString();
            } else {
                return value.toLocaleString(undefined, { 
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 6 
                });
            }
        }
        
        return String(value);
    }
    
    updatePaginationControls() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumbers = document.getElementById('pageNumbers');
        const paginationInfo = document.getElementById('paginationInfo');
        
        if (!prevBtn || !nextBtn || !pageNumbers || !paginationInfo) return;
        
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
        
        const startItem = this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${this.filteredData.length} entries`;
        
        pageNumbers.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.classList.add('page-number');
            if (i === this.currentPage) {
                pageLink.classList.add('active');
            }
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = i;
                this.renderTable();
            });
            pageNumbers.appendChild(pageLink);
        }
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }
    
    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
            loading.style.color = '#dc3545';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dataTable')) {
        new DataTableManager();
    }
});