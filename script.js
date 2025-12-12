//Globals
let markovChain = {};
let allWords = [];
let transitionCounts = {};

//DOM elements
const elements = {
    inputText: document.getElementById('inputText'),
    buildChain: document.getElementById('buildChain'),
    generateText: document.getElementById('generateText'),
    loadSample: document.getElementById('loadSample'),
    clearAll: document.getElementById('clearAll'),
    wordCount: document.getElementById('wordCount'),
    generatedOutput: document.getElementById('generatedOutput'),
    transitionTable: document.getElementById('transitionTable'),
    stateCanvas: document.getElementById('stateCanvas'),
    tableHeader: document.getElementById('tableHeader'),
    diagramHeader: document.getElementById('diagramHeader'),
    tableContent: document.getElementById('tableContent'),
    diagramContent: document.getElementById('diagramContent'),
    statsSection: document.getElementById('statsSection'),
    statsHeader: document.getElementById('statsHeader'),
    statsContent: document.getElementById('statsContent'),
    topTransitions: document.getElementById('topTransitions'),
    showRestarts: document.getElementById('showRestarts'),
    enableParagraphs: document.getElementById('enableParagraphs'),
    paragraphCount: document.getElementById('paragraphCount'),
    paragraphControl: document.getElementById('paragraphControl'),
    searchNode: document.getElementById('searchNode'),
    resetZoom: document.getElementById('resetZoom')
};

//Diagram state
let diagramState = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    hoveredNode: null,
    selectedNode: null,
    nodePositions: {},
    currentChain: {},
    animationFrame: null
};

//Sample text
const sampleText = `Morning starts with quiet streets and cool air
People wake up slowly and prepare for the new day
Some make tea and some make coffee
Students pack their bags for school or college
Workers check their phones and plan their schedule
The city becomes busier with every passing minute

People walk to bus stops and metro stations
Traffic grows and vehicles move steadily
Shops open their shutters and arrange fresh items
The smell of food spreads through the street
Friends meet and talk about simple things
Everyone begins their day with a different goal

Afternoon brings noise and energy
Markets fill with people buying food and supplies
Students attend classes and complete assignments
Office workers type reports and join meetings
Some people eat lunch outside and enjoy the warm weather
The sun moves higher and the day feels fast

Evening brings calm to the city
Lights turn on and streets glow softly
Families return home after work
Children play outside until it gets dark
People buy snacks and talk with neighbors
The city slows down as the night arrives

Night is peaceful and quiet
Most people relax and finish their remaining tasks
Some watch movies or listen to music
Others read books and enjoy silence
The streets become empty and calm
The day ends and prepares for a new beginning`;

//Preprocessing
function tokenizeText(text) {
    const lowerText = text.toLowerCase();
    const tokens = lowerText
        .replace(/[.,!?;:()\[\]{}"'—–-]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 0);
    return tokens;
}

function validateInput(text) {
    if (!text || text.trim().length === 0) {
        alert('⚠️ Please enter some text before building the Markov chain!');
        return false;
    }
    return true;
}

//Build chain
function buildMarkovChain(words) {
    const chain = {};
    const counts = {};
    
    for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i];
        const nextWord = words[i + 1];
        
        if (!chain[currentWord]) {
            chain[currentWord] = [];
            counts[currentWord] = {};
        }
        
        chain[currentWord].push(nextWord);
        
        if (!counts[currentWord][nextWord]) {
            counts[currentWord][nextWord] = 0;
        }
        counts[currentWord][nextWord]++;
    }
    
    return { chain, counts };
}

function calculateProbabilities(counts) {
    const probabilities = {};
    
    for (const word in counts) {
        probabilities[word] = {};
        const total = Object.values(counts[word]).reduce((sum, count) => sum + count, 0);
        
        for (const nextWord in counts[word]) {
            probabilities[word][nextWord] = {
                count: counts[word][nextWord],
                probability: (counts[word][nextWord] / total).toFixed(3)
            };
        }
    }
    
    return probabilities;
}

//Generate text
function getRandomKey(obj) {
    const keys = Object.keys(obj);
    return keys[Math.floor(Math.random() * keys.length)];
}

function generateMarkovText(chain, wordCount, showRestarts, paragraphMode = false, paragraphCount = 1) {
    if (Object.keys(chain).length === 0) {
        return { html: "Error: No Markov chain available.", restartCount: 0, paragraphs: 0 };
    }
    
    if (paragraphMode) {
        let paragraphs = [];
        
        for (let p = 0; p < paragraphCount; p++) {
            let currentWord = getRandomKey(chain);
            let paragraphHTML = '';
            
            paragraphHTML += `<span class="paragraph-label">Paragraph ${p + 1}:</span> `;
            paragraphHTML += `${escapeHtml(currentWord)} `;
            
            for (let i = 1; i < wordCount; i++) {
                if (!chain[currentWord] || chain[currentWord].length === 0) {
                    break;
                }
                const possibleNext = chain[currentWord];
                currentWord = possibleNext[Math.floor(Math.random() * possibleNext.length)];
                paragraphHTML += `${escapeHtml(currentWord)} `;
            }
            
            paragraphs.push(paragraphHTML.trim());
        }
        
        return { html: paragraphs.join('</p><p>'), restartCount: 0, paragraphs: paragraphCount };
    } else {
        let currentWord = getRandomKey(chain);
        let outputHTML = '';
        let restartCount = 0;
        
        if (showRestarts) {
            outputHTML += `<span class="restart">${escapeHtml(currentWord)}</span> `;
        } else {
            outputHTML += `${escapeHtml(currentWord)} `;
        }
        
        for (let i = 1; i < wordCount; i++) {
            if (!chain[currentWord] || chain[currentWord].length === 0) {
                restartCount++;
                
                if (showRestarts) {
                    outputHTML += '<span class="restart-tag">[NEW START]</span> ';
                }
                
                currentWord = getRandomKey(chain);
                
                if (showRestarts) {
                    outputHTML += `<span class="restart">${escapeHtml(currentWord)}</span> `;
                } else {
                    outputHTML += `${escapeHtml(currentWord)} `;
                }
            } else {
                const possibleNext = chain[currentWord];
                currentWord = possibleNext[Math.floor(Math.random() * possibleNext.length)];
                outputHTML += `${escapeHtml(currentWord)} `;
            }
        }
        
        return { html: outputHTML.trim(), restartCount: restartCount, paragraphs: 0 };
    }
}

//UI rendering
function renderTransitionTable(probabilities) {
    if (Object.keys(probabilities).length === 0) {
        elements.transitionTable.innerHTML = '<p class="placeholder">Build a Markov chain to see the transition table...</p>';
        return;
    }
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Current Word</th>
                    <th>Next Word</th>
                    <th>Count</th>
                    <th>Probability</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const sortedWords = Object.keys(probabilities).sort();
    
    for (const word of sortedWords) {
        const transitions = probabilities[word];
        const sortedTransitions = Object.entries(transitions)
            .sort((a, b) => b[1].count - a[1].count);
        
        for (const [nextWord, data] of sortedTransitions) {
            const percentage = (data.probability * 100).toFixed(1);
            tableHTML += `
                <tr>
                    <td><strong>${escapeHtml(word)}</strong></td>
                    <td>${escapeHtml(nextWord)}</td>
                    <td>${data.count}</td>
                    <td>
                        ${data.probability} (${percentage}%)
                        <div class="probability-bar">
                            <div class="probability-fill" style="width: ${percentage}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    tableHTML += `</tbody></table>`;
    elements.transitionTable.innerHTML = tableHTML;
}

function renderTopTransitions(counts) {
    const allTransitions = [];
    
    for (const word in counts) {
        for (const nextWord in counts[word]) {
            allTransitions.push({
                from: word,
                to: nextWord,
                count: counts[word][nextWord]
            });
        }
    }
    
    allTransitions.sort((a, b) => b.count - a.count);
    const top10 = allTransitions.slice(0, 10);
    
    if (top10.length === 0) {
        elements.statsSection.style.display = 'none';
        return;
    }
    
    elements.statsSection.style.display = 'block';
    
    let html = '';
    top10.forEach((transition) => {
        html += `
            <div class="transition-item">
                <div>
                    <span class="transition-words">${escapeHtml(transition.from)}</span>
                    <span class="transition-arrow">→</span>
                    <span class="transition-words">${escapeHtml(transition.to)}</span>
                </div>
                <span class="transition-count">${transition.count}</span>
            </div>
        `;
    });
    
    elements.topTransitions.innerHTML = html;
}

function drawStateDiagram(chain) {
    diagramState.currentChain = chain;
    const canvas = elements.stateCanvas;
    const ctx = canvas.getContext('2d');
    
    const words = Object.keys(chain).slice(0, 20);
    
    if (words.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted');
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Build a Markov chain to see the diagram', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    //Calculate connection counts for color coding
    const connectionCounts = {};
    words.forEach(word => {
        connectionCounts[word] = chain[word] ? [...new Set(chain[word])].length : 0;
    });
    const maxConnections = Math.max(...Object.values(connectionCounts));
    
    //Position nodes in a circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 60;
    const angleStep = (2 * Math.PI) / words.length;
    
    diagramState.nodePositions = {};
    words.forEach((word, index) => {
        const angle = index * angleStep - Math.PI / 2;
        diagramState.nodePositions[word] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            connections: connectionCounts[word]
        };
    });
    
    renderDiagram();
}

function renderDiagram() {
    const canvas = elements.stateCanvas;
    const ctx = canvas.getContext('2d');
    const chain = diagramState.currentChain;
    const nodePositions = diagramState.nodePositions;
    const words = Object.keys(nodePositions);
    
    if (words.length === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    //zoom and pan
    ctx.translate(diagramState.offsetX, diagramState.offsetY);
    ctx.scale(diagramState.scale, diagramState.scale);
    
    const styles = getComputedStyle(document.body);
    const accentColor = styles.getPropertyValue('--accent-primary').trim();
    const textColor = styles.getPropertyValue('--text-primary').trim();
    const warningColor = styles.getPropertyValue('--accent-warning').trim();
    
    //transition frequencies for line thickness
    const transitionFreq = {};
    let maxFreq = 1;
    words.forEach(word => {
        if (!chain[word]) return;
        chain[word].forEach(nextWord => {
            const key = `${word}->${nextWord}`;
            transitionFreq[key] = (transitionFreq[key] || 0) + 1;
            maxFreq = Math.max(maxFreq, transitionFreq[key]);
        });
    });
    
    //connections
    words.forEach(word => {
        const from = nodePositions[word];
        if (!chain[word]) return;
        
        const uniqueNext = [...new Set(chain[word])];
        
        uniqueNext.forEach(nextWord => {
            if (nodePositions[nextWord]) {
                const to = nodePositions[nextWord];
                const key = `${word}->${nextWord}`;
                const freq = transitionFreq[key] || 1;
                const lineWidth = 1 + (freq / maxFreq) * 4;
                
                const isHighlighted = (diagramState.hoveredNode === word || diagramState.selectedNode === word);
                const isTarget = (diagramState.hoveredNode === nextWord || diagramState.selectedNode === nextWord);
                
                ctx.globalAlpha = isHighlighted ? 0.8 : (isTarget ? 0.4 : 0.2);
                ctx.strokeStyle = isHighlighted ? warningColor : accentColor;
                ctx.lineWidth = isHighlighted ? lineWidth + 2 : lineWidth;
                
                const controlX = (from.x + to.x) / 2 + (from.y - to.y) * 0.1;
                const controlY = (from.y + to.y) / 2 + (to.x - from.x) * 0.1;
                
                //glow effect for highlighted
                if (isHighlighted) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = warningColor;
                }
                
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
                ctx.stroke();
                
                ctx.shadowBlur = 0;
                
                //arrow
                const angle = Math.atan2(to.y - controlY, to.x - controlX);
                const arrowSize = isHighlighted ? 10 : 8;
                ctx.beginPath();
                ctx.moveTo(to.x, to.y);
                ctx.lineTo(
                    to.x - arrowSize * Math.cos(angle - Math.PI / 6),
                    to.y - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    to.x - arrowSize * Math.cos(angle + Math.PI / 6),
                    to.y - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = isHighlighted ? warningColor : accentColor;
                ctx.fill();
            }
        });
    });
    
    ctx.globalAlpha = 1;
    
    //nodes
    const maxConnections = Math.max(...Object.values(nodePositions).map(n => n.connections));
    
    words.forEach(word => {
        const pos = nodePositions[word];
        const isHovered = diagramState.hoveredNode === word;
        const isSelected = diagramState.selectedNode === word;
        const isSearched = elements.searchNode.value && word.includes(elements.searchNode.value.toLowerCase());
        
        //Color coding acc to connections
        const ratio = pos.connections / maxConnections;
        const nodeSize = isHovered || isSelected ? 30 : 25;
        
        //Hot/cold coloring
        const hue = 120 - (ratio * 60); // Green (120) to Yellow (60)
        const color = isSearched ? '#ff6b6b' : `hsl(${hue}, 70%, 50%)`;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeSize, 0, 2 * Math.PI);
        
        //Glow effect
        if (isHovered || isSelected || isSearched) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
        }
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = isHovered || isSelected ? '#ffffff' : textColor;
        ctx.lineWidth = isHovered || isSelected ? 3 : 2;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = (isHovered || isSelected ? 'bold 12px' : 'bold 11px') + ' Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayWord = word.length > 6 ? word.substring(0, 5) + '…' : word;
        ctx.fillText(displayWord, pos.x, pos.y);
    });
    
    ctx.restore();
    
    //tooltip
    if (diagramState.hoveredNode) {
        const word = diagramState.hoveredNode;
        const connections = chain[word] ? [...new Set(chain[word])].length : 0;
        const totalTransitions = chain[word] ? chain[word].length : 0;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 200, 70);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(`Word: ${word}`, 20, 30);
        ctx.font = '12px Inter';
        ctx.fillText(`Connections: ${connections}`, 20, 50);
        ctx.fillText(`Total transitions: ${totalTransitions}`, 20, 70);
    }
}

// Simple: Events
elements.buildChain.addEventListener('click', () => {
    const text = elements.inputText.value;
    
    if (!validateInput(text)) return;
    
    allWords = tokenizeText(text);
    
    if (allWords.length < 2) {
        alert('⚠️ Not enough data to build a Markov model. Please enter more text.');
        return;
    }
    
    const { chain, counts } = buildMarkovChain(allWords);
    markovChain = chain;
    transitionCounts = counts;
    
    const probabilities = calculateProbabilities(counts);
    
    renderTransitionTable(probabilities);
    renderTopTransitions(counts);
    drawStateDiagram(chain);
    
    elements.generateText.disabled = false;
    
    showSuccessMessage(`✅ Markov chain built successfully! Found ${Object.keys(chain).length} unique states.`);
});

elements.loadSample.addEventListener('click', () => {
    elements.inputText.value = sampleText;
    showSuccessMessage('📄 Sample text loaded successfully!');
});

elements.generateText.addEventListener('click', () => {
    const wordCount = parseInt(elements.wordCount.value) || 30;
    
    if (wordCount < 5 || wordCount > 500) {
        alert('⚠️ Please enter a word count between 5 and 500.');
        return;
    }
    
    const paragraphMode = elements.enableParagraphs.checked;
    const paragraphCount = paragraphMode ? (parseInt(elements.paragraphCount.value) || 3) : 1;
    
    if (paragraphMode && (paragraphCount < 1 || paragraphCount > 5)) {
        alert('⚠️ Please enter a paragraph count between 1 and 5.');
        return;
    }
    
    const showRestarts = elements.showRestarts.checked;
    const result = generateMarkovText(markovChain, wordCount, showRestarts, paragraphMode, paragraphCount);
    
    let outputHTML = `<p>${result.html}</p>`;
    
    if (paragraphMode && result.paragraphs > 0) {
        outputHTML += `
            <div class="restart-stats">
                <strong>Paragraph Mode:</strong> Generated ${result.paragraphs} paragraph${result.paragraphs !== 1 ? 's' : ''}, each with up to ${wordCount} words.
            </div>
        `;
    } else if (showRestarts && result.restartCount > 0) {
        outputHTML += `
            <div class="restart-stats">
                <strong>Chain Statistics:</strong> ${result.restartCount} restart${result.restartCount !== 1 ? 's' : ''} occurred during generation 
                (chain ended and restarted with a new random word).
            </div>
        `;
    }
    
    elements.generatedOutput.innerHTML = outputHTML;
    elements.generatedOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

elements.clearAll.addEventListener('click', () => {
    if (confirm('🗑️ Are you sure you want to clear all data?')) {
        markovChain = {};
        allWords = [];
        transitionCounts = {};
        
        elements.inputText.value = '';
        elements.generatedOutput.innerHTML = '<p class="placeholder">Generated text will appear here...</p>';
        elements.transitionTable.innerHTML = '<p class="placeholder">Build a Markov chain to see the transition table...</p>';
        elements.statsSection.style.display = 'none';
        
        const ctx = elements.stateCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.stateCanvas.width, elements.stateCanvas.height);
        
        elements.generateText.disabled = true;
    }
});

elements.enableParagraphs.addEventListener('change', () => {
    if (elements.enableParagraphs.checked) {
        elements.paragraphControl.style.display = 'block';
    } else {
        elements.paragraphControl.style.display = 'none';
    }
});

elements.statsHeader.addEventListener('click', () => {
    elements.statsHeader.classList.toggle('collapsed');
    elements.statsContent.classList.toggle('collapsed');
});

elements.tableHeader.addEventListener('click', () => {
    elements.tableHeader.classList.toggle('collapsed');
    elements.tableContent.classList.toggle('collapsed');
});

elements.diagramHeader.addEventListener('click', () => {
    elements.diagramHeader.classList.toggle('collapsed');
    elements.diagramContent.classList.toggle('collapsed');
});

//Canvas interactions
elements.stateCanvas.addEventListener('mousemove', (e) => {
    if (Object.keys(diagramState.nodePositions).length === 0) return;
    
    const rect = elements.stateCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - diagramState.offsetX) / diagramState.scale;
    const y = (e.clientY - rect.top - diagramState.offsetY) / diagramState.scale;
    
    if (diagramState.isDragging) {
        const dx = e.clientX - diagramState.dragStartX;
        const dy = e.clientY - diagramState.dragStartY;
        diagramState.offsetX += dx;
        diagramState.offsetY += dy;
        diagramState.dragStartX = e.clientX;
        diagramState.dragStartY = e.clientY;
        renderDiagram();
        elements.stateCanvas.style.cursor = 'grabbing';
        return;
    }
    
    //hover
    let hoveredWord = null;
    for (const word in diagramState.nodePositions) {
        const pos = diagramState.nodePositions[word];
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < 25) {
            hoveredWord = word;
            break;
        }
    }
    
    if (hoveredWord !== diagramState.hoveredNode) {
        diagramState.hoveredNode = hoveredWord;
        elements.stateCanvas.style.cursor = hoveredWord ? 'pointer' : 'grab';
        renderDiagram();
    }
});

elements.stateCanvas.addEventListener('mousedown', (e) => {
    if (Object.keys(diagramState.nodePositions).length === 0) return;
    
    const rect = elements.stateCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - diagramState.offsetX) / diagramState.scale;
    const y = (e.clientY - rect.top - diagramState.offsetY) / diagramState.scale;
    
    //click on node
    let clickedWord = null;
    for (const word in diagramState.nodePositions) {
        const pos = diagramState.nodePositions[word];
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < 25) {
            clickedWord = word;
            break;
        }
    }
    
    if (clickedWord) {
        diagramState.selectedNode = diagramState.selectedNode === clickedWord ? null : clickedWord;
        renderDiagram();
    } else {
        diagramState.isDragging = true;
        diagramState.dragStartX = e.clientX;
        diagramState.dragStartY = e.clientY;
        elements.stateCanvas.style.cursor = 'grabbing';
    }
});

elements.stateCanvas.addEventListener('mouseup', () => {
    diagramState.isDragging = false;
    if (diagramState.hoveredNode) {
        elements.stateCanvas.style.cursor = 'pointer';
    } else {
        elements.stateCanvas.style.cursor = 'grab';
    }
});

elements.stateCanvas.addEventListener('mouseleave', () => {
    diagramState.isDragging = false;
    diagramState.hoveredNode = null;
    elements.stateCanvas.style.cursor = 'grab';
    renderDiagram();
});

elements.stateCanvas.addEventListener('wheel', (e) => {
    if (Object.keys(diagramState.nodePositions).length === 0) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = diagramState.scale * delta;
    
    if (newScale >= 0.5 && newScale <= 3) {
        const rect = elements.stateCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        diagramState.offsetX = mouseX - (mouseX - diagramState.offsetX) * delta;
        diagramState.offsetY = mouseY - (mouseY - diagramState.offsetY) * delta;
        diagramState.scale = newScale;
        
        renderDiagram();
    }
});

elements.searchNode.addEventListener('input', () => {
    renderDiagram();
});

elements.resetZoom.addEventListener('click', () => {
    diagramState.scale = 1;
    diagramState.offsetX = 0;
    diagramState.offsetY = 0;
    diagramState.selectedNode = null;
    elements.searchNode.value = '';
    renderDiagram();
});

//Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'notification';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 3000);
}

function initializeTheme() {
    document.body.setAttribute('data-theme', 'dark');
}

function init() {
    initializeTheme();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
