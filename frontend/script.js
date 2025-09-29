document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8000';

    // DOM 요소 캐싱
    const fileUpload = document.getElementById('file-upload');
    const docList = document.getElementById('document-list');
    const welcomeView = document.getElementById('welcome-view');
    const analysisView = document.getElementById('analysis-view');
    const docTitle = document.getElementById('document-title');
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    let activeFilename = null;

    const showLoader = (show, text = '처리 중...') => {
        loadingText.textContent = text;
        loadingOverlay.classList.toggle('hidden', !show);
    };

    const fetchAndRenderDocuments = async () => {
        try {
            const response = await fetch(`${API_URL}/documents`);
            if (!response.ok) throw new Error('서버 응답 오류');
            const documents = await response.json();
            docList.innerHTML = '';
            documents.forEach(filename => {
                const li = document.createElement('li');
                li.innerHTML = `<span>✅</span> ${filename}`;
                li.dataset.filename = filename;
                if (filename === activeFilename) {
                    li.classList.add('active');
                }
                docList.appendChild(li);
            });
        } catch (error) {
            console.error('문서 목록 로딩 실패:', error);
        }
    };

    const handleUpload = async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }
        showLoader(true, `${files.length}개 파일 처리 중...`);
        try {
            await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
            await fetchAndRenderDocuments();
        } catch (error) {
            console.error('업로드 실패:', error);
            alert('파일 업로드에 실패했습니다.');
        } finally {
            showLoader(false);
            event.target.value = '';
        }
    };

    const displayDocumentDetails = async (filename) => {
        if (activeFilename === filename) return;
        activeFilename = filename;
        document.querySelectorAll('#document-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.filename === filename);
        });
        
        showLoader(true, `'${filename}' 분석 결과 로딩 중...`);
        try {
            const response = await fetch(`${API_URL}/documents/${filename}`);
            const data = await response.json();

            welcomeView.classList.add('hidden');
            analysisView.classList.remove('hidden');

            docTitle.textContent = data.title;
            document.getElementById('summary-content').textContent = data.summary;
            document.getElementById('key-concepts').innerHTML = data.key_concepts.map(c => `<span class="tag">${c}</span>`).join('');
            document.getElementById('suggested-questions').innerHTML = data.suggested_questions.map(q => `<li>${q}</li>`).join('');

            // --- ✨ 수정된 부분 1: 마인드맵 데이터를 임시 저장 ---
            const mindmapParentContainer = document.getElementById('mindmap-content');
            const markdown = formatToMarkmap(data.mindmap_nodes);
            // 데이터를 바로 그리지 않고, HTML 요소의 dataset에 저장해둡니다.
            mindmapParentContainer.dataset.markdown = markdown;
            
            // 만약 마인드맵 탭이 이미 활성화 상태라면 바로 그려줍니다.
            if (document.querySelector('.tab-btn[data-tab="mindmap"]').classList.contains('active')) {
                renderMindmap();
            }

        } catch (error) {
            console.error('분석 결과 로딩 실패:', error);
            alert('분석 결과를 불러오는 데 실패했습니다.');
        } finally {
            showLoader(false);
        }
    };

    // --- ✨ 추가된 부분: 마인드맵을 그리는 함수 ---
    const renderMindmap = () => {
        const mindmapParentContainer = document.getElementById('mindmap-content');
        const markdown = mindmapParentContainer.dataset.markdown;

        if (!markdown) return; // 데이터가 없으면 실행 안함

        mindmapParentContainer.innerHTML = ''; // 기존 내용 삭제
        const newMarkmapDiv = document.createElement('div');
        newMarkmapDiv.classList.add('markmap');
        newMarkmapDiv.innerHTML = `<script type="text/template">${markdown}</script>`;
        mindmapParentContainer.appendChild(newMarkmapDiv);
        window.markmap.autoLoader.renderAll();
    };

    const formatToMarkmap = (nodes, depth = 1) => {
        if (!nodes) return '';
        return nodes.map(node => {
            const prefix = '#'.repeat(depth);
            let markdown = `${prefix} ${node.topic}\n`;
            if (node.children && node.children.length > 0) {
                markdown += formatToMarkmap(node.children, depth + 1);
            }
            return markdown;
        }).join('');
    };

    const addMessage = (text, sender) => {
        const message = document.createElement('div');
        message.classList.add('message', `${sender}-message`);
        message.textContent = text;
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const handleQuery = async () => {
        const question = chatInput.value.trim();
        if (!question) return;
        addMessage(question, 'user');
        chatInput.value = '';
        showLoader(true, 'AI 답변 생성 중...');
        try {
            const response = await fetch(`${API_URL}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            const data = await response.json();
            addMessage(data.answer, 'ai');
        } catch (error) {
            addMessage('답변 생성에 실패했습니다.', 'ai');
        } finally {
            showLoader(false);
        }
    };
    
    // --- 이벤트 리스너 ---
    fileUpload.addEventListener('change', handleUpload);
    docList.addEventListener('click', (event) => {
        const li = event.target.closest('li');
        if (li) displayDocumentDetails(li.dataset.filename);
    });

    // --- ✨ 수정된 부분 2: 탭 클릭 이벤트 리스너 ---
    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            // 모든 탭과 컨텐츠 비활성화
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            // 클릭된 탭과 컨텐츠 활성화
            const tabName = event.target.dataset.tab;
            event.target.classList.add('active');
            document.getElementById(`${tabName}-content`).classList.add('active');

            // 만약 클릭된 탭이 '마인드맵'이라면, 그리기 함수 호출
            if (tabName === 'mindmap') {
                renderMindmap();
            }
        });
    });

    sendButton.addEventListener('click', handleQuery);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleQuery(); });

    // --- 초기화 ---
    fetchAndRenderDocuments();
});