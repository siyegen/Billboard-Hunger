/* Binary Heap, modified from http://eloquentjavascript.net
*  A binary heap is a 'heap' data structure created using a
*  binary tree.  It is a complete binary tree and each node
*  is greater than or equal to (or less than or equal to) its
*  children.
*/

function BinHeap(compareTo, minMax){
	this.data = [];	
	this.compareTo = compareTo;
	this.minMax = minMax;
}

BinHeap.prototype = {
	push: function(element) {
		this.data.push(element);
		this.heapifyUp(this.data.length-1);
	},
	pop: function() {
		var result = this.data[0];
		var end = this.data.pop();
		if(this.data.length > 0){
			this.data[0] = end;
			this.heapifyDown(0);
		}
		return result;
	},
	remove: function(node) {
		var len = this.data.length;
		for(var i=0; i< len; i++){
			if(this.data[i] == node){
				var end = this.data.pop();
				if(i != len-1 ){
					this.data[i] = end;
					if(this.compareTo(end) < this.compareTo(node)){
						this.heapifyUp(i);
					} else {
						this.heapifyDown(i);
					}
				}
				return;
			}
		}
		console.log(node);
		throw new Error("Node not found: " + node);
	},
	heapifyUp: function(n){
		var element = this.data[n];
		while (n>0){
			var parentN = Math.floor((n + 1) / 2) -1,
				parent = this.data[parentN];
			if(this.compareTo(element) < this.compareTo(parent)){
				this.data[parentN] = element;
				this.data[n] = parent;
				n = parentN;
			}
			else {
				break;
			}
		}
	},
	heapifyDown: function(n){
		var len = this.data.length,
			element = this.data[n],
			elemCompared = this.compareTo(element);

		while(true){
			var child2N  = (n + 1) * 2, child1N = child2N - 1;
			var swap = null;
			if(child1N < len){
				var child1 = this.data[child1N],
					child1Compared = this.compareTo(child1);

				if(child1Compared < elemCompared){
					swap = child1N;
				}
			}

			if(child2N < len){
				var child2 = this.data[child2N],
					child2Compared = this.compareTo(child2);

				if(child2Compared < elemCompared){
					swap = child2N;
				}
			}

			if(swap !=null){
				this.data[n] = this.data[swap];
				this.data[swap] = element;
				n = swap;
			}
			else {
				break;
			}
		}
	},
	size: function() {
		return this.data.length;
	}
};