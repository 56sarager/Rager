const addedWords = new Set();
let score = 0;

function updateScoreDisplay() {
    document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
}

document.getElementById('wordInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        generateWordCloud();
    }
});

async function generateWordCloud() {
    const wordInput = document.getElementById('wordInput').value.trim();
    const wordCloudContainer = document.getElementById('wordCloud');

    if (!wordInput) {
        alert('Please enter a word');
        return;
    }

    if (addedWords.has(wordInput)) {
        alert('This word is already in the cloud. Please enter a different word.');
        score--;  
        updateScoreDisplay(); 
        return;
    }

    const response = await fetch(`https://api.datamuse.com/words?rel_trg=${wordInput}`);
    const data = await response.json();

    if (!data.length) {
        wordCloudContainer.innerHTML = '<p>No associated words found.</p>';
        return;
    }

    const associatedWord = data[0].word;

    if (addedWords.has(associatedWord)) {
        alert('The associated word is already in the cloud. Please enter a different word.');
        return;
    }

    addedWords.add(wordInput);
    addedWords.add(associatedWord);
    score += 1; 
    updateScoreDisplay();  

    const nodes = Array.from(addedWords).map((word, index) => ({ id: word, group: index }));
    const links = [];

    for (let i = 1; i < nodes.length; i++) {
        links.push({ source: nodes[i - 1].id, target: nodes[i].id });
    }

      wordCloudContainer.innerHTML = '';
      const width = window.innerWidth;
      const height = window.innerHeight;
      const svg = d3.select('#wordCloud').append('svg')
          .attr('width', width)
          .attr('height', height);

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX().strength(() => Math.random() * 0.2 - 0.1))
        .force('y', d3.forceY().strength(() => Math.random() * 0.2 - 0.1))
        .velocityDecay(0.8) 
        .on('tick', ticked);

    nodes.forEach(node => {
        node.vx = Math.random() * 2 - 1;
        node.vy = Math.random() * 2 - 1;
        node.x = Math.random() * width;
        node.y = Math.random() * height;
    });

    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke-width', 2)
        .attr('stroke', '#000');

    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .attr('class', 'word-node')
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text(d => d.id)
        .style('font-size', '14px')
        .style('font-family', 'Arial')
        .style('fill', '#333')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    function ticked() {
        link.attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('x', d => d.x)
            .attr('y', d => d.y);
    }

    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    document.getElementById('wordInput').value = '';
}
