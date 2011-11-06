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
		parent: null
	},
	initialize: function(){

		// Holds our list of connected bands
		// that this band is connected to
		this.collection = new BandList();
		
	},
	addBandName: function(bandName){
		var band = new Band({name: bandName});
		this.addBand(band);
	},
	addBand: function(band){
		this.collection.add(band);		
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
		this.collection.each(function(band){
			band.destroy();
		});
		this.collection = new BandList();
	}
});