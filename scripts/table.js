class DataTableManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        this.initializeEventListeners();
        this.loadData();
    }
    
    initializeEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterData(e.target.value);
            });
        }
        
        // Pagination buttons
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // Parse parquet file using hyparquet
            const { parquetRead } = hyparquet;
            
            await parquetRead({
                file: arrayBuffer,
                onComplete: (data) => {
                    this.data = data;
                    this.filteredData = [...this.data];
                    this.renderTable();
                    this.hideLoading();
                },
                onError: (error) => {
                    console.error('Parquet parsing error:', error);
                    this.showError('Error parsing parquet file: ' + error.message);
                }
            });
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please make sure the parquet file exists in the data folder.');
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
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            // Handle null/undefined values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Handle numeric values
            if (!isNaN(aVal) && !isNaN(bVal) && aVal !== '' && bVal !== '') {
                aVal = Number(aVal);
                bVal = Number(bVal);
            } else {
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
            }
            
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.currentPage = 1;
        this.renderTable();
        this.updateSortIndicators(column);
    }
    
    updateSortIndicators(column) {
        // Remove existing sort classes
        document.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add sort class to current column
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
        
        // Render header (only once)
        if (thead.children.length === 0) {
            const headerRow = document.createElement('tr');
            const columns = Object.keys(this.data[0]);
            
            columns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = this.formatColumnName(column);
                th.dataset.column = column;
                th.classList.add('sortable');
                th.addEventListener('click', () => this.sortData(column));
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
        }
        
        // Render body
        tbody.innerHTML = '';
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = this.formatCellValue(value);
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
        if (value === null || value === undefined) {
            return '-';
        }
        
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
        
        // Update buttons
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
        
        // Update pagination info
        const startItem = this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${this.filteredData.length} entries`;
        
        // Update page numbers
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
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
            loading.style.color = '#dc3545';
        }
    }
}

// Initialize the data table when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the prank page
    if (document.getElementById('dataTable')) {
        new DataTableManager();
    }
});