import { Meteor } from 'meteor/meteor';
import { Drones } from "../api/cust_collection.js";
import { Pods } from "../api/cust_collection.js";
import { Requests } from "../api/cust_collection.js";
import { Missions } from "../api/cust_collection.js";
var Api = new Restivus({
	useDefaultAuth: true,
	prettyJson: true
});
uptodate_gps = {};

//Api.addCollection(Drones);
//Api.addCollection(Pods);

Api.addRoute('request/:id',{authRequired:false},{
	get: function(){
		return Requests.find(this.urlParams.id).fetch();
	}
});

Api.addRoute('mission/:id',{authRequired:false},{
	get: function(){
		return Missions.find(this.urlParams.id).fetch();
	}
});

Api.addRoute("gps_update",{authRequired:false},{
	post: function(){
	uptodate_gps = {
			"lat":this.bodyParams["lat"],
			"lng":this.bodyParams["lng"]
		}
		return {status:"success"};
	},
	get: function(){
		return uptodate_gps;
	}
});

Api.addRoute('register/',{authRequired:false},{
	post: function (){
		request = {
			"type":this.bodyParams["type"],
			"namething":this.bodyParams["namething"],
			"something":this.bodyParams["something"],
			"lat":this.bodyParams["lat"],
			"lng":this.bodyParams["lng"],
			"address":this.bodyParams["address"]
		}
		id = Requests.insert(request);
		if(Requests.insert(request)){
			return {status:"success",id:id};
		}else{
			return {status:"error",id:id};
		}
	}
});

Api.addRoute('drones/gps/:id', {authRequired: false}, {
	get: function () {
		return Drones.findOne(this.urlParams.id)["data"];
	},
	post: function(){
		return {lat:this.bodyParams["lat"],lng:this.bodyParams["lng"]};
		/*if(Drones.update(
			{"_id":this.urlParams.id},
			{ "$addToSet":{ 
				data:{
					namething:Drone.find(this.urlParams.id).fetch[]
				}
			}
		})){
			return {status:"success",data:{message:"Updated gps"}};

		}*/
	}
});
