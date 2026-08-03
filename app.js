/**
 * ==========================================================================
 * Süreç Takip & Operasyon Paneli - İş Mantığı & Veri Yönetimi (SaaS & Supabase)
 * ==========================================================================
 */

// ==========================================================================
// SUPABASE YAPILANDIRMASI
// ==========================================================================
// NOT: Bu değerler boş bırakıldığında uygulama tarayıcının yerel hafızasıyla (Demo Modu) çalışır.
// Projenizi GitHub'a yüklediğinizde herkesin anında test edebilmesi için Demo Modu varsayılan olarak etkindir.
const SUPABASE_URL = ''; 
const SUPABASE_ANON_KEY = '';

let supabaseClient = null;
let isDemoMode = true;

// Supabase'i Başlatmayı Dene
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isDemoMode = false;
        console.log('Supabase Bulut Altyapısı Aktif.');
    } catch (e) {
        console.error('Supabase bağlantı hatası, Demo Moduna geçiliyor:', e);
        isDemoMode = true;
    }
} else {
    console.log('API anahtarları eksik. Demo Modu (LocalStorage) Etkin.');
}

// ==========================================================================
// UYGULAMA DURUMU (STATE)
// ==========================================================================
const state = {
    tasks: [],
    activities: [],
    currentUser: null,
    tempChecklist: [], 
    settings: {
        theme: 'dark',
        companyName: 'Örnek İşletme A.Ş.',
        defaultDept: 'Ar-Ge',
        profile: {
            name: 'Ahmet Yılmaz',
            role: 'Operasyon Yöneticisi',
            email: ''
        }
    }
};

// Varsayılan Süreç Kartları (Boş hesaplar için otomatik oluşturulur)
const initialTasks = [
    {
        id: 't-1',
        title: 'Mobil Uygulama Arayüz Tasarımı',
        desc: 'iOS ve Android için yeni arayüz tasarımlarının hazırlanması ve Figma üzerinden onaylatılması.',
        dept: 'Tasarım',
        priority: 'high',
        assignee: 'Ece Demir',
        dueDate: '2026-08-01',
        status: 'completed'
    },
    {
        id: 't-2',
        title: 'Banka Ödeme Entegrasyon Testleri',
        desc: 'Sanal POS API entegrasyonunun tamamlanıp test ortamında 3D secure ödeme denemelerinin yapılması.',
        dept: 'Ar-Ge',
        priority: 'high',
        assignee: 'Caner Yılmaz',
        dueDate: '2026-08-05',
        status: 'testing'
    },
    {
        id: 't-3',
        title: 'Sosyal Medya Lansman Kampanyası',
        desc: 'Yeni ürün lansmanı için haftalık içerik takviminin hazırlanması ve reklam bütçesinin optimize edilmesi.',
        dept: 'Pazarlama',
        priority: 'medium',
        assignee: 'Merve Çelik',
        dueDate: '2026-08-10',
        status: 'in-progress'
    },
    {
        id: 't-4',
        title: 'Yeni Depo Barkod Sistemi Entegrasyonu',
        desc: 'Depo stok hareketlerinin anlık takibi için el terminallerinin sisteme tanımlanması.',
        dept: 'Operasyon',
        priority: 'medium',
        assignee: 'Hakan Kaya',
        dueDate: '2026-08-15',
        status: 'planning'
    },
    {
        id: 't-5',
        title: 'İK İşe Alım Portalı Gereksinim Analizi',
        desc: 'Yeni aday takip sisteminin (ATS) kurulması öncesinde departman ihtiyaçlarının raporlanması.',
        dept: 'IK',
        priority: 'low',
        assignee: 'Zeynep Şahin',
        dueDate: '2026-08-20',
        status: 'new'
    }
];

const initialActivities = [
    { id: 'a-1', text: 'Sistem paneli başarıyla kuruldu ve başlatıldı.', taskTitle: 'Sistem Kurulumu', user: 'Sistem', time: 'Şimdi' }
];

// Grafikler ve Durum Map Değişkenleri
let performanceChartInstance = null;
let distributionChartInstance = null;

const statusMap = {
    'new': 'Yeni Talep',
    'planning': 'Planlama',
    'in-progress': 'Yürütülüyor',
    'testing': 'Test & Kontrol',
    'completed': 'Tamamlandı'
};

// ==========================================================================
// TOAST BİLDİRİM FONKSİYONU
// ==========================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================================================
// BAŞLANGIÇ & AUTH KONTROLÜ
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    checkSessionAndInit();
    setupEventListeners();
});

// Oturum Kontrolü ve Uygulamayı Yükleme
async function checkSessionAndInit() {
    // Tema ayarını erkenden yükle (Göz yorulmasını önlemek için)
    const savedTheme = localStorage.getItem('sp_theme') || 'dark';
    state.settings.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();

    if (!isDemoMode) {
        // Gerçek Supabase Oturum Kontrolü
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            state.currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata.full_name || session.user.email.split('@')[0],
                role: session.user.user_metadata.role || 'Operasyon Yetkilisi'
            };
            showAppView();
        } else {
            showAuthView();
        }

        // Supabase Oturum Değişiklik Dinleyicisi
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                state.currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata.full_name || session.user.email.split('@')[0],
                    role: session.user.user_metadata.role || 'Operasyon Yetkilisi'
                };
                showAppView();
            } else if (event === 'SIGNED_OUT') {
                state.currentUser = null;
                showAuthView();
            }
        });
    } else {
        // Demo Modu Oturum Kontrolü
        const demoSession = localStorage.getItem('sp_demo_session');
        if (demoSession) {
            state.currentUser = JSON.parse(demoSession);
            showAppView();
        } else {
            showAuthView();
        }
    }
}

// Görünümleri Gizle/Göster
function showAuthView() {
    document.getElementById('authContainer').classList.add('active');
    document.getElementById('demoBanner').style.display = 'none';
}

function showAppView() {
    document.getElementById('authContainer').classList.remove('active');
    
    if (isDemoMode) {
        document.getElementById('demoBanner').style.display = 'flex';
    } else {
        document.getElementById('demoBanner').style.display = 'none';
    }

    // Kullanıcı Profil Bilgisini Güncelle
    state.settings.profile.name = state.currentUser.name;
    state.settings.profile.role = state.currentUser.role;
    state.settings.profile.email = state.currentUser.email;
    updateProfileUI();

    // Verileri Yükle
    loadDataAndRender();
}

// Veritabanından (veya LocalStorage'dan) Verileri Çekme
async function loadDataAndRender() {
    if (!isDemoMode) {
        // 1. Supabase'den Görevleri Çek
        try {
            const { data: tasks, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (tasks && tasks.length > 0) {
                state.tasks = tasks;
            } else {
                // Eğer kullanıcının hiç verisi yoksa, başlangıç verilerini ekle
                state.tasks = [...initialTasks];
                for (let t of state.tasks) {
                    await supabaseClient.from('tasks').insert([{
                        title: t.title,
                        desc: t.desc,
                        dept: t.dept,
                        priority: t.priority,
                        assignee: t.assignee,
                        dueDate: t.dueDate,
                        status: t.status,
                        user_id: state.currentUser.id
                    }]);
                }
                // Tekrar çek
                const { data: refetched } = await supabaseClient.from('tasks').select('*');
                if (refetched) state.tasks = refetched;
            }
        } catch (e) {
            console.error('Supabase veri çekme hatası:', e);
        }

        // 2. Supabase'den Aktiviteleri Çek
        try {
            const { data: activities } = await supabaseClient
                .from('activities')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (activities && activities.length > 0) {
                state.activities = activities;
            } else {
                state.activities = [...initialActivities];
            }
        } catch (e) {
            console.error('Supabase aktivite çekme hatası:', e);
        }
    } else {
        // Demo Modu: LocalStorage'dan yükle (kullanıcıya özel anahtar ile)
        const userKey = state.currentUser.email;
        const storedTasks = localStorage.getItem(`sp_tasks_${userKey}`);
        const storedActivities = localStorage.getItem(`sp_activities_${userKey}`);

        if (storedTasks) {
            state.tasks = JSON.parse(storedTasks);
        } else {
            state.tasks = [...initialTasks];
            localStorage.setItem(`sp_tasks_${userKey}`, JSON.stringify(state.tasks));
        }

        if (storedActivities) {
            state.activities = JSON.parse(storedActivities);
        } else {
            state.activities = [...initialActivities];
            localStorage.setItem(`sp_activities_${userKey}`, JSON.stringify(state.activities));
        }
    }

    // İlk Görünümü Çiz
    routeView();
}

// Profil Arayüzünü Güncelle
function updateProfileUI() {
    document.getElementById('profileName').textContent = state.settings.profile.name;
    document.getElementById('profileRole').textContent = state.settings.profile.role;
    
    const initials = state.settings.profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('avatarName').textContent = initials;
}

// ==========================================================================
// OLAY DİNLEYİCİLERİ VE NAVİGASYON
// ==========================================================================
function setupEventListeners() {
    // Giriş / Kayıt Görünüm Geçişi
    document.getElementById('toRegisterLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginView').classList.remove('active');
        document.getElementById('registerView').classList.add('active');
    });

    document.getElementById('toLoginLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerView').classList.remove('active');
        document.getElementById('loginView').classList.add('active');
    });

    // Giriş Yapma İşlemi
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Kayıt Olma İşlemi
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Çıkış Yapma İşlemi
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Sekme/Navigasyon Menü Olayları
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            const view = item.getAttribute('data-view');
            window.location.hash = view;
            switchView(view);
        });
    });

    // Mobil Menü Butonu & Karartma Perdesi
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
    });

    // Mobil Yüzen Eylem Butonu (FAB) Olayı
    const mobileFab = document.getElementById('mobileFab');
    if (mobileFab) {
        mobileFab.addEventListener('click', () => openTaskModal());
    }

    // Tema Değiştirme
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Kanban Kart Ekleme ve Modallar
    document.getElementById('addCardBtn').addEventListener('click', () => openTaskModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    
    const taskModal = document.getElementById('taskModal');
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });

    document.getElementById('saveTaskBtn').addEventListener('click', saveTask);

    document.getElementById('addChecklistItemBtn').addEventListener('click', () => {
        const input = document.getElementById('newChecklistItem');
        const text = input.value.trim();
        if (text) {
            state.tempChecklist.push({ text, completed: false });
            input.value = '';
            renderModalChecklist();
        }
    });

    // Filtreler & Arama
    document.getElementById('taskSearchInput').addEventListener('input', renderTasksTable);
    document.getElementById('filterDepartment').addEventListener('change', renderTasksTable);
    document.getElementById('filterPriority').addEventListener('change', renderTasksTable);
    document.getElementById('filterStatus').addEventListener('change', renderTasksTable);

    // Yenile Butonu
    document.getElementById('refreshActivityBtn').addEventListener('click', () => {
        const btn = document.getElementById('refreshActivityBtn');
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => btn.style.transform = 'none', 500);
        loadDataAndRender();
    });
}

// Hash Yönlendirmesi
function routeView() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const activeItem = document.querySelector(`.sidebar-menu li[data-view="${hash}"]`);
    if (activeItem) {
        document.querySelectorAll('.sidebar-menu li').forEach(mi => mi.classList.remove('active'));
        activeItem.classList.add('active');
        switchView(hash);
    }
}

function switchView(viewName) {
    // Mobil elemanları kapat
    document.getElementById('appSidebar').classList.remove('mobile-open');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.classList.remove('active');

    // Yüzen butonun (FAB) görünürlüğünü ayarla
    const mobileFab = document.getElementById('mobileFab');
    if (mobileFab) {
        if (viewName === 'kanban' || viewName === 'tasks') {
            mobileFab.style.display = 'flex';
        } else {
            mobileFab.style.display = 'none';
        }
    }

    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) targetSection.classList.add('active');

    const titles = {
        'dashboard': 'Gösterge Paneli',
        'kanban': 'Süreç Takip Panosu (Kanban)',
        'tasks': 'Operasyonel Görev Listesi',
        'settings': 'Sistem Ayarları'
    };
    document.getElementById('viewTitle').textContent = titles[viewName] || 'Süreç Takip';

    if (viewName === 'dashboard') renderDashboard();
    else if (viewName === 'kanban') renderKanban();
    else if (viewName === 'tasks') renderTasksTable();
    else if (viewName === 'settings') renderSettings();
}

// Tema Kontrolü
function toggleTheme() {
    const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    state.settings.theme = newTheme;
    localStorage.setItem('sp_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcon();
    
    if (document.getElementById('view-dashboard').classList.contains('active')) {
        renderCharts();
    }
}

function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    if (state.settings.theme === 'dark') {
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        themeIcon.className = 'fa-solid fa-moon';
    }
}

// ==========================================================================
// ÜYELİK VE OTURUM (AUTH) FONKSİYONLARI
// ==========================================================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!isDemoMode) {
        // Gerçek Supabase Login
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            showToast('Giriş başarısız: ' + error.message, 'error');
        } else {
            showToast('Hoş geldiniz!', 'success');
        }
    } else {
        // Demo Girişi
        const users = JSON.parse(localStorage.getItem('sp_demo_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            state.currentUser = { id: user.id, email: user.email, name: user.name, role: user.role };
            localStorage.setItem('sp_demo_session', JSON.stringify(state.currentUser));
            showAppView();
        } else {
            // Eğer demo modunda ilk defa giriş yapılıyorsa ve kayıtlı değilse otomatik oluştur
            const demoUser = {
                id: 'demo-' + Date.now(),
                email: email,
                password: password,
                name: email.split('@')[0].toUpperCase(),
                role: 'Kurucu / Yönetici'
            };
            users.push(demoUser);
            localStorage.setItem('sp_demo_users', JSON.stringify(users));
            
            state.currentUser = demoUser;
            localStorage.setItem('sp_demo_session', JSON.stringify(state.currentUser));
            showAppView();
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!isDemoMode) {
        // Gerçek Supabase Kaydı
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    role: 'Operasyon Yöneticisi'
                }
            }
        });

        if (error) {
            alert('Kayıt başarısız: ' + error.message);
        } else {
            alert('Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın veya giriş yapın.');
            document.getElementById('registerView').classList.remove('active');
            document.getElementById('loginView').classList.add('active');
        }
    } else {
        // Demo Kaydı
        const users = JSON.parse(localStorage.getItem('sp_demo_users') || '[]');
        if (users.some(u => u.email === email)) {
            alert('Bu e-posta adresiyle zaten kayıtlı bir hesap var.');
            return;
        }

        const newUser = {
            id: 'demo-' + Date.now(),
            name,
            email,
            password,
            role: 'Operasyon Yetkilisi'
        };

        users.push(newUser);
        localStorage.setItem('sp_demo_users', JSON.stringify(users));
        
        alert('Demo hesabı başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
        document.getElementById('registerView').classList.remove('active');
        document.getElementById('loginView').classList.add('active');
    }
}

async function handleLogout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        if (!isDemoMode) {
            await supabaseClient.auth.signOut();
        } else {
            localStorage.removeItem('sp_demo_session');
            state.currentUser = null;
            showAuthView();
        }
    }
}

// Aktivite / Log Kaydetme
async function addActivity(text, taskTitle, user) {
    const newAct = {
        text,
        taskTitle,
        user,
        time: 'Şimdi'
    };

    if (!isDemoMode) {
        try {
            await supabaseClient.from('activities').insert([{
                text,
                taskTitle,
                user,
                user_id: state.currentUser.id
            }]);
        } catch (e) {
            console.error('Aktivite buluta kaydedilemedi:', e);
        }
    }

    // State'e ekle
    state.activities.unshift({ id: 'a-' + Date.now(), ...newAct });
    if (state.activities.length > 25) state.activities.pop();

    if (isDemoMode) {
        localStorage.setItem(`sp_activities_${state.currentUser.email}`, JSON.stringify(state.activities));
    }
}

// ==========================================================================
// 1. DASHBOARD İŞLEMLERİ
// ==========================================================================
function renderDashboard() {
    const tasks = state.tasks;
    
    const activeTasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'testing').length;
    const pendingTasks = tasks.filter(t => t.status === 'planning' || t.status === 'new').length;
    const criticalTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    document.getElementById('stat-active').textContent = activeTasks;
    document.getElementById('stat-pending').textContent = pendingTasks;
    document.getElementById('stat-critical').textContent = criticalTasks;
    document.getElementById('stat-completed').textContent = completedTasks;

    const activityContainer = document.getElementById('activityLogContainer');
    activityContainer.innerHTML = '';

    if (state.activities.length === 0) {
        activityContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Henüz bir işlem kaydı yok.</td></tr>`;
    } else {
        state.activities.slice(0, 5).forEach(act => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-circle-notch text-primary" style="font-size: 10px;"></i>
                        <span>${escapeHTML(act.text)}</span>
                    </div>
                </td>
                <td><span class="badge secondary">${act.taskTitle ? escapeHTML(act.taskTitle) : '-'}</span></td>
                <td><strong>${escapeHTML(act.user)}</strong></td>
                <td><span class="text-muted"><i class="fa-regular fa-clock"></i> ${formatActivityTime(act.created_at || act.time)}</span></td>
            `;
            activityContainer.appendChild(row);
        });
    }

    renderCharts();
}

function formatActivityTime(time) {
    if (!time) return 'Bilinmiyor';
    if (time === 'Şimdi' || time.includes('önce')) return time;
    
    // Supabase ISO string ise
    const date = new Date(time);
    if (!isNaN(date)) {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return time;
}

function renderCharts() {
    if (performanceChartInstance) performanceChartInstance.destroy();
    if (distributionChartInstance) distributionChartInstance.destroy();

    const isDark = state.settings.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const counts = { new: 0, planning: 0, 'in-progress': 0, testing: 0, completed: 0 };
    state.tasks.forEach(t => {
        if (counts[t.status] !== undefined) counts[t.status]++;
    });

    const distCtx = document.getElementById('distributionChart').getContext('2d');
    distributionChartInstance = new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: ['Yeni Talep', 'Planlama', 'Yürütülüyor', 'Test & Kontrol', 'Tamamlandı'],
            datasets: [{
                data: [counts.new, counts.planning, counts['in-progress'], counts.testing, counts.completed],
                backgroundColor: ['#06b6d4', '#f59e0b', '#4f46e5', '#ef4444', '#10b981'],
                borderWidth: isDark ? 2 : 1,
                borderColor: isDark ? '#0f172a' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor, font: { family: 'Inter', size: 11 } }
                }
            },
            cutout: '70%'
        }
    });

    const depts = ['Ar-Ge', 'Tasarım', 'Operasyon', 'Pazarlama', 'IK'];
    const deptCompleted = depts.map(d => state.tasks.filter(t => t.dept === d && t.status === 'completed').length);
    const deptAll = depts.map(d => state.tasks.filter(t => t.dept === d).length);

    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    performanceChartInstance = new Chart(perfCtx, {
        type: 'bar',
        data: {
            labels: depts,
            datasets: [
                {
                    label: 'Toplam Süreç',
                    data: deptAll,
                    backgroundColor: 'rgba(79, 70, 229, 0.4)',
                    borderColor: '#4f46e5',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Tamamlanan',
                    data: deptCompleted,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor, font: { family: 'Inter', size: 11 } }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter' } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter' }, stepSize: 1 },
                    beginAtZero: true
                }
            }
        }
    });
}

// ==========================================================================
// 2. KANBAN İŞLEMLERİ
// ==========================================================================
function renderKanban() {
    const statuses = ['new', 'planning', 'in-progress', 'testing', 'completed'];
    
    statuses.forEach(status => {
        const container = document.getElementById(`container-${status}`);
        const badge = document.getElementById(`badge-${status}`);
        container.innerHTML = '';
        
        const filteredTasks = state.tasks.filter(t => t.status === status);
        badge.textContent = filteredTasks.length;

        if (filteredTasks.length === 0) {
            container.innerHTML = `<div class="kanban-empty-placeholder" style="border: 2px dashed var(--border-color); border-radius: var(--border-radius-md); height: 60px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 12px; font-weight: 500;">Kart yok</div>`;
        }

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-id', task.id);
            
            const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date().setHours(0,0,0,0);
            const overdueTag = isOverdue ? '<span class="card-tag overdue">GECİKMİŞ</span>' : '';
            
            const totalItems = task.checklist ? task.checklist.length : 0;
            const completedItems = task.checklist ? task.checklist.filter(c => c.completed).length : 0;
            const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
            
            card.innerHTML = `
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <span class="card-tag ${task.priority}">${task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}</span>
                    ${overdueTag}
                </div>
                <h4 class="card-title">${escapeHTML(task.title)}</h4>
                <p class="card-desc">${escapeHTML(task.desc || 'Açıklama belirtilmedi.')}</p>
                
                ${totalItems > 0 ? `
                    <div class="checklist-progress">
                        <div class="checklist-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 8px;">
                        <i class="fa-solid fa-list-check"></i> ${completedItems}/${totalItems} Alt Görev
                    </div>
                ` : ''}

                <div class="card-meta">
                    <div class="card-assignee">
                        <span class="avatar-mini">${task.assignee ? task.assignee.slice(0,2).toUpperCase() : '??'}</span>
                        <span>${escapeHTML(task.assignee)}</span>
                    </div>
                    <div class="card-actions">
                        <button class="card-btn edit-task-btn" title="Düzenle"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="card-btn delete-task-btn" style="color: var(--danger);" title="Sil"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `;

            card.querySelector('.edit-task-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });

            card.querySelector('.delete-task-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            container.appendChild(card);
        });
    });

    setupDragAndDrop();
}

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const containers = document.querySelectorAll('.kanban-cards-container');

    cards.forEach(card => {
        card.addEventListener('dragstart', () => card.classList.add('dragging'));
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    containers.forEach(container => {
        const column = container.closest('.kanban-column');
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingCard = document.querySelector('.dragging');
            if (draggingCard) container.appendChild(draggingCard);
        });

        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            const draggingCard = document.querySelector('.dragging');
            if (draggingCard) {
                const taskId = draggingCard.getAttribute('data-id');
                const newStatus = column.getAttribute('data-status');
                await updateTaskStatus(taskId, newStatus);
            }
        });
    });
}

async function updateTaskStatus(taskId, newStatus) {
    const task = state.tasks.find(t => t.id == taskId); // Gevşek karşılaştırma (Supabase integer id döndürebilir)
    if (task && task.status !== newStatus) {
        const oldStatus = task.status;
        task.status = newStatus;

        if (!isDemoMode) {
            try {
                await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', taskId);
            } catch (e) {
                console.error('Bulut güncellenemedi:', e);
            }
        } else {
            localStorage.setItem(`sp_tasks_${state.currentUser.email}`, JSON.stringify(state.tasks));
        }
        
        await addActivity(
            `${state.currentUser.name}, "${task.title}" sürecini "${statusMap[newStatus]}" aşamasına taşıdı.`,
            task.title,
            state.currentUser.name
        );

        renderKanban();
    }
}

// ==========================================================================
// 3. OPERASYON TABLO İŞLEMLERİ
// ==========================================================================
function renderTasksTable() {
    const searchVal = document.getElementById('taskSearchInput').value.toLowerCase();
    const filterDept = document.getElementById('filterDepartment').value;
    const filterPri = document.getElementById('filterPriority').value;
    const filterStat = document.getElementById('filterStatus').value;

    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '';

    const filtered = state.tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchVal) || 
                              task.assignee.toLowerCase().includes(searchVal);
        const matchesDept = filterDept === 'all' || task.dept === filterDept;
        const matchesPri = filterPri === 'all' || task.priority === filterPri;
        const matchesStat = filterStat === 'all' || task.status === filterStat;

        return matchesSearch && matchesDept && matchesPri && matchesStat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);"><i class="fa-solid fa-folder-open" style="font-size: 24px; display: block; margin-bottom: 8px;"></i> Eşleşen süreç/görev bulunamadı.</td></tr>`;
        return;
    }

    filtered.forEach(task => {
        const row = document.createElement('tr');
        
        let priClass = 'secondary';
        let priText = 'Düşük';
        if (task.priority === 'high') { priClass = 'danger'; priText = 'Yüksek'; }
        else if (task.priority === 'medium') { priClass = 'warning'; priText = 'Orta'; }

        let statClass = 'secondary';
        if (task.status === 'new') statClass = 'info';
        else if (task.status === 'planning') statClass = 'warning';
        else if (task.status === 'in-progress') statClass = 'primary';
        else if (task.status === 'testing') statClass = 'danger';
        else if (task.status === 'completed') statClass = 'success';

        row.innerHTML = `
            <td><strong>${escapeHTML(task.title)}</strong></td>
            <td><span class="badge secondary">${escapeHTML(task.dept)}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="avatar-mini" style="background-color: var(--primary-hover);">${task.assignee ? task.assignee.slice(0,2).toUpperCase() : '??'}</span>
                    <span>${escapeHTML(task.assignee)}</span>
                </div>
            </td>
            <td><span class="badge ${priClass}">${priText}</span></td>
            <td><span style="font-size: 13px; font-weight: 500;"><i class="fa-regular fa-calendar-days text-muted"></i> ${formatDate(task.dueDate)}</span></td>
            <td><span class="badge ${statClass}">${statusMap[task.status]}</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-icon edit-task-row-btn" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-icon delete-task-row-btn" title="Sil"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;

        row.querySelector('.edit-task-row-btn').addEventListener('click', () => openTaskModal(task.id));
        row.querySelector('.delete-task-row-btn').addEventListener('click', () => deleteTask(task.id));

        tbody.appendChild(row);
    });
}

// ==========================================================================
// MODAL EKLEME VE DÜZENLEME
// ==========================================================================
function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('taskIdField').value = '';
    state.tempChecklist = [];
    renderModalChecklist();

    if (taskId) {
        const task = state.tasks.find(t => t.id == taskId);
        if (task) {
            modalTitle.textContent = 'Süreç Kartını Düzenle';
            document.getElementById('taskIdField').value = task.id;
            document.getElementById('taskTitleInput').value = task.title;
            document.getElementById('taskDescInput').value = task.desc || '';
            document.getElementById('taskDeptInput').value = task.dept;
            document.getElementById('taskPriorityInput').value = task.priority;
            document.getElementById('taskAssigneeInput').value = task.assignee;
            document.getElementById('taskDueDateInput').value = task.dueDate;
            document.getElementById('taskStatusInput').value = task.status;
            state.tempChecklist = task.checklist ? JSON.parse(JSON.stringify(task.checklist)) : [];
            renderModalChecklist();
        }
    } else {
        modalTitle.textContent = 'Yeni Süreç Kartı Oluştur';
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 5);
        document.getElementById('taskDueDateInput').value = defaultDate.toISOString().split('T')[0];
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
}

async function saveTask() {
    const form = document.getElementById('taskForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const taskId = document.getElementById('taskIdField').value;
    const title = document.getElementById('taskTitleInput').value.trim();
    const desc = document.getElementById('taskDescInput').value.trim();
    const dept = document.getElementById('taskDeptInput').value;
    const priority = document.getElementById('taskPriorityInput').value;
    const assignee = document.getElementById('taskAssigneeInput').value.trim();
    const dueDate = document.getElementById('taskDueDateInput').value;
    const status = document.getElementById('taskStatusInput').value;

    const taskPayload = {
        title,
        desc,
        dept,
        priority,
        assignee,
        dueDate,
        status,
        checklist: state.tempChecklist
    };

    if (taskId) {
        // GÜNCELLEME
        const taskIndex = state.tasks.findIndex(t => t.id == taskId);
        if (taskIndex > -1) {
            const oldStatus = state.tasks[taskIndex].status;
            
            if (!isDemoMode) {
                try {
                    await supabaseClient.from('tasks').update(taskPayload).eq('id', taskId);
                } catch (e) {
                    console.error('Bulut güncelleme hatası:', e);
                }
            }
            
            state.tasks[taskIndex] = { id: taskId, ...taskPayload };

            let logMsg = `${state.currentUser.name}, "${title}" kartını güncelledi.`;
            if (oldStatus !== status) {
                logMsg = `${state.currentUser.name}, "${title}" kartını "${statusMap[status]}" aşamasına getirdi.`;
            }
            await addActivity(logMsg, title, state.currentUser.name);
        }
    } else {
        // YENİ KAYIT
        let newId = 't-' + Date.now();
        if (!isDemoMode) {
            try {
                const { data, error } = await supabaseClient.from('tasks').insert([{
                    ...taskPayload,
                    user_id: state.currentUser.id
                }]).select();
                if (data && data[0]) newId = data[0].id;
            } catch (e) {
                console.error('Bulut kayıt hatası:', e);
            }
        }

        state.tasks.push({ id: newId, ...taskPayload });
        await addActivity(
            `${state.currentUser.name} yeni bir süreç başlattı: "${title}"`,
            title,
            state.currentUser.name
        );
    }

    if (isDemoMode) {
        localStorage.setItem(`sp_tasks_${state.currentUser.email}`, JSON.stringify(state.tasks));
    }

    closeModal();
    
    const activeSection = document.querySelector('.view-section.active');
    if (activeSection.id === 'view-dashboard') renderDashboard();
    else if (activeSection.id === 'view-kanban') renderKanban();
    else if (activeSection.id === 'view-tasks') renderTasksTable();

    showToast(taskId ? 'Kart güncellendi' : 'Yeni kart oluşturuldu', 'success');
}

function renderModalChecklist() {
    const container = document.getElementById('checklistContainer');
    if (!container) return;
    container.innerHTML = '';
    
    state.tempChecklist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'checklist-item';
        div.innerHTML = `
            <input type="checkbox" ${item.completed ? 'checked' : ''}>
            <span style="flex-grow: 1; font-size: 13px; ${item.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${escapeHTML(item.text)}</span>
            <button type="button" class="btn btn-icon btn-danger" style="width: 24px; height: 24px; padding: 0; font-size: 10px;"><i class="fa-solid fa-xmark"></i></button>
        `;
        
        div.querySelector('input').addEventListener('change', (e) => {
            state.tempChecklist[index].completed = e.target.checked;
            renderModalChecklist();
        });
        
        div.querySelector('.btn-danger').addEventListener('click', () => {
            state.tempChecklist.splice(index, 1);
            renderModalChecklist();
        });
        
        container.appendChild(div);
    });
}

async function deleteTask(taskId) {
    const task = state.tasks.find(t => t.id == taskId);
    if (!task) return;

    if (confirm(`"${task.title}" süreç kartını tamamen silmek istediğinize emin misiniz?`)) {
        if (!isDemoMode) {
            try {
                await supabaseClient.from('tasks').delete().eq('id', taskId);
            } catch (e) {
                console.error('Bulut silme hatası:', e);
            }
        }

        state.tasks = state.tasks.filter(t => t.id != taskId);
        
        if (isDemoMode) {
            localStorage.setItem(`sp_tasks_${state.currentUser.email}`, JSON.stringify(state.tasks));
        }

        await addActivity(
            `${state.currentUser.name}, "${task.title}" süreç kartını sildi.`,
            task.title,
            state.currentUser.name
        );

        showToast('Kart silindi', 'success');

        const activeSection = document.querySelector('.view-section.active');
        if (activeSection.id === 'view-dashboard') renderDashboard();
        else if (activeSection.id === 'view-kanban') renderKanban();
        else if (activeSection.id === 'view-tasks') renderTasksTable();
    }
}

// ==========================================================================
// 4. AYARLAR İŞLEMLERİ
// ==========================================================================
function renderSettings() {
    const tabContainer = document.getElementById('settings-tab-content');
    const activeTabBtn = document.querySelector('.settings-nav-btn.active');
    const tabName = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'general';

    if (tabName === 'general') {
        tabContainer.innerHTML = `
            <h3 style="margin-bottom: 16px; font-size: 16px; font-weight: 600;">Genel Panel Ayarları</h3>
            <div class="form-group">
                <label for="setCompanyName">Kuruluş / İşletme Adı</label>
                <input type="text" id="setCompanyName" class="form-control" value="${escapeHTML(state.settings.companyName || '')}">
            </div>
            <div class="form-group">
                <label for="setDefaultDept">Varsayılan Departman</label>
                <select id="setDefaultDept" class="form-control">
                    <option value="Ar-Ge" ${state.settings.defaultDept === 'Ar-Ge' ? 'selected' : ''}>Ar-Ge / Geliştirme</option>
                    <option value="Tasarım" ${state.settings.defaultDept === 'Tasarım' ? 'selected' : ''}>Tasarım</option>
                    <option value="Operasyon" ${state.settings.defaultDept === 'Operasyon' ? 'selected' : ''}>Operasyon</option>
                    <option value="Pazarlama" ${state.settings.defaultDept === 'Pazarlama' ? 'selected' : ''}>Pazarlama & Satış</option>
                    <option value="IK" ${state.settings.defaultDept === 'IK' ? 'selected' : ''}>İnsan Kaynakları</option>
                </select>
            </div>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <button class="btn btn-danger" id="resetMockDataBtn">
                    <i class="fa-solid fa-trash-arrow-up"></i> Tüm Verileri Sıfırla
                </button>
                <button class="btn btn-primary" id="saveGeneralSettingsBtn">Ayarları Kaydet</button>
            </div>
        `;

        document.getElementById('saveGeneralSettingsBtn').addEventListener('click', saveGeneralSettings);
        document.getElementById('resetMockDataBtn').addEventListener('click', resetMockData);

    } else if (tabName === 'profile') {
        tabContainer.innerHTML = `
            <h3 style="margin-bottom: 16px; font-size: 16px; font-weight: 600;">Kullanıcı Profili</h3>
            <div class="form-group">
                <label for="setProfileName">Ad Soyad</label>
                <input type="text" id="setProfileName" class="form-control" value="${escapeHTML(state.settings.profile.name)}">
            </div>
            <div class="form-group">
                <label for="setProfileRole">Görevi / Pozisyonu</label>
                <input type="text" id="setProfileRole" class="form-control" value="${escapeHTML(state.settings.profile.role)}" disabled>
                <small class="text-muted">Pozisyon ve rol üyelik aşamasında atanır.</small>
            </div>
            <div class="form-group">
                <label for="setProfileEmail">E-Posta Adresi</label>
                <input type="email" id="setProfileEmail" class="form-control" value="${escapeHTML(state.settings.profile.email)}" disabled>
            </div>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                <button class="btn btn-primary" id="saveProfileSettingsBtn">Profili Kaydet</button>
            </div>
        `;

        document.getElementById('saveProfileSettingsBtn').addEventListener('click', saveProfileSettings);
    }

    const settingsTabBtns = document.querySelectorAll('.settings-nav-btn');
    settingsTabBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', () => {
            settingsTabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
            newBtn.classList.add('active');
            renderSettings();
        });
    });
}

function saveGeneralSettings() {
    const compName = document.getElementById('setCompanyName').value.trim();
    const defDept = document.getElementById('setDefaultDept').value;

    if (!compName) {
        showToast('İşletme adı boş bırakılamaz.', 'warning');
        return;
    }

    state.settings.companyName = compName;
    state.settings.defaultDept = defDept;
    localStorage.setItem(`sp_settings_${state.currentUser.email}`, JSON.stringify(state.settings));

    addActivity(
        `${state.currentUser.name} genel sistem ayarlarını güncelledi.`,
        'Sistem Ayarları',
        state.currentUser.name
    );

    showToast('Ayarlar başarıyla kaydedildi.', 'success');
}

async function saveProfileSettings() {
    const profName = document.getElementById('setProfileName').value.trim();

    if (!profName) {
        alert('Lütfen ad soyad bilgisini girin.');
        return;
    }

    state.settings.profile.name = profName;
    state.currentUser.name = profName;

    if (!isDemoMode) {
        try {
            await supabaseClient.auth.updateUser({
                data: { full_name: profName }
            });
        } catch (e) {
            console.error('Bulut profil güncellenemedi:', e);
        }
    } else {
        // Demo oturumunu güncelle
        localStorage.setItem('sp_demo_session', JSON.stringify(state.currentUser));
        
        // Demo kullanıcı listesini güncelle
        const users = JSON.parse(localStorage.getItem('sp_demo_users') || '[]');
        const userIdx = users.findIndex(u => u.email === state.currentUser.email);
        if (userIdx > -1) {
            users[userIdx].name = profName;
            localStorage.setItem('sp_demo_users', JSON.stringify(users));
        }
    }

    updateProfileUI();

    await addActivity(
        `${profName} profil bilgilerini güncelledi.`,
        'Kullanıcı Profili',
        profName
    );

    alert('Profil bilgileri başarıyla güncellendi.');
}

function resetMockData() {
    if (confirm('Tüm süreç verileriniz silinecek ve varsayılan panel sıfırlanacaktır. Emin misiniz?')) {
        const userKey = state.currentUser.email;
        if (!isDemoMode) {
            // Supabase tablolarını sıfırlamak için tüm kayıtları silelim
            // (Gerçek hayatta sadece bu kullanıcının verilerini sileriz)
            alert('Bulut modunda sıfırlama işlemi için yöneticinizle görüşün veya verileri tablodan tek tek silin.');
        } else {
            localStorage.removeItem(`sp_tasks_${userKey}`);
            localStorage.removeItem(`sp_activities_${userKey}`);
            window.location.reload();
        }
    }
}

// ==========================================================================
// YARDIMCI METODLAR
// ==========================================================================
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}
