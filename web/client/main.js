import { Drones } from "../api/cust_collection.js";
import { Pods } from "../api/cust_collection.js";
import { Warehouses } from "../api/cust_collection.js";
import { Requests } from "../api/cust_collection.js";
import { Missions } from "../api/cust_collection.js";


var table_dependents = new Deps.Dependency;

var MAP_ZOOM = 15;

var Web3 = require('web3');

web3 = new Web3(new Web3.providers.HttpProvider("http://10.77.133.13:8545"));
/*
Meteor.startup(function() {  
	GoogleMaps.load({
		key: "AIzaSyBV9IdofwmFnGWT-hXUp5H3WUpe89PHrLw"
	});
});
*/
function getThings(user){
	if(user['profile']['type'] == "Drone"){
		return Drones;
	}
	else if(user['profile']['type'] == "Pod"){
		return Pods;
	}
}

Template.register.events({
	"submit form":function(event,template){
		event.preventDefault();
		var emailVar = template.find("#email").value;
		var passVar = template.find("#password").value;
		var typeVar = template.find("#type").value;
		var username = emailVar.substring(0,emailVar.indexOf('@'))
		console.log("Form submitted!");
		var id = Accounts.createUser({
			email: emailVar,
			password: passVar,
			profile: {
				username: username,
				type: typeVar
			}
		},
		function(error){
			template.find("#alert").style.display = "block";
			template.find("#alert").className = "alert alert-danger";
			template.find("#alert").innerHTML = "Registration failed!";
			//console.log(error.reason);
		});
		//roles = [];
		//roles.push(typeVar);
		//console.log(roles);
		//console.log(Roles.addUsersToRoles(id, roles, 'default-group'));
	}
});


Template.login.events({
	"submit form":function(event,template){
		event.preventDefault();
		var emailVar = template.find("#login_email").value;
		var passVar = template.find("#login_password").value;
		console.log("Form submitted!");
		Meteor.loginWithPassword(emailVar,passVar,function(error){
			template.find("#alert").style.display = "block";
			template.find("#alert").className = "alert alert-danger";
			template.find("#alert").innerHTML = "Snap..Login failed!";
			//console.log(error.reason);
		});
	}
});

Template.dashboard.events({
	"click .logout":function(event){
		event.preventDefault();
		Meteor.logout();
	},
	"click .add":function(event,template){
		event.preventDefault();
		console.log("adding");
	}
});

Template.addthing.events({
	"submit form":function(event,template){
		event.preventDefault();
		var namething = template.find("#name").value;
		var keything = template.find("#key").value;
		var lat = template.find("#latitude_addthing").value;
		var lng = template.find("#longitude_addthing").value;
		var type = template.find("#type").value;
		var user = Meteor.user();
		if(type == "Drone"){
			var Things = Drones;
		}
		else if(type == "Pod"){
			var Things = Pods;
		}
		else if(type == "Warehouse"){
			var Things = Warehouses;
		}
		//console.log("adding thing");
		//console.log(Things.find().fetch()[0]['user']);
		//console.log(Things.find(user._id).fetch()[0]);
		if(!Things.find(user._id).fetch()[0]){
			console.log("New user");
			Things.insert({
				_id: user._id,
				data:[{
					namething: namething,
					keything: keything,
					lat:lat,
					lng:lng
				},]
			});
		}else{
			console.log("New thing for the old user");
			Things.update(
				{"_id":user._id},
				{ "$addToSet":{ data:{
					namething:namething,
					keything:keything,
					lat:lat,
					lng:lng
				}
			}
		}
		);
			//console.log(Things.find(user._id).fetch()[0]);
		}
		//console.log(template);
		template.find("#alert").style.display = "block";
		//console.log(template.find("#alert"));
		table_dependents.changed();
	},
	"click #picklocation":function(event,template){
		event.preventDefault();
		$("#location_picker").modal('show');
	},
	"click #auto_fill":function(event,template){
		event.preventDefault();
		var secret = template.find("#secret_string").value;
		request = Requests.find(secret).fetch()[0];
		console.log(request);
		template.find("#name").value = request["namething"];
		template.find("#key").value = request["something"];
		template.find("#latitude_addthing").value = request["lat"];
		template.find("#longitude_addthing").value = request["lng"];
	}
});

Template.table.helpers({
	vals: function(template){
		table_dependents.depend();
		var things = getThings(Meteor.user());
		//console.log(things.find(Meteor.userId()).fetch()[0]['data']);
		if(things.find(Meteor.userId()).fetch()[0]['data'].length === 0){
			//document.getElementById("alert_table");
		}
		//console.log(template.find("#alert_table"));
		var temp = {
			col_name1: "Name",
			col_name2: "Something",
			col_name3: "Latitude",
			col_name4: "longitude",
			data: things.find(Meteor.userId()).fetch()[0]['data'].length > 0 ? things.find(Meteor.userId()).fetch()[0]['data']:undefined
		}
		return temp;
	}
});

Template.location_picker_template.events({
	"click #save":function(events,template){
		console.log("saving location");
		console.log("Saving location",document.getElementById('latitude').innerHTML,":",
			document.getElementById('longitude').innerHTML);
		$('#location_picker').modal('hide');
	}
});


Template.location_picker_template.onRendered(function(){
	var mapDiv = document.getElementById('map_pick_location');
	var markers = [];

	var test = new google.maps.LatLng(12.9189066,77.6478741);
	var map = new google.maps.Map(mapDiv, {
		center: test,
		zoom: MAP_ZOOM
	});
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			document.getElementById('latitude').innerHTML = position.coords.latitude;
			document.getElementById('longitude').innerHTML = position.coords.longitude;
			map.setCenter(new google.maps.LatLng(position.coords.latitude,position.coords.longitude));
		}, function() {
			console.log("Couldnot get geolocation!",error.reason);
		});
		//map.setCenter(new google.maps.LatLng(position.coords.latitude,position.coords.longitude));
	} else {
		console.log("browser doesnot support geolocation");
	}
	
	google.maps.event.addListener(map,'click',function(event) {
		if(markers.length == 0){
			console.log("creating marker");
			marker = new google.maps.Marker({
				position: event.latLng,
				map: map,
				title: 'Click Generated Marker',
				draggable:true
			});
			google.maps.event.addListener(marker,'dragend',function(event){
				document.getElementById('latitude').innerHTML = event.latLng.lat();
				document.getElementById('longitude').innerHTML = event.latLng.lng();
				document.getElementById('latitude_addthing').value = event.latLng.lat();
				document.getElementById('longitude_addthing').value = event.latLng.lng();
			});
			//console.log(event.latLng.lat(),":",event.latLng.lng());
			markers.push(marker);
			document.getElementById('latitude').innerHTML = event.latLng.lat();
			document.getElementById('longitude').innerHTML = event.latLng.lng();
			document.getElementById('latitude_addthing').value = event.latLng.lat();
			document.getElementById('longitude_addthing').value = event.latLng.lng();
		}
		console.log("inside listenet");
	});

});

Template.map.helpers({
	"drones":function(template){
		return Drones.find(Meteor.userId()).fetch()[0]["data"];
	},
	"pods":function(template){
		console.log(Pods.find().fetch()[0]["data"]);
		return Pods.find().fetch()[0]["data"];
	},
	"warehouses":function(template){
		return Warehouses.find(Meteor.userId()).fetch()[0]["data"];
		//return [];
	}

});

Template.map.onRendered(function(){
	table_dependents.depend();
	var map = document.getElementById('map_dashboard');
	console.log("map rendered");
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			document.getElementById('latitude').innerHTML = position.coords.latitude;
			document.getElementById('longitude').innerHTML = position.coords.longitude;
			map.setCenter(new google.maps.LatLng(position.coords.latitude,position.coords.longitude));
		}, function() {
			console.log("Couldnot get geolocation!");
		});
	} else {
		console.log("browser doesnot support geolocation");n
	}
	/*
	console.log(new google.maps.LatLng(parseFloat(document.getElementById('latitude').innerHTML),parseFloat(document.getElementById('longitude').innerHTML)));
	var lat = parseFloat(document.getElementById('latitude').innerHTML);
	var lon = parseFloat(document.getElementById('longitude').innerHTML);document
	
	var test = new google.maps.LatLng(lat,lon);
	*/
	var test = new google.maps.LatLng(12.9189066,77.6478741);
	var map = new google.maps.Map(map, {
		center: test,
		zoom: MAP_ZOOM
	});
	
	markers_drones = [];
	temps = Drones.find(Meteor.userId()).fetch()[0]['data'];
	var index;
	for(index = 0;index < temps.length;index++){
		temp = temps[index];
		marker = new google.maps.Marker({
			position:{lat:parseFloat(temp['lat']),lng:parseFloat(temp['lng'])},
			map:map,
			title:temp['namething'],
			icon:"drone.png"
		});
		markers_drones.push(marker);
	}


	markers_pods = [];
	temps = [];
	temps = Pods.find().fetch()[0]["data"];
	for(index = 0;index<temps.length;index++){
		temp = temps[index];
		marker = new google.maps.Marker({
			position:{lat:parseFloat(temp['lat']),lng:parseFloat(temp['lng'])},
			map:map,
			title:temp['keything'],
			icon:"plug.png"
		});
		markers_pods.push(marker);

	}

	markers_warehouses = [];
	temps = [];
	temps = Warehouses.find(Meteor.userId()).fetch()[0]["data"];
	for(index = 0;index<temps.length;index++){
		temp = temps[index];
		marker = new google.maps.Marker({
			position:{lat:parseFloat(temp['lat']),lng:parseFloat(temp['lng'])},
			map:map,
			title:temp['namething'],
			icon:"warehouse.png"
		});
		markers_warehouses.push(marker);
	}

	google.maps.event.addListener(map,'click',function(event){
		document.activeElement.value = event.latLng.lat()+","+event.latLng.lng();
	});
});


function create_best_route(src,dst){
	return {
		src:"src",
		dst:"dst",
		pods:["test1","test2"]
	}

}
Template.map.events({
	"click #route":function(events,template){
		events.preventDefault();
		var start = template.find("#start").value;
		var charge = template.find("#charge").value.split("(")[0];
		var stop = template.find("#stop").value;

		var start_option = template.find("#"+start);
		var charge_option = template.find("#"+charge);
		var stop_option = template.find("#"+stop);

		console.log(start_option["lat"]);

		
		
/*
		mission_details = create_best_route("src_latlng","dst_latlng");
		mission_id = Missions.insert({"mission":"mission_details"});
		message = {
			topics: [web3.fromAscii("mission_details")],
			payload: web3.fromAscii(mission_id),
		}
		res = web3.shh.post(message);
		console.log(message,res);
*/

	},
});
