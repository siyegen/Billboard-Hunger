// Views for our app

var BandSidebarListView = Backbone.View.extend({
	el: $('.band-list'),
	initialize: function(){
		_.bindAll(this, 'render', 'addBand');

		if (this.collection === undefined){
			this.collection = new BandList();
		}
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
			model: band
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
	initialize: function(){
		_.bindAll(this, 'render', 'toggle');
	},
	events: {
		'click': 'toggle'
	},
	render: function(){
		var lis = [];
		this.model.bandList.each(function(band){
			lis.push(this.make('li', {}, band.get('name')));
		}, this);
		var child = this.make('ul', {class: 'child'}, lis);
		$(this.el).html(this.model.get('name')).attr({'id': this.model.id});
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
	}
});

var GraphView = Backbone.View.extend({
	tagName: 'div',
	className: 'graph',
	template: _.template($('#graph-template').html()),
	maxConnections: 2,
	initialize: function(){
		_.bindAll(this, 'render', 'pullBands', 'randomConnect', 'getLynchBands');		
		this.collection = new BandList();
	},
	events: {
		
	},
	render: function(){
		$(this.el).html(this.template({bands: this.collection.models}));
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
				console.log(that.collection);
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
		var path = "";
		while (pathNode !== null){
			path += pathNode.get('name') + " -> ";
			pathNode = pathNode.get('parent');
		}
		$('.path').html(path);
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
		this.$('.content').append(this.buttonTemplate({id: 'build-graph', name: 'Build Graph'}));
		this.$('.content').append(this.buttonTemplate({id: 'find-path', name: 'Find Path'}));
	},
	buildGraph: function(){
		this.graph = new GraphView();
		this.graph.pullBands();
		this.graph.randomConnect();
		this.$('.graph-view').html(this.graph.render().el);
		this.sideBar = new BandSidebarListView({
			collection: this.graph.collection
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
		// Our start and end nodes
		var start = this.graph.collection.at(0);
		var end = this.graph.collection.at(2);
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