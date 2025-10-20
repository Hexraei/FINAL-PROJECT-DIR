// ===================================================================================
// == DEPLOYMENT CONFIGURATION                                                      ==
// == For singular deployment on Render, this should be '/api'.                     ==
// ===================================================================================
const API_BASE_URL = '/api';
// ===================================================================================

document.addEventListener('DOMContentLoaded', init);

let logoutConfirmation = false;
let pageDataCache = []; // Generic cache for report data on a page

// --- GLOBAL HELPER FUNCTIONS ---
function saveToken(token) { localStorage.setItem('authToken', token); }
function getToken() { return localStorage.getItem('authToken'); }
function saveUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
}
function logoutWithConfirmation() {
    if (!logoutConfirmation) {
        showNotification('Click logout again to confirm', 'info');
        logoutConfirmation = true;
        setTimeout(() => { logoutConfirmation = false; }, 3000);
    } else {
        logout();
    }
}
function showNotification(message, type = 'success') {
    const color = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' }[type];
    const popup = document.createElement('div');
    popup.textContent = message;
    popup.className = `notification-popup ${color}`;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => document.body.removeChild(popup), 500);
    }, 4000);
}

// --- INITIALIZATION ROUTER ---
function init() {
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html')) initLoginPage();
    else if (path.endsWith('/register.html')) initRegisterPage();
    else if (path.endsWith('/forgot-password.html')) initForgotPasswordPage();
    else if (path.endsWith('/reset-password.html')) initResetPasswordPage();
    else if (path.endsWith('/official-entry.html')) initOfficialEntryPage();
    else if (path.endsWith('/reports-view.html')) initReportsViewPage();
    else if (path.endsWith('/product-management.html')) initProductManagementPage();
}

// --- AUTH PAGES ---
function initLoginPage() {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success) {
                saveToken(data.token);
                saveUser(data.user);
                if (data.backdoor) {
                    window.location.href = '/product-management.html';
                } else if (data.user.role === 'official') {
                    window.location.href = '/official-entry.html';
                } else {
                    window.location.href = '/reports-view.html';
                }
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) { showNotification('An error occurred during login.', 'error'); }
    });
}

function initRegisterPage() {
    const roleSelect = document.getElementById('role');
    const keyContainer = document.getElementById('official-key-container');
    roleSelect?.addEventListener('change', () => {
        if (roleSelect.value === 'official') {
            keyContainer.classList.remove('hidden');
        } else {
            keyContainer.classList.add('hidden');
        }
    });

    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
        };
        if (payload.role === 'official') {
            payload.officialKey = document.getElementById('officialKey').value;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                saveToken(data.token);
                saveUser(data.user);
                window.location.href = data.user.role === 'official' ? '/official-entry.html' : '/reports-view.html';
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) { showNotification('Registration failed.', 'error'); }
    });
}

function initForgotPasswordPage() {
    document.getElementById('forgot-password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
            const data = await res.json();
            if (data.success) {
                showNotification(data.message, 'success');
                window.location.href = '/reset-password.html';
            } else { showNotification(data.message, 'error'); }
        } catch (err) { showNotification('An error occurred.', 'error'); }
    });
}

function initResetPasswordPage() {
    document.getElementById('reset-password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const otp = document.getElementById('otp').value;
        const password = document.getElementById('password').value;
        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, password }) });
            const data = await res.json();
            if (data.success) {
                showNotification('Password reset! Redirecting to login...', 'success');
                setTimeout(() => window.location.href = '/', 2000);
            } else { showNotification(data.message, 'error'); }
        } catch (err) { showNotification('An error occurred.', 'error'); }
    });
}

// --- PRODUCT MANAGEMENT PAGE (BACKDOOR) ---
function initProductManagementPage() {
    const user = getUser();
    if (!user || user.role !== 'official') {
        window.location.href = '/';
        return;
    }
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    fetchAndRenderProducts();
}

async function fetchAndRenderProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data = await res.json();
        const listUl = document.getElementById('product-list-ul');
        listUl.innerHTML = '';
        if (data.success) {
            if (data.data.length === 0) {
                listUl.innerHTML = '<li class="py-2 px-4 text-center text-gray-500">No products found.</li>';
                return;
            }
            data.data.forEach(product => {
                const li = document.createElement('li');
                li.className = 'py-2 px-4 flex justify-between items-center';
                const productNameSpan = document.createElement('span');
                productNameSpan.textContent = product.name;
                li.appendChild(productNameSpan);
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = `&times;`;
                deleteButton.className = 'text-red-500 hover:text-red-700 font-bold text-xl px-2';
                deleteButton.title = `Delete ${product.name}`;
                deleteButton.onclick = () => handleDeleteProduct(product.id, product.name);
                li.appendChild(deleteButton);
                listUl.appendChild(li);
            });
        }
    } catch (error) { console.error('Error fetching products:', error); }
}

async function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('newProductName').value;
    try {
        const res = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Product added successfully!', 'success');
            e.target.reset();
            fetchAndRenderProducts();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) { showNotification('Failed to add product.', 'error'); }
}

async function handleDeleteProduct(productId, productName) {
    const confirmation = prompt(`This will permanently delete the master product "${productName}". This action cannot be undone. Type the product name to confirm.`);
    if (confirmation === productName) {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                showNotification('Product deleted successfully!', 'success');
                fetchAndRenderProducts();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) { showNotification('Failed to delete product.', 'error'); }
    } else if (confirmation !== null) {
        showNotification('The name did not match. Deletion cancelled.', 'error');
    }
}

// --- OFFICIAL ENTRY PAGE (PAGE 2) ---
function initOfficialEntryPage() {
    const user = getUser();
    if (!user || user.role !== 'official') {
        window.location.href = '/';
        return;
    }
    document.getElementById('user-info').textContent = `Welcome, ${user.username} (Official)`;
    document.getElementById('logout-button').addEventListener('click', logoutWithConfirmation);
    const dateInput = document.getElementById('entryDate');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    dateInput.max = today.toISOString().split("T")[0];
    dateInput.min = yesterday.toISOString().split("T")[0];
    dateInput.value = today.toISOString().split("T")[0];
    document.getElementById('data-entry-form').addEventListener('submit', handleCreateReport);
    fetchAndRenderOfficialTable();
    fetchProductMasterList();
}

async function fetchProductMasterList() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data = await res.json();
        if (data.success) {
            const datalist = document.getElementById('product-list');
            datalist.innerHTML = '';
            data.data.forEach(product => {
                datalist.innerHTML += `<option value="${product.name}">`;
            });
        }
    } catch (error) { console.error('Failed to fetch master products:', error); }
}

async function handleCreateReport(e) {
    e.preventDefault();
    const reportData = {
        productName: document.getElementById('productName').value,
        quantity: document.getElementById('quantity').value,
        entryDate: document.getElementById('entryDate').value,
    };
    try {
        const res = await fetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(reportData),
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Entry submitted!', 'success');
            e.target.reset();
            document.getElementById('entryDate').value = new Date().toISOString().split("T")[0];
            fetchAndRenderOfficialTable();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) { showNotification('Submission error.', 'error'); }
}

async function fetchAndRenderOfficialTable() {
    try {
        const res = await fetch(`${API_BASE_URL}/reports`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data = await res.json();
        if (data.success) {
            pageDataCache = data.data;
            renderOfficialTable(data.data);
        } else if (res.status === 401) logout();
    } catch (error) { console.error('Failed to fetch reports:', error); }
}

function renderOfficialTable(reports) {
    const tableBody = document.getElementById('reports-table-body');
    tableBody.innerHTML = '';
    reports.forEach(report => {
        const row = document.createElement('tr');
        const isEditable = (Date.now() - new Date(report.createdAt).getTime()) / 3600000 <= 48;
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${report.productName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.quantity}</td>
            <td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(report.entryDate).toLocaleDateString()}</td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.submittedByUsername}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium"></td>`;
        const actionsCell = row.cells[row.cells.length - 1];
        if (isEditable) {
            actionsCell.innerHTML = `
                <button class="text-indigo-600 hover:text-indigo-900 mr-4" onclick="showEditModal('${report.id}')">Edit</button>
                <button class="text-red-600 hover:text-red-900" onclick="handleDeleteReport('${report.id}')">Delete</button>`;
        } else {
            actionsCell.textContent = 'Locked';
        }
        tableBody.appendChild(row);
    });
}

async function handleDeleteReport(reportId) {
    if (confirm('Are you sure? This cannot be undone.')) {
        try {
            const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) {
                showNotification('Entry deleted.', 'success');
                fetchAndRenderOfficialTable();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) { showNotification('Deletion failed.', 'error'); }
    }
}

// --- REPORTS VIEW PAGE (PAGE 3) ---
let pieChartInstance, barChartInstance;
function initReportsViewPage() {
    const user = getUser();
    if (!user) { window.location.href = '/'; return; }
    document.getElementById('user-info').textContent = `Welcome, ${user.username}`;
    document.getElementById('logout-button').addEventListener('click', logoutWithConfirmation);
    const backButton = document.getElementById('back-button');
    if (user.role === 'official') {
        backButton.addEventListener('click', () => window.location.href = '/official-entry.html');
    } else {
        backButton.style.display = 'none';
    }
    const filterForm = document.getElementById('filter-form');
    filterForm.addEventListener('submit', e => { e.preventDefault(); fetchAndRenderReportViewData(); });
    filterForm.addEventListener('reset', () => setTimeout(fetchAndRenderReportViewData, 0));
    document.getElementById('export-button').addEventListener('click', handleExport);
    fetchProductMasterListForFilter();
    fetchAndRenderReportViewData();
}

async function fetchProductMasterListForFilter() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data = await res.json();
        if (data.success) {
            const productSelect = document.getElementById('filter-product');
            productSelect.innerHTML = '<option value="">All Products</option>';
            data.data.forEach(product => {
                productSelect.innerHTML += `<option value="${product.name}">${product.name}</option>`;
            });
        }
    } catch (error) { console.error('Failed to fetch metadata:', error); }
}

async function fetchAndRenderReportViewData() {
    const product = document.getElementById('filter-product').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    const query = new URLSearchParams({ product, startDate, endDate }).toString();
    try {
        const tableRes = await fetch(`${API_BASE_URL}/reports?${query}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const tableData = await tableRes.json();
        if (tableData.success) renderReportsViewTable(tableData.data);
        else if (tableRes.status === 401) logout();
        const summaryRes = await fetch(`${API_BASE_URL}/reports/summary?${query}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const summaryData = await summaryRes.json();
        if (summaryData.success) renderCharts(summaryData.data.quantityByProduct);
    } catch (error) { showNotification('Failed to load report data.', 'error'); }
}

function renderReportsViewTable(reports) {
    const tableBody = document.getElementById('reports-table-body');
    pageDataCache = reports;
    tableBody.innerHTML = '';
    reports.forEach(report => {
        const hasHistory = report.history && report.history.length > 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${report.productName}</td>
            <td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.quantity}</td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(report.entryDate).toLocaleDateString()}</td>
            <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.submittedByUsername}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"></td>`;
        const historyCell = row.cells[row.cells.length - 1];
        if (hasHistory) {
            historyCell.innerHTML = `<button class="text-blue-600 hover:underline" onclick="showHistoryModal('${report.id}')">View (${report.history.length})</button>`;
        } else {
            historyCell.textContent = 'None';
        }
        tableBody.appendChild(row);
    });
}

function renderCharts(summaryData) {
    const labels = summaryData.map(item => item._id);
    const data = summaryData.map(item => item.totalQuantity);
    const pieCtx = document.getElementById('pie-chart')?.getContext('2d');
    const barCtx = document.getElementById('bar-chart')?.getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();
    if (pieCtx) {
        pieChartInstance = new Chart(pieCtx, { type: 'pie', data: { labels, datasets: [{ label: 'Quantity', data, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'] }] } });
    }
    if (barChartInstance) barChartInstance.destroy();
    if (barCtx) {
        barChartInstance = new Chart(barCtx, { type: 'bar', data: { labels, datasets: [{ label: 'Total Quantity', data, backgroundColor: '#36A2EB' }] }, options: { scales: { y: { beginAtZero: true } } } });
    }
}

async function handleExport() {
    const product = document.getElementById('filter-product').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    const query = new URLSearchParams({ product, startDate, endDate }).toString();
    const exportUrl = `${API_BASE_URL}/reports/export?${query}`;
    showNotification('Generating your report...', 'info');
    try {
        const res = await fetch(exportUrl, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Export failed.');
        }
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        const disposition = res.headers.get('content-disposition');
        let filename = 'reports.xlsx';
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}


// --- MODAL UTILITIES ---
function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

function showEditModal(reportId) {
    const report = pageDataCache.find(r => r.id === reportId);
    if (!report) return;
    const modalHTML = `
        <div id="edit-report-modal" class="fixed z-10 inset-0 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 opacity-75"></div>
                <div class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform w-full max-w-lg">
                    <form id="edit-report-form">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Report</h3>
                            <input type="hidden" id="edit-report-id" value="${report.id}">
                            <div class="mb-4">
                                <label for="edit-productName" class="block text-sm font-medium">Product Name</label>
                                <input list="product-list" id="edit-productName" value="${report.productName}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                            </div>
                            <div class="mb-4">
                                <label for="edit-quantity" class="block text-sm font-medium">Quantity</label>
                                <input type="number" id="edit-quantity" value="${report.quantity}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                            </div>
                            <div class="mb-4">
                                <label for="edit-entryDate" class="block text-sm font-medium">Entry Date</label>
                                <input type="date" id="edit-entryDate" value="${new Date(report.entryDate).toISOString().split('T')[0]}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 sm:ml-3 sm:w-auto">Save</button>
                            <button type="button" onclick="closeModal()" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('edit-report-form').addEventListener('submit', handleEditFormSubmit);
    const editDateInput = document.getElementById('edit-entryDate');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    editDateInput.max = today.toISOString().split("T")[0];
    editDateInput.min = yesterday.toISOString().split("T")[0];
}

async function handleEditFormSubmit(e) {
    e.preventDefault();
    const reportId = document.getElementById('edit-report-id').value;
    const updatedData = {
        productName: document.getElementById('edit-productName').value,
        quantity: document.getElementById('edit-quantity').value,
        entryDate: document.getElementById('edit-entryDate').value,
    };
    try {
        const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(updatedData),
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Report updated!', 'success');
            closeModal();
            fetchAndRenderOfficialTable();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) { showNotification('Update error.', 'error'); }
}

function showHistoryModal(reportId) {
    const report = pageDataCache.find(r => r.id == reportId); // Use == for type flexibility
    if (!report || !report.history || report.history.length === 0) return;
    let historyHTML = report.history.map(entry => {
        const changes = Object.entries(entry.changes).map(([key, value]) =>
            `<li><strong>${key}:</strong> "${value.from}" → "${value.to}"</li>`
        ).join('');
        return `
            <div class="border-t py-2">
                <p class="font-semibold">${new Date(entry.modifiedAt).toLocaleString()} by ${entry.modifiedBy}</p>
                <ul class="list-disc list-inside text-sm text-gray-600">${changes}</ul>
            </div>`;
    }).join('');
    const modalHTML = `
        <div id="history-modal" class="fixed z-10 inset-0 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 opacity-75"></div>
                <div class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform w-full max-w-2xl">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Modification History for ${report.productName}</h3>
                        <div class="max-h-96 overflow-y-auto">${historyHTML}</div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" onclick="closeModal()" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 sm:w-auto">Close</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.getElementById('modal-container').innerHTML = modalHTML;
}