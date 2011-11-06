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
			for (var i=0; i< links; i++){				
				var pick = Math.floor(Math.random()*(chooseFrom.length));
				var toAdd = chooseFrom[pick];
				band.addBand(toAdd);
				chooseFrom.splice(pick,1);
			}
			console.log(band.bandList);
		});
	}
});


var AppView = Backbone.View.extend({
	el: $('body'),
	buttonTemplate: _.template($('#button-template').html()),
	initialize: function(){
		_.bindAll(this, 'render', 'buildGraph', 'findPath');
		this.render();		
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
	},
	findPath: function(){
		
	}
});