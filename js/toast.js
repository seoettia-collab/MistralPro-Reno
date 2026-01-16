/* ========== TOAST NOTIFICATIONS ========== */

function showToast(text, type = 'success', subtext = '') {
    const toast = document.getElementById('successToast');
    const icon = toast.querySelector('.toast-icon');
    const textEl = document.getElementById('toastText');
    const subEl = document.getElementById('toastSub');
    
    textEl.textContent = text;
    subEl.textContent = subtext;
    
    toast.style.borderColor = type === 'success' ? 'var(--success)' : (type === 'error' ? 'var(--danger)' : (type === 'warning' ? 'var(--warning)' : 'var(--info)'));
    icon.textContent = type === 'success' ? '✅' : (type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : (type === 'loading' ? '⏳' : 'ℹ️')));
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), type === 'loading' ? 10000 : 4000);
}
