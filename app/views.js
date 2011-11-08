// Views for our app

var BandSidebarListView = Backbone.View.extend({
	el: $('.band-list'),
	initialize: function(options){
		_.bindAll(this, 'render', 'addBand');

		if (this.collection === undefined){
			this.collection = new BandList();
		}
		this.graph = options.graph;
		this.collection.bind('add', this.appendBand);
		this.render();
	},
	events: {
		
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
	},
	addBand: function(band){
		
	}
});

var BandSideBarView = Backbone.View.extend({
	tagName: 'li',
	className: 'band-sidebar',
	showingConn: false,
	initialize: function(options){
		_.bindAll(this, 'render', 'toggle', 'setStart', 'setEnd');
		this.model.bind('change', this.render);
		this.graph = options.graph;
	},
	events: {
		'click .b-name': 'toggle',
		'click .s-start': 'setStart',
		'click .s-end': 'setEnd'
	},
	render: function(){
		var lis = [];
		this.model.bandList.each(function(band){
			lis.push(this.make('li', {}, band.get('name')));
		}, this);
		var child = this.make('ul', {class: 'child'}, lis);
		var state = this.model.get('state');
		var label = this.make('span', {class: 'label b-name '+state, id: this.model.id}, this.model.get('name'));
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
		if (this.graph.start !== null){
			this.graph.start.changeState(NodeState.blank);
		}
		this.graph.start = null;
		this.model.changeState(NodeState.start);
		this.graph.start = this.model;
	},
	setEnd: function(e){
		if (this.graph.end !== null){
			this.graph.end.changeState(NodeState.blank);
		}
		this.graph.end = null;
		this.model.changeState(NodeState.end);
		this.graph.end = this.model;
	}
});

var NodeView = Backbone.View.extend({
	edges: 0,
	radius: 0,
	start: '#46A546',
	end: '#C43C35',
	travelled: '#BFBFBF',
	initialize: function(options){
		_.bindAll(this, 'render');
		this.paper = options.paper;
		this.radius = options.radius;
		this.model.bind('change', this.render);
		this.element = this.paper.circle();
		this.namePlate = this.paper.text();
		this.el = this.element.node;
		this.delegateEvents(this.events);
	},
	events: {
		
	},
	render: function(){
		var stroke = this.travelled;
		var state = this.model.get('state');
		if (state === NodeState.start){
			stroke = this.start;
		} else if (state === NodeState.end){
			stroke = this.end;
		}
		this.element.attr({
			cx: this.model.get('x') + this.radius,
			cy: this.model.get('y') + this.radius,
			r: this.radius,
			'stroke-width': 2,
			fill: 'none',
			stroke: stroke,
			id: this.model.cid
		});
		this.namePlate.attr({
			x: this.model.get('x')+this.radius,
			y: this.model.get('y')+this.radius,
			text: this.model.get('name')
		});
		/*this.paper.text(this.model.get('x')+this.radius, this.model.get('y')+this.radius, 
			this.model.get('name'));*/
		return this;
	}
});

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
		_.bindAll(this, 'render', 'pullBands', 'randomConnect', 'getLynchBands');
		this.collection = new BandList();
		if(this.paper !== null){
			this.paper.clear();
		}
		$('#graph-canvas').show();
		this.paper = new Raphael($('#graph-canvas')[0], 798, 400);
	},
	events: {
		
	},
	render: function(){
		$(this.el).html(this.template({bands: this.collection.models}));
		var rCount =0, cCount=0;
		var xSpan = 133, ySpan = 85, xStart =0;
		var canHeight = (ySpan+this.nodeRadius) * this.rows;
		$('#graph-canvas').height(canHeight);
		this.collection.each(function(band, index){
			var x = band.get('x') + (cCount*xSpan) - xStart;
			var y = band.get('y') + (rCount*ySpan);
			band.set({x: x, y: y});
			var node = new NodeView({
				model: band,
				paper: this.paper,
				radius: this.nodeRadius
			});
			node.render();
			if(index !== 0 && index%(this.cols-1) === 0){
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
		
		return this;
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
				var size = that.collection.size();
				that.rows = Math.ceil(size/that.cols);
			}
		});
	},
	getLynchBands: function(){
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
		if (!from.bandList.include(to)){
			from.addBand(to);
		}
		if (!to.bandList.include(from)){
			to.addBand(from);
		}
	},
	showPath: function(current){
		var pathNode = current;
		var path =  [];
		while (pathNode !== null){
			var state = pathNode.get('state');
			if (state !== NodeState.start && state !== NodeState.end){
				pathNode.changeState(NodeState.selected);
			}
			path.push(pathNode.get('name'));
			pathNode = pathNode.get('parent');
		}
		$('.path').html(path.reverse().join(" -> "));
	}
});


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
		this.$('.control').append(this.buttonTemplate({id: 'build-graph', name: 'Build Graph'}));
		this.$('.control').append(this.buttonTemplate({id: 'find-path', name: 'Find Path'}));
	},
	buildGraph: function(){
		$('#graph-canvas').html("");
		this.graph = new GraphView();
		this.graph.pullBands();
		this.graph.randomConnect();
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
		// cleanup the bands if we changed the start/end
		this.graph.collection.each(function(band){
			if (band === this.graph.start || band === this.graph.end){
				band.clearAttr(false, false);
			} else {
				band.clearAttr(true, false);
			}
		}, this);
		// Our start and end nodes
		var start = null, end = null;
		if (this.graph.start !== null){
			start = this.graph.start;
		} else {
			start = this.graph.collection.at(0);
			start.changeState(NodeState.start);
		}
		if (this.graph.end !== null){
			end = this.graph.end;
		} else {
			var temp = this.graph.collection.at(this.graph.collection.size()-1);
			if(start === temp){
				end = this.graph.collection.at(0);
				end.changeState(NodeState.end);
			} else {
				end = temp;
				end.changeState(NodeState.end);
			}
		}
		var current = null;

		console.log('Starting at: ' + start.get('name'));
		console.log('Ending at: ' + end.get('name'));

		// Our 'set' of unvisited nodes, min-binheap to eliminate having to sort
		// every step of the way
		var unvisited = new BinHeap(function(e){
			return e.get('cost');
		}, 'min');
		start.set({cost: 0});
		
		this.graph.collection.each(function(band){
			unvisited.push(band);
		});

		while(unvisited.size() > 0){
			current = unvisited.pop();

			if(current === end){
				this.graph.showPath(current);
				break;
			}

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
			current.set({visited: true});
		}

	}
});