/* Views for our app
*  In backbone, views are both the controller and the view
*  They take the model, or collection (or nothing), and can
*  setup events to listen for, automatically update and render
*  when the model or collection changes, and help to seperate your
*  code, so that your view is less of a mangled mess of dom selectors
*  Basically we've moved the data from the dom to the model, and now
*  we use that model to 'render' our elements and add listeners.
*/


// Outer/top level view of the bands in the sidebar
// This view has a 'collection' of bands, but not a 
// single model, instead all rendering of each band
// is defered to the BandSideBarView instead
var BandSidebarListView = Backbone.View.extend({
	el: $('.band-list'),
	initialize: function(options){
		_.bindAll(this, 'render');

		if (this.collection === undefined){
			this.collection = new BandList();
		}
		this.graph = options.graph;
		this.collection.bind('add', this.appendBand);
		this.render();
	},
	render: function(){
		$(this.el).html('<ul></ul>');
		_(this.collection.models).each(function(band){
			this.appendBand(band);
		}, this);
	},
	appendBand: function(band){
		var bandSidebarView = new BandSideBarView({
			model: band,
			graph: this.graph
		});
		$('ul', this.el).not('.child').append(bandSidebarView.render().el);
	}
});

// Renders each individual band on the sidebar
// it has a model, of band, that it can listen to
// so when the state changes the render method will
// be called and the view changes
var BandSideBarView = Backbone.View.extend({
	tagName: 'li',
	className: 'band-sidebar',
	showingConn: false,
	initialize: function(options){
		_.bindAll(this, 'render', 'toggle', 'setStart', 'setEnd', 'changeElement');
		this.model.bind('change', this.render);
		this.graph = options.graph;
	},
	// First time seeing events, these will get attached to
	// our view here, and will call these events when triggered
	// They are in the form 'event', 'selector': 'functionName'
	events: {
		'click .b-name': 'toggle',
		'click .s-start': 'setStart',
		'click .s-end': 'setEnd'
	},
	render: function(){
		// Each band underneath our 'top' band will be added
		// as a sub-list to the current li of our band.
		var lis = [];
		this.model.bandList.each(function(band){
			lis.push(this.make('li', {}, band.get('name')));
		}, this);
		var child = this.make('ul', {class: 'child'}, lis);
		var state = this.model.get('state');
		var name = this.model.get('name');
		name = name.length > 22? name.slice(0,19)+"..." : name;
		var label = this.make('span', {class: 'label b-name '+state, id: this.model.id}, name);
		var start = this.make('span', {class: 'label success loc s-start'}, 'S');
		var end = this.make('span', {class: 'label important loc s-end'}, 'E');
		$(this.el).html(label).append(start).append(end);
		$(this.el).append(child);
		return this;
	},
	toggle: function(){
		if (this.showingConn){
			this.$('ul.child').slideUp();
		} else {
			this.$('ul.child').slideDown();
		}
		this.showingConn = !this.showingConn;
	},
	setStart: function(e){
		this.changeElement('start', 'end');
	},
	setEnd: function(e){
		this.changeElement('end', 'start');
	},
	changeElement: function(changeTo, check){
		// Set start and end both delegate to this method.
		// Sadly backbone doesn't allow us to pass arguements to the
		// events that we bind, so this is the next best thing to help
		// cutdown on repeated code, since the logic is the same for both,
		// just reversed.
		if (this.graph[changeTo] !== null){
			this.graph[changeTo].changeState(NodeState.blank);
		}
		this.graph[changeTo] = null;
		var statechange = changeTo === 'start'? NodeState.start : NodeState.end;
		this.model.changeState(statechange);
		this.graph[changeTo] = this.model;
		if (this.graph[check] === this.model){
			this.graph[check] = null;
		}
	}
});

// Our view for our 'nodes', or our circles with band names
// in them.  This view does not provide any standard 'dom'
// elements, instead it actually uses raphael.js and svg
// so it draws/defers to that for everything.  It also has
// a model of 'band', so it can listen to the same changes in 
// state and respond however we want.
var NodeView = Backbone.View.extend({
	edges: 0,
	radius: 0,
	start: '#46A546',
	end: '#C43C35',
	initialize: function(options){
		_.bindAll(this, 'render');
		this.paper = options.paper;
		this.radius = options.radius;
		this.model.bind('change', this.render);
		// All setup for raphael so that we can draw
		this.element = this.paper.circle();
		this.namePlate = this.paper.text();
		this.el = this.element.node;
	},
	render: function(){
		// This does the actual drawing of our circle nodes
		// Basically we draw a circle at x,y with spacing adjusted
		// for the radius.  We change the color based on the state
		// and then draw the name at the same location on-top of the
		// circle.  Note: SVG does not have a z-index so it uses a 'painters'
		// algo, so what's drawn first will be on bottom.
		var x = this.model.get('x') + this.radius;
		var y = this.model.get('y') + this.radius;
		var stroke = this.defaultColor;
		var state = this.model.get('state');
		if (state === NodeState.start){
			stroke = this.start;
		} else if (state === NodeState.end){
			stroke = this.end;
		}
		this.element.attr({
			cx: x,
			cy: y,
			r: this.radius,
			'stroke-width': 2,
			fill: '#dddddd',
			stroke: stroke,
			id: this.model.cid
		});
		this.namePlate.attr({
			x: x,
			y: y,
			text: this.model.get('name')
		});
		return this;
	}
});

// Main view that renders elements of nodes, edges,
// band side bar, and final path.  Holds a collection of
// bands that it operates on.  This is the most complex
// view we have as it helps kick off other views.
var GraphView = Backbone.View.extend({
	tagName: 'div',
	className: 'graph',
	template: _.template($('#graph-template').html()),
	maxConnections: 2,
	paper: null,
	start: null,
	end: null,
	rows: 0,
	cols: 6,
	nodeRadius: 25,
	initialize: function(){
		_.bindAll(this, 'render', 'pullBands', 'randomConnect', 'getLynchBands', 'prepareGraph', 'drawEdges');
		this.collection = new BandList();
		if(this.paper !== null){
			this.paper.clear();
		}
		this.paths = [];
		// Setting up the canvas for raphael
		$('#graph-canvas').show();
		this.paper = new Raphael($('#graph-canvas')[0], 798, 400);
		// Firefox doesn't like the width set with the constructor, so this helps
		$('svg').css('width', 798);
	},
	render: function(){
		// Relatively compex render, as it handles a lot
		// First part is just rendering all the bands and connections
		// to a simple text dispaly in the view
		$(this.el).html(this.template({bands: this.collection.models}));
		// These vars are used to help space out our nodes so they aren't
		// so jumbled together.
		var rCount =0, cCount=0;
		var xSpan = 133, ySpan = 125, xStart =0, yMod = 0;
		// If we need to, expand the height of the svg element to hold the elements
		var canHeight = (ySpan+this.nodeRadius) * this.rows;
		$('#graph-canvas').height(canHeight);
		$('svg').height(canHeight);

		// For each band, let's render it.  Simple, but what we
		// need to do is determine it's x/y location based on a way
		// that will allow us to show our edges as well, so we try
		// to space them out as much as possible.
		this.collection.each(function(band, index){
			// cCoutn and rCount are column/row count, and are where
			// in the 'grid' our node will go, mostly
			// xstart and ymod are spacers that move it around
			// on the x or y plane to show the edges better
			var x = band.get('x') + (cCount*xSpan) - xStart;
			var y = band.get('y') + (rCount*ySpan) + yMod;
			// we set the x/y coords here, so we can place it now
			band.set({x: x, y: y});
			// create a nodeView, pass the band as the model
			// the raphael object, and our radius
			var node = new NodeView({
				model: band,
				paper: this.paper,
				radius: this.nodeRadius
			});
			// render the node, it's now been place in the svg container
			node.render();
			// What follows is some additional logic to help space our
			// nodes apart.  This adds extra space in the y direction in
			// a rotating order of 0, 50, 70
			// change to mod with array?
			if (yMod == 0){
				yMod = yMod + 50;
			} else if (yMod == 50){
				yMod = yMod + 20;
			} else {
				yMod = 0;
			}
			// This increments our rCount and cCount to help start new
			// rows and keep at a set number of columns.
			if (index !== 0 && index%(this.cols-1) === 0){
				rCount++;
				cCount = 0;
				if (rCount%2 !== 0){
					xStart = 80;
					cCount++;
				} else {
					xStart = 0;
				}
			} else {
				cCount++;
			}	
		}, this);
		// All nodes are drawn, now we can draw the edges
		// we wait till after so that we can draw them in one
		// pass as all node x/y coords are known
		this.drawEdges();
		
		return this;
	},
	drawEdges: function(){
		// raphael method to clear our old paths
		_.each(this.paths, function(path){
			path.remove();
		});
		// we've figured out the min edges needed to draw
		// i.e. if we have 1,3 and 3,1, we only need to draw
		// 1,3 as 3,1 is really the same edge, as these are
		// undirected, or bi-directional
		_.each(this.edges.entrySet(), function(entry){
			// we are going through our 'entry' set of nodes
			// where the key is a node, and the value is a list
			// of nodes.  We're using the cid which is a uid (per page)
			// that backbone gives for us automagically, nice since we
			// have no proper id system in place without a backend.
			var start = this.collection.getByCid(entry.key);
			var toDraw = entry.value;
			var startX = start.get('x') + this.nodeRadius;
			var startY = start.get('y') + this.nodeRadius;
			_.each(toDraw, function(node){
				// At this point we have the x/y of our start, and have a list
				// of nodes to draw to, so now we just iterate through those
				// and pull up the models and find the end x/y points.
				// remember since edges are drawn after nodes, all the points
				// are already known and do not have to be moved around.
				var end = this.collection.getByCid(node);
				var toX = end.get('x') + this.nodeRadius;
				var toY = end.get('y') + this.nodeRadius;
				// this is just our pesky 'path' command to draw our line
				// means 'move to x,y, draw a line to x,y'
				var pathCommand = 'M'+startX+','+startY+' L'+toX+','+toY;
				var stroke = '#BFBFBF';
				// if our start and end point aren't blank, draw a colored line
				if (!start.stateIsBlank() && !end.stateIsBlank()){
					stroke = '#62CFFC';
				}
				// create path, draw on it, push it behind the nodes,
				// add it to a list of paths.
				var path = this.paper.path();
				path.attr({
					path: pathCommand,
					stroke: stroke
				});
				path.toBack();
				this.paths.push(path);
			}, this);						
		}, this);		
	},
	pullBands: function(){
		// Why am I pulling this via ajax?  Well atm it's jut a static file
		// Really this would make sense to be a call to some api that would
		// return our bands for us.  Time permitting, I'd like to have this
		// hit a page and return a list of bands retrived via a python scrapemark
		// script.  Also a note, when running this locally Chrome does not like 
		// for you to access files, so without '--allow-file-access-from-files'
		// you can't even pull it down.
		var that = this;
		$.ajax({
			url: "./extra/test_bands.txt",
			async: false,
			dataType: 'text',
			success: function(data){
				var bandArray = data.split("\n")
				_.each(bandArray, function(bandName){
					var band = new Band({name: bandName});
					that.collection.add(band);
				});
			}
		});
	},
	prepareGraph: function(){
		// preps our graph, in this case it's main function
		// is getting size and rows done, and then passing
		// through and pruning extra edges out
		// If we have the edge 1,3 and 1,4, then 3,1 and 4,1
		// are 'extra', as we don't need to draw them.
		var size = this.collection.size();
		this.rows = Math.ceil(size/this.cols);
		var edges = new Hash();
		this.collection.each(function(band){
			band.bandList.each(function(conn){
				var edgeList = edges.get(band.cid);
				if (edgeList === undefined){
					edgeList = [];
				}
				if (edges.get(conn.id) === undefined){
					edgeList.push(conn.cid);
					edges.put(band.cid, edgeList);
				}
			});
		}, this);
		this.edges = edges;	
	},
	getLynchBands: function(){
		// A Lynch band is a 'lynch-pin', in that they hold our
		// graph together.  We have one for every 3 bands.
		// All bands are attached to at least 1 lynch band, 
		// and all lynch bands are attached.
		var lynchNum = Math.ceil(this.collection.size()/3);
		var lynchBands = [];
		var order = _.range(this.collection.size());
		// Using a Fisher-Yates shuffle to randomly choose bands
		for(var i=order.length-1; i>0; i--){
			var ran = Math.floor(Math.random()*(i+1)); 
			var temp = order[i]; order[i] = order[ran]; 
			order[ran] = temp;
		}
		for(var i = 0; i < lynchNum; i++){
			lynchBands.push(this.collection.at(order[i]));
		}
		return lynchBands;
	},
	randomConnect: function(){
		// Lynch bands are used to insure we have a connected graph
		// Each band will be connected to at least 1 Lynch Band
		// And all Lynch bands will be connected to each other
		// Thus insuring a path exists from any u to v
		var lynchBands = this.getLynchBands();
		_.each(lynchBands, function(band, index, list){
			if (index < list.length-1){
				this.connectBands(lynchBands[index], lynchBands[index+1]);
			}
		}, this);
		this.collection.each(function(band){
			var links = Math.floor(1+Math.random()*this.maxConnections);
			if (!_.include(lynchBands, band)){
				var lynchRan = Math.floor(Math.random()*lynchBands.length);
				this.connectBands(band, lynchBands[lynchRan]);
				links--;				
			}
			var chooseFrom = _.filter(this.collection.models, function(otherBand){
				return (otherBand != band);
			});
			while(band.bandList.size() <= links){				
				var pick = Math.floor(Math.random()*(chooseFrom.length));
				var toAdd = chooseFrom[pick];
				this.connectBands(band, toAdd);
				chooseFrom.splice(pick,1);
			}
		}, this);
	},
	connectBands: function(from, to){
		// Don't re-add a band, just a safety check
		if (!from.bandList.include(to)){
			from.addBand(to);
		}
		if (!to.bandList.include(from)){
			to.addBand(from);
		}
	},
	showPath: function(current){
		// shows the path from 'current' node to the end
		// if you pass it the end node it, then we get a path
		// from end to start.
		var pathNode = current;
		var path =  [];
		while (pathNode !== null){
			var state = pathNode.get('state');
			// change the state to selected if we've used it, note
			// that this changed the color of our band in the
			// sidebar view, as it' listening to the same model
			if (state !== NodeState.start && state !== NodeState.end){
				pathNode.changeState(NodeState.selected);
			}
			path.push(pathNode.get('name'));
			pathNode = pathNode.get('parent');
		}
		// Re-draw edges.  This lets us color them!
		this.drawEdges();
		// Add number and text output of our path
		var pathString = this.make('div', {class: 'alert-message success'}, path.reverse().join(" -> "));
		$('.path').html(pathString);
		var countState = this.make('div', {class: 'hero-unit giant-text'}, path.length);
		$('.count-holder').html(countState);
	}
});

// Our Main view for our app, it kicks everything off
// and acts like a central controller.
var AppView = Backbone.View.extend({
	el: $('body'),
	buttonTemplate: _.template($('#button-template').html()),
	initialize: function(){
		_.bindAll(this, 'render', 'buildGraph', 'findPath', 'toggleFind');
		this.render();
		this.toggleFind(true);
	},
	events: {
		'click button#build-graph': 'buildGraph',
		'click button#find-path': 'findPath'
	},
	render: function(){
		// Our buttons, using underscore template for ease of use.
		this.$('.control').append(this.buttonTemplate({id: 'build-graph', name: 'Build Graph', type: ''}));
		this.$('.control').append(this.buttonTemplate({id: 'find-path', name: 'Find Path', type: 'primary'}));
	},
	buildGraph: function(){
		// Called from a button click on #build-graph
		$('#graph-canvas').html("");
		// we create a new graph, pull bands, connect, and 
		// reduce edges.  We also render the graph and start
		// the sidebar view up.
		this.graph = new GraphView();
		this.graph.pullBands();
		this.graph.randomConnect();
		this.graph.prepareGraph();
		this.$('.graph-view').html(this.graph.render().el);
		this.sideBar = new BandSidebarListView({
			collection: this.graph.collection,
			graph: this.graph
		});
		this.toggleFind(false);
		$('.path').html("");
	},
	toggleFind: function(on){
		if (on){
			$('#find-path').attr("disabled", "disabled");
		} else {
			$('#find-path').removeAttr("disabled");
		}
	},
	findPath: function(){
		// This is our path finding algo section
		// We use dijkstra's algorithm to find the least
		// cost path from start to end

		// If we're reusing the same graph, but changed locations we need
		// to cleanup the old values on our model
		this.graph.collection.each(function(band){
			if (band === this.graph.start || band === this.graph.end){
				band.clearAttr(false, false);
			} else {
				band.clearAttr(true, false);
			}
		}, this);
		// Our start and end nodes, this logic lets us run the path finding
		// if we forget to set one or both of our star/end points.  If we did
		// only set one, then it perserves that for us.
		var start = null, end = null;
		if (this.graph.start !== null){
			start = this.graph.start;
		} else {
			start = this.graph.collection.first();
			start.changeState(NodeState.start);
			this.graph.start = start;
		}
		if (this.graph.end !== null){
			end = this.graph.end;
		} else {
			var temp = this.graph.collection.last();
			if(start === temp){
				end = this.graph.collection.first();
				end.changeState(NodeState.end);
				this.graph.end = end;
			} else {
				end = temp;
				end.changeState(NodeState.end);
				this.graph.end = end;
			}
		}
		// Here is where everything is starting
		var current = null;
		// Our 'set' of unvisited nodes, min-binheap to eliminate having to sort
		// every step of the way
		var unvisited = new BinHeap(function(e){
			return e.get('cost');
		}, 'min');
		// Set our start cost to 0 (we're already there)
		// and everything else is infinity, meaning we don't know.
		start.set({cost: 0});
		
		this.graph.collection.each(function(band){
			unvisited.push(band);
		});

		// While we still have nodes/bands in our list
		// pull the best one out and go with it.
		while(unvisited.size() > 0){
			// this will return the band with the lowest cost
			current = unvisited.pop();

			// If we pulled up our 'end' node then we're finished!
			if(current === end){
				this.graph.showPath(current);
				break;
			}
			// for each connected band, look at the 'unvisited'
			// ones and compare cost, and if lower override and add
			// it's parent.
			current.bandList.each(function(band){
				if (!band.get('visited')){
					var cost = current.get('cost') + 1;
					if (cost < band.get('cost')){
						band.set({cost: cost, parent: current});
						unvisited.remove(band);
						unvisited.push(band);
					}
				}
			});
			// we've visited this node, we don't need to look at it again
			current.set({visited: true});
		}
	}
});