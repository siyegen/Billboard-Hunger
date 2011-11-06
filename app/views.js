// Views for our app

var GraphView = Backbone.View.extend({
	tagName: 'div',
	className: 'graph',
	template: _.template($('#graph-template').html()),
	maxConnections: 2,
	initialize: function(){
		_.bindAll(this, 'render', 'pullBands', 'randomConnect');		
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
				//$('#default-bands').html(data);
				var bandArray = data.split("\n")
				_.each(bandArray, function(bandName){
					var band = new Band({name: bandName});
					that.collection.add(band);										
				});
			}
		});
	},
	randomConnect: function(){
		var that = this;
		this.collection.each(function(band){
			var links = Math.floor(1+Math.random()*that.maxConnections);
			var chooseFrom = _.filter(that.collection.models, function(otherBand){
				return (otherBand.get('name') !== band.get('name'));
			});
			while(band.bandList.size() < links){				
				var pick = Math.floor(Math.random()*(chooseFrom.length));
				var toAdd = chooseFrom[pick];
				//band.addBand(toAdd);
				that.connectBands(band, toAdd);
				chooseFrom.splice(pick,1);
			}
		});
	},
	connectBands: function(from, to){
		if (!from.bandList.include(to)){
			from.addBand(to);
		}
		if (!to.bandList.include(from)){
			to.addBand(from);
		}
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
		this.toggleFind(false);
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

		// Our 'set' of unvisited nodes, min-binheap to eliminate having to sort
		// every step of the way
		var unvisited = new BinHeap(function(e){
			return e.get('cost');
		}, 'min');

		this.graph.collection.each(function(band){
			if (band.get('name') !== start.get('name')){
				unvisited.push(band);
			}
		});
	}
});