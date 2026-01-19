class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentProjectId = null;
        this.init();
    }

    init() {
        this.loadProjects();
        this.setupEventListeners();
        this.renderProjects();
    }

    // Загрузка проектов из localStorage
    loadProjects() {
        const saved = localStorage.getItem('projects');
        if (saved) {
            this.projects = JSON.parse(saved);
        }
    }

    // Сохранение проектов в localStorage
    saveProjects() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }

    // Создание нового проекта
    createProject(name) {
        const project = {
            id: Date.now().toString(),
            name: name.trim(),
            createdAt: new Date().toISOString(),
            images: []
        };
        
        this.projects.push(project);
        this.saveProjects();
        this.renderProjects();
        
        return project;
    }

    // Удаление проекта
    deleteProject(projectId) {
        if (confirm('Вы уверены, что хотите удалить этот проект? Все изображения также будут удалены.')) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.saveProjects();
            
            if (this.currentProjectId === projectId) {
                this.showProjectsPage();
            } else {
                this.renderProjects();
            }
        }
    }

    // Получение проекта по ID
    getProject(id) {
        return this.projects.find(p => p.id === id);
    }

    // Добавление изображения в проект
    addImageToProject(projectId, file) {
        const project = this.getProject(projectId);
        if (!project) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const image = {
                id: Date.now().toString(),
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target.result,
                uploadedAt: new Date().toISOString()
            };

            project.images.push(image);
            this.saveProjects();
            this.renderImages(projectId);
        };

        reader.readAsDataURL(file);
    }

    // Удаление изображения
    deleteImage(projectId, imageId) {
        const project = this.getProject(projectId);
        if (!project) return;

        if (confirm('Вы уверены, что хотите удалить это изображение?')) {
            project.images = project.images.filter(img => img.id !== imageId);
            this.saveProjects();
            this.renderImages(projectId);
        }
    }

    // Отображение страницы проектов
    showProjectsPage() {
        document.getElementById('projects-page').classList.add('active');
        document.getElementById('project-page').classList.remove('active');
        this.currentProjectId = null;
        this.renderProjects();
    }

    // Отображение страницы проекта
    showProjectPage(projectId) {
        const project = this.getProject(projectId);
        if (!project) return;

        this.currentProjectId = projectId;
        document.getElementById('projects-page').classList.remove('active');
        document.getElementById('project-page').classList.add('active');
        document.getElementById('project-title').textContent = project.name;
        this.renderImages(projectId);
    }

    // Рендеринг списка проектов
    renderProjects() {
        const container = document.getElementById('projects-list');
        
        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>Нет проектов</h3>
                    <p>Создайте свой первый проект, нажав кнопку "Создать проект"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.projects.map(project => {
            const date = new Date(project.createdAt).toLocaleDateString('ru-RU');
            const imageCount = project.images.length;
            
            return `
                <div class="project-card" onclick="projectManager.showProjectPage('${project.id}')">
                    <h3><i class="fas fa-folder"></i> ${this.escapeHtml(project.name)}</h3>
                    <p>Создан: ${date}</p>
                    <div class="project-meta">
                        <span><i class="fas fa-images"></i> ${imageCount} изображений</span>
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Рендеринг изображений проекта
    renderImages(projectId) {
        const container = document.getElementById('images-list');
        const project = this.getProject(projectId);
        
        if (!project || project.images.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <h3>Нет изображений</h3>
                    <p>Загрузите изображения, перетащив их в область выше или выбрав файлы</p>
                </div>
            `;
            return;
        }

        container.innerHTML = project.images.map(image => {
            const size = this.formatFileSize(image.size);
            const date = new Date(image.uploadedAt).toLocaleDateString('ru-RU');
            
            return `
                <div class="image-card">
                    <img src="${image.dataUrl}" style="cursor:pointer" onclick="openAnnotation('${projectId}', '${image.id}')">
                    <div class="image-info">
                        <h4>${this.escapeHtml(image.name)}</h4>
                        <div class="image-meta">
                            <span>${size}</span>
                            <span>${date}</span>
                            <button class="delete-image" onclick="projectManager.deleteImage('${projectId}', '${image.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка создания проекта
        document.getElementById('create-project-btn').addEventListener('click', () => {
            document.getElementById('create-project-modal').classList.add('active');
            document.getElementById('project-name').focus();
        });

        // Закрытие модального окна
        document.getElementById('close-modal').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('cancel-create').addEventListener('click', this.closeModal.bind(this));

        // Создание проекта
        document.getElementById('save-project').addEventListener('click', () => {
            const nameInput = document.getElementById('project-name');
            const name = nameInput.value.trim();
            const errorElement = document.getElementById('name-error');

            if (!name) {
                errorElement.textContent = 'Введите название проекта';
                errorElement.classList.add('show');
                return;
            }

            if (name.length > 100) {
                errorElement.textContent = 'Название не должно превышать 100 символов';
                errorElement.classList.add('show');
                return;
            }

            errorElement.classList.remove('show');
            this.createProject(name);
            this.closeModal();
            nameInput.value = '';
        });

        // Ввод с клавиатуры в модальном окне
        document.getElementById('project-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('save-project').click();
            }
        });

        // Возврат к проектам
        document.getElementById('back-to-projects').addEventListener('click', () => {
            this.showProjectsPage();
        });

        // Удаление проекта
        document.getElementById('delete-project-btn').addEventListener('click', () => {
            if (this.currentProjectId) {
                this.deleteProject(this.currentProjectId);
            }
        });

        // Загрузка файлов через input
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            e.target.value = '';
        });

        // Drag and drop
        const dropArea = document.getElementById('drop-area');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropArea.classList.add('dragover');
        }

        function unhighlight() {
            dropArea.classList.remove('dragover');
        }

        dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFiles(files);
        });

        // Закрытие модального окна при клике вне его
        document.getElementById('create-project-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('create-project-modal')) {
                this.closeModal();
            }
        });
    }

    // Обработка загруженных файлов
    handleFiles(files) {
        if (!this.currentProjectId) return;

        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) {
            alert('Пожалуйста, выберите только изображения (JPG, PNG, GIF, WebP)');
            return;
        }

        // Ограничение на количество одновременно загружаемых файлов
        if (imageFiles.length > 10) {
            alert('Можно загрузить не более 10 изображений за раз');
            return;
        }

        // Проверка размера файлов (макс 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        const oversizedFiles = imageFiles.filter(file => file.size > maxSize);
        
        if (oversizedFiles.length > 0) {
            alert(`Некоторые файлы превышают максимальный размер 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
            return;
        }

        // Загрузка файлов
        imageFiles.forEach(file => {
            this.addImageToProject(this.currentProjectId, file);
        });

        alert(`Успешно загружено ${imageFiles.length} изображений`);
    }

    // Закрытие модального окна
    closeModal() {
        document.getElementById('create-project-modal').classList.remove('active');
        document.getElementById('project-name').value = '';
        document.getElementById('name-error').classList.remove('show');
    }
}

class ImageAnnotator {
    constructor() {
        this.canvas = document.getElementById('annotation-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = document.getElementById('annotation-image');

        this.boxes = [];
        this.currentBox = null;
        this.drawing = false;
        this.imageId = null;

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'bbox-tooltip';
        document.body.appendChild(this.tooltip);

        this.initEvents();
    }

    open(image, projectId) {
        document.getElementById('project-page').classList.remove('active');
        document.getElementById('annotation-page').classList.add('active');

        this.image.src = image.dataUrl;
        this.imageId = image.id;

        this.image.onload = () => {
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            this.loadBoxes();
            this.render();
        };
    }

    initEvents() {
        this.canvas.addEventListener('mousedown', e => this.startDraw(e));
        this.canvas.addEventListener('mousemove', e => this.onMove(e));
        this.canvas.addEventListener('mouseup', e => this.endDraw(e));
    }

    startDraw(e) {
        this.drawing = true;
        const { x, y } = this.getMouse(e);
        this.currentBox = { x, y, width: 0, height: 0 };
    }

    onMove(e) {
        const { x, y } = this.getMouse(e);

        if (this.drawing) {
            this.currentBox.width = x - this.currentBox.x;
            this.currentBox.height = y - this.currentBox.y;
            this.render();
        } else {
            this.checkHover(x, y, e);
        }
    }

    endDraw() {
        if (!this.drawing) return;
        this.drawing = false;

        const className = prompt('Введите класс объекта:');
        if (!className) return;

        this.boxes.push({
            ...this.currentBox,
            id: Date.now().toString(),
            className
        });

        this.saveBoxes();
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.boxes.forEach(b => this.drawBox(b, 'red'));
        if (this.currentBox) this.drawBox(this.currentBox, 'blue');
    }

    drawBox(box, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    getMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    checkHover(x, y, e) {
        const box = this.boxes.find(b =>
            x > b.x && x < b.x + b.width &&
            y > b.y && y < b.y + b.height
        );

        if (box) {
            this.tooltip.style.display = 'block';
            this.tooltip.style.left = e.pageX + 10 + 'px';
            this.tooltip.style.top = e.pageY + 10 + 'px';
            this.tooltip.innerHTML =
                `Класс: ${box.className}<br>
                 x:${box.x}, y:${box.y}<br>
                 w:${box.width}, h:${box.height}`;
        } else {
            this.tooltip.style.display = 'none';
        }
    }

    saveBoxes() {
        localStorage.setItem(`boxes_${this.imageId}`, JSON.stringify(this.boxes));
    }

    loadBoxes() {
        const saved = localStorage.getItem(`boxes_${this.imageId}`);
        this.boxes = saved ? JSON.parse(saved) : [];
    }
}


const annotator = new ImageAnnotator();


// Инициализация приложения
const projectManager = new ProjectManager();

// Глобальные функции для использования в onclick атрибутах
window.projectManager = projectManager;
window.annotator = annotator;

window.openAnnotation = function (projectId, imageId) {
    const project = projectManager.getProject(projectId);
    const image = project.images.find(img => img.id === imageId);

    document.getElementById('project-page').classList.remove('active');
    document.getElementById('annotation-page').classList.add('active');

    annotator.open(image, projectId);
};

document.getElementById('back-to-project').onclick = () => {
    document.getElementById('annotation-page').classList.remove('active');
    document.getElementById('project-page').classList.add('active');
};