var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(process.argv[2])
});

var userInput = {
    vertexInit: function(vertexId) { return 10; }, // Initial pagerank score
    gatherFn: function(vertex, edge) { return edge.source.data / edge.source.outEdges.length;},
    sumFn: function(leftAccum, rightAccum) { return leftAccum + rightAccum;},
    applyFn: function (accum, vertex) { vertex.data = 0.15 + 0.85 * accum; },
    gatherEdges: (vertex) => vertex.inEdges,
    scatterEdges: (vertex) => vertex.outEdges,
    scatterFn: function(vertex, edge) { return true;}
}

function Edge(source, target) {
    this.source = source;
    this.target = target;
    source.addOutEdge(this);
    target.addInEdge(this);
}

function Vertex(vertexId) {
    this.vertexId = vertexId;
    this.data = userInput.vertexInit(vertexId);
    this.outEdges = [];
    this.inEdges = [];
}

Vertex.prototype.getAllEdgesIter = function () {
    var myIterable = {}
    myIterable[Symbol.iterator] = function* () {
        for( edge of vertex.inEdges) yield edge;
        for( edge of vertex.outEdges) yield edge;
    };
    return myIterable;
}

Vertex.prototype.addInEdge = function (edge) {
    this.inEdges.push(edge);
}

Vertex.prototype.addOutEdge = function (edge) {
    this.outEdges.push(edge);
}

function Graph() {
    this.vertices = []
}

Graph.prototype.getVertex = function (vertexId) {
    if (! vertexId in this.vertices) {
        this.vertices.length = vertexId + 1;
    }

    if (! this.vertices[vertexId]) {
        this.vertices[vertexId] = new Vertex(vertexId);
    }
    return this.vertices[vertexId];
}

Graph.prototype.concisePrint = function() {
    console.log(this.vertices.map((vertex) => [vertex.vertexId, vertex.data]));
}
Graph.prototype.doOneIteration = function () {
    // The fun begins here
    // Gather first

    var accums = this.vertices.map( (vertex) => {
        if (!vertex) return;
        var first = true;
        var accum = null;
        for (gEdge of userInput.gatherEdges(vertex)) {
            if (first) {
                accum = userInput.gatherFn(vertex, gEdge);
                first = false;
            } else {
                accum = userInput.sum(accum, userInput.gatherFn(vertex, gEdge));
            }
        }
        return accum;
    });

    // Apply
    for (index in this.vertices) {
        if (!this.vertices[index]) continue;
        userInput.applyFn(accums[index], this.vertices[index]);
    }

    // Scatter
    for (vertex of this.vertices) {
        if (!vertex) continue;
        for (sEdge of userInput.scatterEdges(vertex)) {
            userInput.scatterFn(vertex, sEdge);
        }
    }
}

graph = new Graph();

lineReader.on('line', function(line) {
    console.log(line);
    var pair = line.split(" ").map(Number);
    var source = graph.getVertex(pair[0]);
    var target = graph.getVertex(pair[1]);
    var edge = new Edge(source, target); //No need to add the edge to the graph for now. But that will come.
});

lineReader.on('close', () => {
    for (var i = 0; i < 200; i++) {
        graph.doOneIteration();
    }
        graph.concisePrint();
    //console.log(graph.vertices);
});
