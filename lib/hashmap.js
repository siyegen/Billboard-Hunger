function Hash(){
	this.db = {};
}

Hash.prototype = {
	put: function(key, value){
		this.db[key] = value;
	},
	get: function(key){
		var item = this.db[key];
		return item === undefined ? undefined : item;
	},
	contains: function(key){
		return this.db[key] === undefined ? false : true;		
	},
	remove: function(key){
		delete(this.db[key]);
	}
};