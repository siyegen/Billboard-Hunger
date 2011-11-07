// Models and collections

var BandList = Backbone.Collection.extend({
	model: Band
});

// A Band object is our node object
// if we think about this as a graph
var Band = Backbone.Model.extend({
	defaults: {
		cost: Infinity,
		visited: false,
		parent: null,
		x: null,
		y: null,
		drawn: false,
	},
	initialize: function(){

		// Holds our list of connected bands
		// that this band is connected to
		this.bandList = new BandList();
		
	},
	addBandName: function(bandName){
		var band = new Band({name: bandName});
		this.addBand(band);
	},
	addBand: function(band){
		this.bandList.add(band);		
	},
	addBandsName: function(listBandNames){
		_.each(listBandNames, function(name){
			addBandName(name);
		});
	},
	addBands: function(listBands){
		_.each(listBands, function(band){
			addBand(band);
		});
	},
	clearBands: function(){
		this.bandList = new BandList();
	}
});
